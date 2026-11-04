-- 1) Remove the email lookup: it told group admins whether an email address has an account (account enumeration). Use invite links instead.
drop function if exists add_member_by_email(uuid, text);

-- 2) Per-user usage limits, enforced in the database so they can't be bypassed from the browser. Fixed time windows.
create table rate_limits (user_id uuid not null, action text not null, bucket timestamptz not null, hits int not null default 1, primary key (user_id, action, bucket));
alter table rate_limits enable row level security; -- no policies: not readable or writable through the API
create function enforce_rate_limit(p_action text, p_max int, p_window_seconds int) returns void language plpgsql security definer set search_path = public as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds); h int; begin
  insert into rate_limits (user_id, action, bucket) values (auth.uid(), p_action, b)
    on conflict (user_id, action, bucket) do update set hits = rate_limits.hits + 1 returning hits into h;
  if h > p_max then raise exception 'rate limit exceeded, please try again later'; end if;
  delete from rate_limits where bucket < now() - interval '2 days' and random() < 0.01; -- housekeeping
end $$;
create function rl_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin if auth.uid() is not null then perform enforce_rate_limit(tg_argv[0], tg_argv[1]::int, tg_argv[2]::int); end if; return new; end $$;
revoke all on function enforce_rate_limit, rl_guard from public, anon, authenticated;
-- Triggers (not function edits) so every path that creates these rows is covered, including the import function.
create trigger rl_groups   before insert on groups            for each row execute function rl_guard('create_group', '20', '3600');
create trigger rl_invites  before insert on group_invitations for each row execute function rl_guard('create_invite', '30', '3600');
create trigger rl_joins    before insert on group_members     for each row execute function rl_guard('join_or_add_member', '150', '3600');
create trigger rl_expenses before insert on expenses          for each row execute function rl_guard('create_expense', '600', '3600');
create trigger rl_settle   before insert on settlements       for each row execute function rl_guard('record_settlement', '100', '3600');
create trigger rl_shadows  before insert on profiles          for each row when (new.is_shadow) execute function rl_guard('create_guest', '200', '3600');
