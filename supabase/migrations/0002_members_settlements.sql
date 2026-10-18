-- Dev-grade member adding by existing account email (admins only). NOTE: reveals whether an email has an account; replace with token invites (planned).
create function add_member_by_email(p_group uuid, p_email text) returns void language plpgsql security definer set search_path = public as $$
declare u uuid; begin
  if not is_group_admin(p_group) then raise exception 'not authorized'; end if;
  select id into u from auth.users where lower(email) = lower(p_email);
  if u is null then raise exception 'no account with that email'; end if;
  insert into group_members (group_id, user_id) values (p_group, u) on conflict do nothing; end $$;
-- Only the receiver can confirm, and only once (status guard makes retries no-ops).
create function confirm_settlement(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update settlements set status = 'confirmed' where id = p_id and to_user = auth.uid() and status = 'pending';
  if not found then raise exception 'nothing to confirm'; end if; end $$;
revoke all on function add_member_by_email, confirm_settlement from public;
grant execute on function add_member_by_email, confirm_settlement to authenticated;
