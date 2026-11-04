create table activity_logs (id uuid primary key default gen_random_uuid(), group_id uuid not null references groups on delete cascade,
  actor uuid references profiles on delete set null, action text not null, entity_id uuid, detail jsonb, created_at timestamptz not null default now());
create index on activity_logs (group_id, created_at desc);
alter table activity_logs enable row level security;
create policy a_read on activity_logs for select using (is_group_member(group_id)); -- written only by trigger below

create function log_activity() returns trigger language plpgsql security definer set search_path = public as $$
declare r record; d jsonb; begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if not exists (select 1 from groups where id = r.group_id) then return r; end if; -- group cascade-deleted
  if tg_table_name = 'expenses' then d := jsonb_build_object('title', r.title, 'amount', r.amount_minor, 'currency', r.currency);
  else d := jsonb_build_object('amount', r.amount_minor, 'currency', r.currency, 'status', r.status); end if;
  insert into activity_logs (group_id, actor, action, entity_id, detail) values (r.group_id, auth.uid(), tg_table_name || '.' || lower(tg_op), r.id, d);
  return r; end $$;
create trigger log_expenses after insert or update or delete on expenses for each row execute function log_activity();
create trigger log_settlements after insert or update on settlements for each row execute function log_activity();

-- Shared validation for edits (same invariants as create_expense).
create function check_expense_payload(p_group uuid, p_amount bigint, p_payments jsonb, p_splits jsonb) returns void language plpgsql stable security definer set search_path = public as $$
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if (select coalesce(sum((x->>'amount')::bigint),0) from jsonb_array_elements(p_payments) x) <> p_amount then raise exception 'payments must equal total'; end if;
  if (select coalesce(sum((x->>'amount')::bigint),0) from jsonb_array_elements(p_splits) x) <> p_amount then raise exception 'splits must equal total'; end if;
  if exists (select 1 from jsonb_array_elements(p_payments || p_splits) x where (x->>'amount')::bigint < 0 or not exists (select 1 from group_members where group_id = p_group and user_id = (x->>'user_id')::uuid)) then raise exception 'invalid participant or amount'; end if;
end $$;

-- Only the creator or a group admin may edit/delete. Currency is immutable. Whole edit is one transaction.
create function update_expense(p_id uuid, p_title text, p_amount bigint, p_date date, p_category text, p_method text, p_notes text, p_payments jsonb, p_splits jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare g uuid; c uuid; begin
  select group_id, created_by into g, c from expenses where id = p_id;
  if g is null or not is_group_member(g) or (c <> auth.uid() and not is_group_admin(g)) then raise exception 'not authorized'; end if;
  perform check_expense_payload(g, p_amount, p_payments, p_splits);
  update expenses set title = p_title, amount_minor = p_amount, expense_date = p_date, category = p_category, split_method = p_method, notes = p_notes, updated_at = now() where id = p_id;
  delete from expense_payments where expense_id = p_id; delete from expense_splits where expense_id = p_id;
  insert into expense_payments select p_id, (x->>'user_id')::uuid, (x->>'amount')::bigint from jsonb_array_elements(p_payments) x;
  insert into expense_splits select p_id, (x->>'user_id')::uuid, (x->>'amount')::bigint from jsonb_array_elements(p_splits) x;
end $$;
create function delete_expense(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare g uuid; c uuid; begin
  select group_id, created_by into g, c from expenses where id = p_id;
  if g is null or not is_group_member(g) or (c <> auth.uid() and not is_group_admin(g)) then raise exception 'not authorized'; end if;
  delete from expenses where id = p_id; end $$;
revoke all on function update_expense, delete_expense, check_expense_payload from public;
grant execute on function update_expense, delete_expense to authenticated;

alter publication supabase_realtime add table expenses, settlements, group_members;
