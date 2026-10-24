-- PERSONAL SPACE: a one-member group (type 'Personal') for expenses that belong to you alone: no group, no splitting, no sharing.
-- It reuses the whole expense pipeline (categories, receipts, edit, search, analytics); the database guarantees it can never be shared.
create unique index groups_one_personal on groups (created_by) where type = 'Personal';

create function enforce_personal_unshared() returns trigger language plpgsql security definer set search_path = public as $$
declare t text; c uuid; begin
  select type, created_by into t, c from groups where id = new.group_id;
  if t = 'Personal' and (tg_table_name = 'group_invitations' or new.user_id is distinct from c) then raise exception 'Personal spaces can''t be shared'; end if;
  return new; end $$;
create trigger personal_no_members before insert on group_members for each row execute function enforce_personal_unshared();
create trigger personal_no_invites before insert on group_invitations for each row execute function enforce_personal_unshared();

-- A shared group can't be turned into a personal one (it already has people), and a personal one can't be converted to a shared one.
create function enforce_personal_type() returns trigger language plpgsql security definer set search_path = public as $$
begin if (old.type = 'Personal') <> (new.type = 'Personal') then raise exception 'A group''s type can''t be changed to or from Personal'; end if; return new; end $$;
create trigger personal_type_locked before update of type on groups for each row execute function enforce_personal_type();

create function get_or_create_personal_group(p_currency text) returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into g from groups where created_by = auth.uid() and type = 'Personal'; if g is not null then return g; end if;
  if p_currency not in ('INR','USD','GBP','EUR','AED','CAD','AUD') then raise exception 'unsupported currency'; end if;
  insert into groups (name, type, base_currency, created_by) values ('Personal', 'Personal', p_currency, auth.uid()) on conflict (created_by) where type = 'Personal' do nothing returning id into g;
  if g is null then select id into g from groups where created_by = auth.uid() and type = 'Personal'; return g; end if; -- lost a race with ourselves: reuse
  insert into group_members (group_id, user_id, role) values (g, auth.uid(), 'owner');
  return g; end $$;
revoke all on function get_or_create_personal_group, enforce_personal_unshared, enforce_personal_type from public, anon;
grant execute on function get_or_create_personal_group to authenticated;
