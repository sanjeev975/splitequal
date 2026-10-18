alter table profiles add column username text;
create unique index profiles_username_key on profiles (lower(username));
alter table profiles add constraint username_fmt check (username is null or username ~ '^[a-zA-Z0-9_]{3,20}$');
alter table group_invitations add column max_uses int, add column use_count int not null default 0;

create function username_available(p_username text) returns boolean language sql stable security definer set search_path = public as $$
  select p_username ~ '^[a-zA-Z0-9_]{3,20}$' and not exists (select 1 from profiles where lower(username) = lower(p_username)) $$;
grant execute on function username_available to anon, authenticated;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare dn text := coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1));
begin
  begin insert into profiles (id, display_name, username) values (new.id, dn, nullif(new.raw_user_meta_data->>'username',''));
  exception when unique_violation or check_violation then insert into profiles (id, display_name) values (new.id, dn); end;
  return new; end $$;

-- Invite links: only sha256(token) is stored; the raw token exists only in the link shown once to the admin.
create function create_invite_link(p_group uuid, p_days int default 7, p_max_uses int default null) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text; begin
  if not is_group_admin(p_group) then raise exception 'not authorized'; end if;
  t := encode(gen_random_bytes(24), 'hex');
  insert into group_invitations (group_id, token_hash, invited_by, expires_at, max_uses)
    values (p_group, encode(digest(t, 'sha256'), 'hex'), auth.uid(), now() + make_interval(days => least(greatest(p_days,1),30)), p_max_uses);
  return t; end $$;

create function accept_invite(p_token text) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare i group_invitations; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into i from group_invitations where token_hash = encode(digest(p_token, 'sha256'), 'hex') for update;
  if not found then raise exception 'invalid invite'; end if;
  if i.revoked_at is not null then raise exception 'invite revoked'; end if;
  if i.expires_at < now() then raise exception 'invite expired'; end if;
  if exists (select 1 from group_members where group_id = i.group_id and user_id = auth.uid()) then return i.group_id; end if; -- idempotent
  if i.max_uses is not null and i.use_count >= i.max_uses then raise exception 'invite already used'; end if;
  if exists (select 1 from groups where id = i.group_id and archived_at is not null) then raise exception 'group is archived'; end if;
  insert into group_members (group_id, user_id) values (i.group_id, auth.uid());
  update group_invitations set use_count = use_count + 1, used_at = coalesce(used_at, now()) where id = i.id;
  return i.group_id; end $$;

create function revoke_invite(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin update group_invitations set revoked_at = now() where id = p_id and is_group_admin(group_id);
  if not found then raise exception 'not authorized'; end if; end $$;

-- Add by email, any time after the group exists. Only confirmed accounts are addable (prevents email squatting).
drop function add_member_by_email(uuid, text);
create function add_member_by_email(p_group uuid, p_email text) returns text language plpgsql security definer set search_path = public as $$
declare u uuid; begin
  if not is_group_admin(p_group) then raise exception 'not authorized'; end if;
  select id into u from auth.users where lower(email) = lower(trim(p_email)) and email_confirmed_at is not null;
  if u is null then return 'not_registered'; end if;
  if exists (select 1 from group_members where group_id = p_group and user_id = u) then return 'already_member'; end if;
  insert into group_members (group_id, user_id) values (p_group, u); return 'added'; end $$;

-- Removal/leaving goes through one function (balance + last-owner checks). Direct deletes are no longer allowed.
drop policy m_remove on group_members;
create function remove_member(p_group uuid, p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare r text; begin
  select role into r from group_members where group_id = p_group and user_id = p_user;
  if r is null then raise exception 'not a member'; end if;
  if p_user <> auth.uid() and not (is_group_admin(p_group) and r <> 'owner') then raise exception 'not authorized'; end if;
  if r = 'owner' and not exists (select 1 from group_members where group_id = p_group and role = 'owner' and user_id <> p_user) then raise exception 'transfer ownership first'; end if;
  if exists (select 1 from group_net_balances where group_id = p_group and user_id = p_user group by currency having sum(net_minor) <> 0) then raise exception 'settle balance first'; end if;
  delete from group_members where group_id = p_group and user_id = p_user; end $$;

create function set_member_role(p_group uuid, p_user uuid, p_role text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_role not in ('owner','admin','member') or p_user = auth.uid() then raise exception 'invalid change'; end if;
  if not exists (select 1 from group_members where group_id = p_group and user_id = auth.uid() and role = 'owner') then raise exception 'owner only'; end if;
  update group_members set role = p_role where group_id = p_group and user_id = p_user;
  if not found then raise exception 'not a member'; end if; end $$;
revoke all on function create_invite_link, accept_invite, revoke_invite, add_member_by_email, remove_member, set_member_role from public;
grant execute on function create_invite_link, accept_invite, revoke_invite, add_member_by_email, remove_member, set_member_role to authenticated;
