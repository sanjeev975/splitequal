create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '', avatar_path text,
  default_currency text not null default 'INR' check (default_currency in ('INR','USD','GBP','EUR','AED','CAD','AUD')),
  time_zone text not null default 'Asia/Kolkata', created_at timestamptz not null default now());
create table groups (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 80),
  type text not null default 'custom', base_currency text not null default 'INR',
  archived_at timestamptz, created_by uuid not null references profiles(id), created_at timestamptz not null default now());
create table group_members (
  group_id uuid references groups on delete cascade, user_id uuid references profiles on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')), joined_at timestamptz not null default now(),
  primary key (group_id, user_id));
create table group_invitations (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references groups on delete cascade,
  token_hash text not null unique, invited_by uuid not null references profiles,
  expires_at timestamptz not null default now() + interval '7 days', used_at timestamptz, revoked_at timestamptz);
create table expenses (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references groups on delete cascade,
  title text not null, amount_minor bigint not null check (amount_minor > 0), currency text not null,
  expense_date date not null default current_date, category text not null default 'Other',
  split_method text not null, notes text, created_by uuid not null references profiles,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
-- Ledger: who PAID and who OWES are separate tables.
create table expense_payments (expense_id uuid references expenses on delete cascade, user_id uuid references profiles,
  amount_minor bigint not null check (amount_minor >= 0), primary key (expense_id, user_id));
create table expense_splits (expense_id uuid references expenses on delete cascade, user_id uuid references profiles,
  amount_minor bigint not null check (amount_minor >= 0), primary key (expense_id, user_id));
create table settlements (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references groups on delete cascade,
  from_user uuid not null references profiles, to_user uuid not null references profiles,
  amount_minor bigint not null check (amount_minor > 0), currency text not null, note text,
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  idempotency_key text not null, created_by uuid not null references profiles, created_at timestamptz not null default now(),
  check (from_user <> to_user), unique (group_id, idempotency_key));
create index on expenses (group_id, expense_date desc);
create index on settlements (group_id, status);

-- Balance (derived, never stored, per currency) = payments - splits + confirmed settlements sent - received.
create view group_net_balances with (security_invoker = true) as
select e.group_id, e.currency, u.user_id, sum(u.amt) as net_minor from (
  select expense_id, user_id, amount_minor as amt from expense_payments
  union all select expense_id, user_id, -amount_minor from expense_splits) u
join expenses e on e.id = u.expense_id group by 1,2,3
union all select group_id, currency, from_user, amount_minor from settlements where status='confirmed'
union all select group_id, currency, to_user, -amount_minor from settlements where status='confirmed';

create function is_group_member(g uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from group_members where group_id = g and user_id = auth.uid()) $$;
create function is_group_admin(g uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from group_members where group_id = g and user_id = auth.uid() and role in ('owner','admin')) $$;

alter table profiles enable row level security; alter table groups enable row level security;
alter table group_members enable row level security; alter table group_invitations enable row level security;
alter table expenses enable row level security; alter table expense_payments enable row level security;
alter table expense_splits enable row level security; alter table settlements enable row level security;

create policy p_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy p_peers on profiles for select using (exists (select 1 from group_members a join group_members b using (group_id) where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy g_read on groups for select using (is_group_member(id));
create policy g_update on groups for update using (is_group_admin(id));
create policy m_read on group_members for select using (is_group_member(group_id));
create policy m_remove on group_members for delete using (user_id = auth.uid() or is_group_admin(group_id));
create policy i_admin on group_invitations for all using (is_group_admin(group_id)) with check (is_group_admin(group_id));
create policy e_read on expenses for select using (is_group_member(group_id));
create policy ep_read on expense_payments for select using (exists (select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id)));
create policy es_read on expense_splits for select using (exists (select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id)));
create policy s_read on settlements for select using (is_group_member(group_id));
-- No direct write policies on groups/expenses/payments/splits/settlements: writes only via the SECURITY DEFINER functions below.

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function create_group(p_name text, p_type text, p_currency text) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into groups (name, type, base_currency, created_by) values (p_name, p_type, p_currency, auth.uid()) returning id into g;
  insert into group_members values (g, auth.uid(), 'owner'); return g; end $$;

-- Atomic expense creation; the DB re-checks the invariants the client already validated.
create function create_expense(p_group uuid, p_title text, p_amount bigint, p_currency text, p_date date, p_category text,
  p_method text, p_notes text, p_payments jsonb, p_splits jsonb) returns uuid language plpgsql security definer set search_path = public as $$
declare e uuid; begin
  if not is_group_member(p_group) then raise exception 'not a member'; end if;
  if (select coalesce(sum((x->>'amount')::bigint),0) from jsonb_array_elements(p_payments) x) <> p_amount then raise exception 'payments must equal total'; end if;
  if (select coalesce(sum((x->>'amount')::bigint),0) from jsonb_array_elements(p_splits) x) <> p_amount then raise exception 'splits must equal total'; end if;
  if exists (select 1 from jsonb_array_elements(p_payments || p_splits) x where not exists (select 1 from group_members where group_id = p_group and user_id = (x->>'user_id')::uuid)) then raise exception 'non-member in expense'; end if;
  insert into expenses (group_id,title,amount_minor,currency,expense_date,category,split_method,notes,created_by)
    values (p_group,p_title,p_amount,p_currency,p_date,p_category,p_method,p_notes,auth.uid()) returning id into e;
  insert into expense_payments select e,(x->>'user_id')::uuid,(x->>'amount')::bigint from jsonb_array_elements(p_payments) x;
  insert into expense_splits select e,(x->>'user_id')::uuid,(x->>'amount')::bigint from jsonb_array_elements(p_splits) x;
  return e; end $$;

-- Idempotent: a retry with the same key returns the original row.
create function record_settlement(p_group uuid, p_to uuid, p_amount bigint, p_currency text, p_note text, p_key text) returns uuid
language plpgsql security definer set search_path = public as $$
declare s uuid; begin
  if not is_group_member(p_group) or not exists (select 1 from group_members where group_id=p_group and user_id=p_to) then raise exception 'not a member'; end if;
  insert into settlements (group_id,from_user,to_user,amount_minor,currency,note,idempotency_key,created_by)
    values (p_group,auth.uid(),p_to,p_amount,p_currency,p_note,p_key,auth.uid())
    on conflict (group_id, idempotency_key) do nothing returning id into s;
  if s is null then select id into s from settlements where group_id = p_group and idempotency_key = p_key; end if;
  return s; end $$;
revoke all on function create_group, create_expense, record_settlement from public;
grant execute on function create_group, create_expense, record_settlement to authenticated;
