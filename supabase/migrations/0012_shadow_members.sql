-- SHADOW MEMBERS: unregistered placeholders that can be group members, payers and participants.
-- Design: every ledger table (expense_payments/splits, settlements, group_members) already points at profiles(id). Rather than rewrite them all,
-- a shadow member is a profiles row with is_shadow = true and NO auth.users row. Balances, RLS, name-uniqueness and realtime keep working unchanged.
alter table profiles add column is_shadow boolean not null default false;
alter table profiles add column managed_by uuid references profiles(id) on delete set null; -- the real user who created the guest
alter table profiles drop constraint profiles_id_fkey; -- was: id -> auth.users (this is what blocked unregistered members)
alter table groups add column import_key text;
create unique index groups_import_key on groups (created_by, import_key) where import_key is not null; -- makes guest migration idempotent

-- Replacement guards for the dropped foreign key.
create function profile_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not new.is_shadow and not exists (select 1 from auth.users where id = new.id) then raise exception 'profile must belong to an auth user'; end if;
  elsif new.is_shadow is distinct from old.is_shadow or new.managed_by is distinct from old.managed_by then raise exception 'shadow fields are immutable'; end if;
  return new; end $$;
create trigger profile_guard_ins before insert on profiles for each row execute function profile_guard();
create trigger profile_guard_upd before update on profiles for each row execute function profile_guard();
create function handle_user_deleted() returns trigger language plpgsql security definer set search_path = public as $$
begin delete from profiles where id = old.id and not is_shadow; return old; end $$; -- replaces the old ON DELETE CASCADE
create trigger on_auth_user_deleted after delete on auth.users for each row execute function handle_user_deleted();

-- Shadows can't log in, so never create notifications for them; and don't notify the person who just made the change.
create or replace function notify(p_user uuid, p_group uuid, p_type text, p_title text, p_body text, p_link text, p_key text) returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, group_id, type, title, body, link, dedupe_key)
  select p_user, p_group, p_type, p_title, p_body, p_link, p_key where not exists (select 1 from profiles where id = p_user and is_shadow)
  on conflict (user_id, dedupe_key) do nothing $$;
create or replace function notify_member() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; who text; m record; begin
  select name into gname from groups where id = new.group_id; select display_name into who from profiles where id = new.user_id;
  for m in select user_id from group_members where group_id = new.group_id and user_id <> new.user_id and user_id is distinct from auth.uid() loop
    perform notify(m.user_id, new.group_id, 'member_joined', 'New member', coalesce(who, 'Someone') || ' joined ' || gname, '/groups/' || new.group_id, 'joined:' || new.group_id || ':' || new.user_id);
  end loop;
  if new.user_id is distinct from auth.uid() then perform notify(new.user_id, new.group_id, 'added_to_group', 'You were added to a group', gname, '/groups/' || new.group_id, 'added:' || new.group_id || ':' || new.user_id); end if;
  return new; end $$;

create function add_shadow_member(p_group uuid, p_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid := gen_random_uuid(); nm text := left(trim(coalesce(p_name, '')), 40); begin
  if not is_group_admin(p_group) then raise exception 'not authorized'; end if;
  if nm = '' then raise exception 'a name is required'; end if;
  insert into profiles (id, display_name, username, is_shadow, managed_by) values (pid, nm, 'guest_' || substr(replace(pid::text, '-', ''), 1, 10), true, auth.uid());
  insert into group_members (group_id, user_id) values (p_group, pid); -- the per-group unique display-name trigger applies here too
  return pid; end $$;

create function rename_shadow_member(p_user uuid, p_name text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles p where p.id = p_user and p.is_shadow and (p.managed_by = auth.uid() or exists (
    select 1 from group_members gm where gm.user_id = p_user and is_group_admin(gm.group_id)))) then raise exception 'not authorized'; end if;
  if trim(coalesce(p_name, '')) = '' then raise exception 'a name is required'; end if;
  update profiles set display_name = left(trim(p_name), 40) where id = p_user; end $$;

-- Guest-mode migration. Payload: {name,type,currency,me,members:[{id,name}],expenses:[{title,amount_minor,date,category,notes,method,paid_by:[{member,amount}],splits:[{member,amount}]}]}
-- The new user becomes owner (and replaces local member "me"); every other local member becomes a shadow. Same key => same group (no duplicates on retry).
create function import_guest_group(p_payload jsonb, p_key text) returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); g uuid; m jsonb; e jsonb; mp jsonb := '{}'; used text[]; nm text; cand text; k int; pid uuid; eid uuid; amt bigint; pays jsonb; spl jsonb;
        me text := p_payload->>'me'; cur text := p_payload->>'currency'; begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_key is null or length(p_key) not between 1 and 100 then raise exception 'idempotency key required'; end if;
  select id into g from groups where created_by = uid and import_key = p_key; if g is not null then return g; end if;
  if cur is null or cur not in ('INR','USD','GBP','EUR','AED','CAD','AUD') then raise exception 'unsupported currency'; end if;
  if jsonb_array_length(coalesce(p_payload->'members', '[]')) > 50 or jsonb_array_length(coalesce(p_payload->'expenses', '[]')) > 500 then raise exception 'import too large'; end if;
  insert into groups (name, type, base_currency, created_by, import_key) values (coalesce(nullif(left(trim(p_payload->>'name'), 80), ''), 'Imported group'), coalesce(p_payload->>'type', 'Custom'), cur, uid, p_key) returning id into g;
  insert into group_members (group_id, user_id, role) values (g, uid, 'owner');
  select array[lower(trim(display_name))] into used from profiles where id = uid;
  if me is not null then mp := jsonb_build_object(me, uid::text); end if;
  for m in select * from jsonb_array_elements(coalesce(p_payload->'members', '[]')) loop
    if (m->>'id') = me then continue; end if;
    nm := left(trim(coalesce(m->>'name', '')), 40); if nm = '' then raise exception 'member name required'; end if;
    cand := nm; k := 2; while lower(cand) = any(used) loop cand := nm || ' (' || k || ')'; k := k + 1; end loop; -- keep names unique within the group
    used := used || lower(cand); pid := gen_random_uuid();
    insert into profiles (id, display_name, username, is_shadow, managed_by) values (pid, cand, 'guest_' || substr(replace(pid::text, '-', ''), 1, 10), true, uid);
    insert into group_members (group_id, user_id) values (g, pid);
    mp := mp || jsonb_build_object(m->>'id', pid::text);
  end loop;
  for e in select * from jsonb_array_elements(coalesce(p_payload->'expenses', '[]')) loop
    amt := (e->>'amount_minor')::bigint;
    select coalesce(jsonb_agg(jsonb_build_object('user_id', mp->>(x->>'member'), 'amount', (x->>'amount')::bigint)), '[]') into pays from jsonb_array_elements(e->'paid_by') x;
    select coalesce(jsonb_agg(jsonb_build_object('user_id', mp->>(x->>'member'), 'amount', (x->>'amount')::bigint)), '[]') into spl from jsonb_array_elements(e->'splits') x;
    perform check_expense_payload(g, amt, pays, spl); -- same invariants as normal expenses; any bad row aborts the whole import
    insert into expenses (group_id, title, amount_minor, currency, expense_date, category, split_method, notes, created_by)
      values (g, coalesce(nullif(left(trim(e->>'title'), 200), ''), 'Untitled'), amt, cur, coalesce((e->>'date')::date, current_date), coalesce(nullif(e->>'category', ''), 'Other'), coalesce(nullif(e->>'method', ''), 'exact'), nullif(left(e->>'notes', 500), ''), uid) returning id into eid;
    insert into expense_payments select eid, (y->>'user_id')::uuid, (y->>'amount')::bigint from jsonb_array_elements(pays) y;
    insert into expense_splits select eid, (y->>'user_id')::uuid, (y->>'amount')::bigint from jsonb_array_elements(spl) y;
  end loop;
  return g; end $$;
revoke all on function add_shadow_member, rename_shadow_member, import_guest_group from public;
grant execute on function add_shadow_member, rename_shadow_member, import_guest_group to authenticated;
