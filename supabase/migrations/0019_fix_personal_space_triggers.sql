-- Fixes "record "new" has no field "user_id"" from 0018: one function served two tables (group_members has user_id, group_invitations doesn't)
-- and PostgreSQL resolved the whole condition at once. One function per table removes the problem. Safe to run whether or not 0018's version ran.
drop trigger if exists personal_no_members on group_members;
drop trigger if exists personal_no_invites on group_invitations;
drop trigger if exists enforce_personal_unshared on group_members;
drop trigger if exists enforce_personal_unshared on group_invitations;

drop function if exists enforce_personal_unshared();
drop function if exists enforce_personal_no_members();
drop function if exists enforce_personal_no_invites();

create or replace function enforce_personal_no_members() returns trigger language plpgsql security definer set search_path = public as $$
declare t text; c uuid; begin
  select type, created_by into t, c from groups where id = new.group_id;
  if t = 'Personal' and new.user_id is distinct from c then raise exception 'Personal spaces can''t be shared'; end if; -- only the owner may ever be a member
  return new; end $$;

create or replace function enforce_personal_no_invites() returns trigger language plpgsql security definer set search_path = public as $$
declare t text; begin
  select type into t from groups where id = new.group_id;
  if t = 'Personal' then raise exception 'Personal spaces can''t be shared'; end if; -- no invite links, ever
  return new; end $$;

revoke all on function enforce_personal_no_members, enforce_personal_no_invites from public, anon;

create trigger personal_no_members before insert on group_members for each row execute function enforce_personal_no_members();
create trigger personal_no_invites before insert on group_invitations for each row execute function enforce_personal_no_invites();