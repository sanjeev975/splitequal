-- ACCOUNT DELETION = anonymize + close login. Other members' expense history depends on this person's profile row, so the row is kept
-- but stripped of everything personal (name, username, picture, payment handles, notifications, memberships).
alter table profiles add column deleted_at timestamptz;

-- Reasons a deletion must wait (so nobody is left owed money or locked out of a group). Server-side enforced, not just a UI hint.
create function account_blockers(p_user uuid) returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(msg), '{}') from (
    select 'Unsettled balance in "' || g.name || '" (' || b.currency || ')' as msg
      from (select group_id, currency from group_net_balances where user_id = p_user group by group_id, currency having sum(net_minor) <> 0) b join groups g on g.id = b.group_id
    union all
    select 'A pending payment in "' || g.name || '" needs to be confirmed, rejected or cancelled' from settlements s join groups g on g.id = s.group_id
      where s.status = 'pending' and (s.from_user = p_user or s.to_user = p_user)
    union all
    select 'You are the only owner of "' || g.name || '". Make someone else an owner, or remove the other members, first.' from groups g
      where exists (select 1 from group_members m where m.group_id = g.id and m.user_id = p_user and m.role = 'owner')
        and not exists (select 1 from group_members m where m.group_id = g.id and m.role = 'owner' and m.user_id <> p_user)
        and exists (select 1 from group_members m where m.group_id = g.id and m.user_id <> p_user)
  ) q $$;
create function check_account_deletion() returns text[] language sql stable security definer set search_path = public as $$ select account_blockers(auth.uid()) $$;

-- Called ONLY by the server with the service-role key, after the user re-entered their password. Idempotent, so a failed retry is safe.
create function anonymize_account(p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare b text[]; begin
  b := account_blockers(p_user);
  if array_length(b, 1) > 0 then raise exception 'blocked: %', array_to_string(b, '; '); end if;
  delete from groups g where exists (select 1 from group_members m where m.group_id = g.id and m.user_id = p_user)
    and not exists (select 1 from group_members m where m.group_id = g.id and m.user_id <> p_user); -- groups only this person was in
  delete from group_members where user_id = p_user;
  delete from payment_handles where user_id = p_user; delete from notifications where user_id = p_user;
  update profiles set display_name = 'Deleted user', username = 'deleted_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10), avatar_path = null, deleted_at = now() where id = p_user;
end $$;

-- Closing the login must not fail because old expenses still point at the profile; if the row can't be removed, make sure it holds no personal data.
create or replace function handle_user_deleted() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin delete from profiles where id = old.id and not is_shadow;
  exception when foreign_key_violation then
    update profiles set display_name = 'Deleted user', username = 'deleted_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10), avatar_path = null, deleted_at = coalesce(deleted_at, now()) where id = old.id;
    delete from payment_handles where user_id = old.id; delete from notifications where user_id = old.id;
  end;
  return old; end $$;

revoke all on function account_blockers, anonymize_account, check_account_deletion from public, anon, authenticated;
grant execute on function check_account_deletion to authenticated;
grant execute on function account_blockers, anonymize_account to service_role;
