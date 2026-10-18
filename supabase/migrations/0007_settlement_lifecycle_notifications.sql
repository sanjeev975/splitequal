-- Settlement states: pending -> confirmed | rejected (by receiver) | cancelled (by payer); confirmed -> reversed (receiver/admin, reason required).
-- Only 'confirmed' ever affects balances, so rejected/cancelled/reversed rows stay as audit history and never double count.
alter table settlements drop constraint settlements_status_check;
alter table settlements add constraint settlements_status_check check (status in ('pending','confirmed','rejected','cancelled','reversed'));
alter table settlements add column resolution_note text, add column resolved_by uuid references profiles, add column resolved_at timestamptz;

create or replace function record_settlement(p_group uuid, p_to uuid, p_amount bigint, p_currency text, p_note text, p_key text) returns uuid
language plpgsql security definer set search_path = public as $$
declare s uuid; owed bigint; pend bigint; begin
  if not is_group_member(p_group) or not exists (select 1 from group_members where group_id = p_group and user_id = p_to) then raise exception 'not a member'; end if;
  select id into s from settlements where group_id = p_group and idempotency_key = p_key;
  if s is not null then return s; end if; -- retry returns the original, never a duplicate
  select -coalesce(sum(net_minor), 0) into owed from group_net_balances where group_id = p_group and user_id = auth.uid() and currency = p_currency;
  select coalesce(sum(amount_minor), 0) into pend from settlements where group_id = p_group and from_user = auth.uid() and currency = p_currency and status = 'pending';
  if p_amount <= 0 or p_amount > owed - pend then raise exception 'amount exceeds what you owe'; end if;
  insert into settlements (group_id, from_user, to_user, amount_minor, currency, note, idempotency_key, created_by)
    values (p_group, auth.uid(), p_to, p_amount, p_currency, nullif(trim(p_note), ''), p_key, auth.uid())
    on conflict (group_id, idempotency_key) do nothing returning id into s;
  if s is null then select id into s from settlements where group_id = p_group and idempotency_key = p_key; end if;
  return s; end $$;

create or replace function confirm_settlement(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin update settlements set status = 'confirmed', resolved_by = auth.uid(), resolved_at = now() where id = p_id and to_user = auth.uid() and status = 'pending';
  if not found then raise exception 'nothing to confirm'; end if; end $$;
create function reject_settlement(p_id uuid, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin update settlements set status = 'rejected', resolution_note = nullif(trim(p_note), ''), resolved_by = auth.uid(), resolved_at = now() where id = p_id and to_user = auth.uid() and status = 'pending';
  if not found then raise exception 'nothing to reject'; end if; end $$;
create function cancel_settlement(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin update settlements set status = 'cancelled', resolved_by = auth.uid(), resolved_at = now() where id = p_id and from_user = auth.uid() and status = 'pending';
  if not found then raise exception 'nothing to cancel'; end if; end $$;
create function reverse_settlement(p_id uuid, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare g uuid; t uuid; begin
  if coalesce(trim(p_note), '') = '' then raise exception 'a reason is required'; end if;
  select group_id, to_user into g, t from settlements where id = p_id and status = 'confirmed';
  if g is null or not (t = auth.uid() or is_group_admin(g)) then raise exception 'not authorized'; end if;
  update settlements set status = 'reversed', resolution_note = trim(p_note), resolved_by = auth.uid(), resolved_at = now() where id = p_id; end $$;

create table notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, group_id uuid references groups on delete cascade,
  type text not null, title text not null, body text, link text, dedupe_key text not null, read_at timestamptz, created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)); -- retried events can't create duplicates
create index on notifications (user_id, created_at desc);
alter table notifications enable row level security;
create policy n_read on notifications for select using (user_id = auth.uid()); -- no client writes; created by triggers, read-state via RPC

create function notify(p_user uuid, p_group uuid, p_type text, p_title text, p_body text, p_link text, p_key text) returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, group_id, type, title, body, link, dedupe_key) values (p_user, p_group, p_type, p_title, p_body, p_link, p_key) on conflict (user_id, dedupe_key) do nothing $$;
revoke all on function notify from public;
create function mark_notifications_read(p_ids uuid[] default null) returns void language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids)) $$;
revoke all on function mark_notifications_read from public; grant execute on function mark_notifications_read to authenticated;

-- Messages intentionally omit amounts: only who/what/where.
create function notify_expense() returns trigger language plpgsql security definer set search_path = public as $$
declare r record; m record; actor text; gname text; k text; ttl text; begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if not exists (select 1 from groups where id = r.group_id) then return r; end if;
  select display_name into actor from profiles where id = auth.uid(); select name into gname from groups where id = r.group_id;
  k := case tg_op when 'INSERT' then 'expense_added' when 'UPDATE' then 'expense_edited' else 'expense_deleted' end;
  ttl := case tg_op when 'INSERT' then 'New expense' when 'UPDATE' then 'Expense edited' else 'Expense deleted' end;
  for m in select user_id from group_members where group_id = r.group_id and user_id is distinct from auth.uid() loop
    perform notify(m.user_id, r.group_id, k, ttl, coalesce(actor, 'Someone') || ': “' || r.title || '” in ' || gname, '/groups/' || r.group_id,
      k || ':' || r.id || ':' || extract(epoch from coalesce(r.updated_at, r.created_at))::text);
  end loop; return r; end $$;
create trigger notify_expenses after insert or update or delete on expenses for each row execute function notify_expense();

create function notify_settlement() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; actor text; u uuid; ttl text; begin
  select name into gname from groups where id = new.group_id; select display_name into actor from profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    perform notify(new.to_user, new.group_id, 'settlement_pending', 'Payment to confirm', coalesce(actor, 'Someone') || ' says they paid you in ' || gname, '/groups/' || new.group_id, 'settle:' || new.id || ':pending');
  elsif new.status is distinct from old.status then
    ttl := 'Payment ' || new.status;
    for u in select unnest(case when new.status in ('confirmed','rejected') then array[new.from_user] when new.status = 'cancelled' then array[new.to_user] else array[new.from_user, new.to_user] end) loop
      if u is distinct from auth.uid() then perform notify(u, new.group_id, 'settlement_' || new.status, ttl, coalesce(actor, 'Someone') || ' · ' || gname, '/groups/' || new.group_id, 'settle:' || new.id || ':' || new.status); end if;
    end loop;
  end if; return new; end $$;
create trigger notify_settlements after insert or update on settlements for each row execute function notify_settlement();

create function notify_member() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; who text; m record; begin
  select name into gname from groups where id = new.group_id; select display_name into who from profiles where id = new.user_id;
  for m in select user_id from group_members where group_id = new.group_id and user_id <> new.user_id loop
    perform notify(m.user_id, new.group_id, 'member_joined', 'New member', coalesce(who, 'Someone') || ' joined ' || gname, '/groups/' || new.group_id, 'joined:' || new.group_id || ':' || new.user_id);
  end loop;
  if new.user_id is distinct from auth.uid() then perform notify(new.user_id, new.group_id, 'added_to_group', 'You were added to a group', gname, '/groups/' || new.group_id, 'added:' || new.group_id || ':' || new.user_id); end if;
  return new; end $$;
create trigger notify_members after insert on group_members for each row execute function notify_member();

revoke all on function reject_settlement, cancel_settlement, reverse_settlement from public;
grant execute on function reject_settlement, cancel_settlement, reverse_settlement to authenticated;
alter publication supabase_realtime add table notifications;
