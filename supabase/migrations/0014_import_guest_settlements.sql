-- Guest mode lets people mark payments as done; carry those over on sign-up so balances don't reappear.
create or replace function import_guest_group(p_payload jsonb, p_key text) returns uuid language plpgsql security definer set search_path = public as $$
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
  for e in select * from jsonb_array_elements(coalesce(p_payload->'settlements', '[]')) loop
    amt := (e->>'amount_minor')::bigint;
    if amt <= 0 or mp->>(e->>'from') is null or mp->>(e->>'to') is null or (e->>'from') = (e->>'to') then raise exception 'invalid settlement'; end if;
    insert into settlements (group_id, from_user, to_user, amount_minor, currency, note, status, idempotency_key, created_by, resolved_by, resolved_at)
      values (g, (mp->>(e->>'from'))::uuid, (mp->>(e->>'to'))::uuid, amt, cur, 'Imported from guest mode', 'confirmed', 'import:' || gen_random_uuid()::text, uid, uid, now());
  end loop;
  return g; end $$;
