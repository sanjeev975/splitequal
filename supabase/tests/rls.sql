-- Run in the Supabase SQL editor. Creates two throwaway users, asserts isolation, then ROLLS BACK. Look for "RLS tests passed".
begin;
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); g uuid; t text; n int; c uuid := gen_random_uuid(); s1 uuid; s2 uuid; sh uuid; g2 uuid; pl jsonb;
begin
  insert into auth.users (id, email, email_confirmed_at) values (a, 'rls-a@test.invalid', now()), (b, 'rls-b@test.invalid', now());
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  g := create_group('RLS test', 'Custom', 'INR');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from groups where id = g; assert n = 0, 'B must not see A''s group';
  begin perform create_expense(g, 'x', 100, 'INR', current_date, 'Other', 'equal', null, json_build_array(json_build_object('user_id', b, 'amount', 100))::jsonb, json_build_array(json_build_object('user_id', b, 'amount', 100))::jsonb);
    assert false, 'B must not create expense in A''s group'; exception when others then assert sqlerrm = 'not a member', 'unexpected: ' || sqlerrm; end;
  begin perform create_invite_link(g); assert false, 'non-admin created invite'; exception when others then assert sqlerrm = 'not authorized'; end;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  t := create_invite_link(g, 7, 1);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin perform accept_invite('wrong-token'); assert false; exception when others then assert sqlerrm = 'invalid invite'; end;
  assert accept_invite(t) = g, 'B joins via link';
  assert accept_invite(t) = g, 'accept is idempotent';
  select count(*) into n from groups where id = g; assert n = 1, 'B sees group after joining';
  begin perform remove_member(g, a); assert false; exception when others then assert sqlerrm = 'not authorized', 'member removed owner'; end;
  reset role;
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values (c, 'rls-c@test.invalid', now(), jsonb_build_object('display_name', 'RLS-A', 'username', 'rls_c_user'));
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true); set local role authenticated;
  t := create_invite_link(g);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  begin perform accept_invite(t); assert false, 'duplicate display name joined'; exception when others then assert sqlerrm like 'A member with the display name%', 'unexpected: ' || sqlerrm; end;
  -- settlement lifecycle + notifications
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform create_expense(g, 'T', 200, 'INR', current_date, 'Other', 'equal', null, jsonb_build_array(jsonb_build_object('user_id', a, 'amount', 200)), jsonb_build_array(jsonb_build_object('user_id', a, 'amount', 100), jsonb_build_object('user_id', b, 'amount', 100)));
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin perform record_settlement(g, a, 500, 'INR', null, 'k0'); assert false; exception when others then assert sqlerrm = 'amount exceeds what you owe', sqlerrm; end;
  s1 := record_settlement(g, a, 100, 'INR', 'x', 'k1'); assert record_settlement(g, a, 100, 'INR', 'x', 'k1') = s1, 'idempotent';
  select count(*) into n from notifications where user_id = a; assert n = 0, 'B must not read A notifications';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from notifications where user_id = a and type = 'settlement_pending'; assert n = 1, 'A notified once';
  perform reject_settlement(s1, 'wrong');
  begin perform cancel_settlement(s1); assert false; exception when others then assert sqlerrm = 'nothing to cancel', sqlerrm; end;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  s2 := record_settlement(g, a, 100, 'INR', null, 'k2');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform confirm_settlement(s2); perform reverse_settlement(s2, 'mistake');
  select count(*) into n from group_net_balances where group_id = g and user_id = b and net_minor <> 0; assert n = 1, 'reversal restores the debt';
  -- shadow members + guest import
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin perform add_shadow_member(g, 'Zed'); assert false; exception when others then assert sqlerrm = 'not authorized', sqlerrm; end;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  sh := add_shadow_member(g, 'Zed');
  begin perform add_shadow_member(g, 'zed'); assert false; exception when others then assert sqlerrm like 'A member with the display name%', sqlerrm; end;
  pl := jsonb_build_object('name', 'Imp', 'currency', 'INR', 'me', 'm1', 'members', jsonb_build_array(jsonb_build_object('id', 'm1', 'name', 'A'), jsonb_build_object('id', 'm2', 'name', 'Q')),
    'expenses', jsonb_build_array(jsonb_build_object('title', 'T', 'amount_minor', 100, 'date', '2026-10-01', 'paid_by', jsonb_build_array(jsonb_build_object('member', 'm1', 'amount', 100)), 'splits', jsonb_build_array(jsonb_build_object('member', 'm1', 'amount', 50), jsonb_build_object('member', 'm2', 'amount', 50)))));
  g2 := import_guest_group(pl, 'key1'); assert import_guest_group(pl, 'key1') = g2, 'import is idempotent';
  select count(*) into n from group_members gm join profiles p on p.id = gm.user_id where gm.group_id = g2 and p.is_shadow; assert n = 1, 'one shadow imported';
  -- account deletion (service-role functions: run as postgres)
  reset role;
  assert array_length(account_blockers(a), 1) >= 1, 'owner of a group with other members is blocked';
  begin perform anonymize_account(a); assert false; exception when others then assert sqlerrm like 'blocked:%', sqlerrm; end;
  perform anonymize_account(c); perform anonymize_account(c); -- idempotent
  select count(*) into n from profiles where id = c and display_name = 'Deleted user' and deleted_at is not null and username like 'deleted\_%'; assert n = 1, 'profile anonymized';
  -- usage limits + removed email lookup
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform enforce_rate_limit('t', 2, 3600); perform enforce_rate_limit('t', 2, 3600);
  begin perform enforce_rate_limit('t', 2, 3600); assert false; exception when others then assert sqlerrm like 'rate limit%', sqlerrm; end;
  assert to_regprocedure('add_member_by_email(uuid,text)') is null, 'email lookup removed';
  raise notice 'RLS tests passed';
end $$;
rollback;
