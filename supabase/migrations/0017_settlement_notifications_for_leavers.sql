-- Payment notifications that still work when someone has left the group, and tell people what actually happened.
-- Before: a person who had left got "Payment reversed: <actor> · <group>" with a link to a group they can no longer open (404), no amount, no reason.

-- Don't create notifications for guests (can't log in) or for deleted accounts (nobody will ever read them).
create or replace function notify(p_user uuid, p_group uuid, p_type text, p_title text, p_body text, p_link text, p_key text) returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, group_id, type, title, body, link, dedupe_key)
  select p_user, p_group, p_type, p_title, p_body, p_link, p_key
  where not exists (select 1 from profiles where id = p_user and (is_shadow or deleted_at is not null))
  on conflict (user_id, dedupe_key) do nothing $$;

create or replace function notify_settlement() returns trigger language plpgsql security definer set search_path = public as $$
declare gname text; actor text; u uuid; tgt uuid; ttl text; amt text; why text; who text; shadow boolean; lnk text; begin
  select name into gname from groups where id = new.group_id;
  select display_name into actor from profiles where id = auth.uid();
  amt := new.currency || ' ' || to_char(new.amount_minor::numeric / 100, 'FM999999999990.00'); -- the two people involved may see the amount
  if tg_op = 'INSERT' then
    perform notify(new.to_user, new.group_id, 'settlement_pending', 'Payment to confirm', coalesce(actor, 'Someone') || ' says they paid you ' || amt || ' in ' || gname, '/groups/' || new.group_id, 'settle:' || new.id || ':pending');
  elsif new.status is distinct from old.status then
    ttl := 'Payment ' || new.status;
    why := case when new.status in ('rejected', 'reversed') and new.resolution_note is not null then ' Reason: ' || left(new.resolution_note, 200) else '' end;
    for u in select unnest(case when new.status in ('confirmed', 'rejected') then array[new.from_user] when new.status = 'cancelled' then array[new.to_user] else array[new.from_user, new.to_user] end) loop
      select is_shadow, display_name into shadow, who from profiles where id = u;
      tgt := case when shadow then (select managed_by from profiles where id = u) else u end; -- a guest can't log in: tell the real person who manages them
      if tgt is not null and tgt is distinct from auth.uid() then
        lnk := case when exists (select 1 from group_members where group_id = new.group_id and user_id = tgt) then '/groups/' || new.group_id else null end; -- someone who left can't open the group, so no dead link
        perform notify(tgt, new.group_id, 'settlement_' || new.status, ttl,
          case when shadow then 'Guest ' || who || ': ' else '' end || coalesce(actor, 'Someone') || ' marked a ' || amt || ' payment as ' || new.status || ' in ' || gname || '.' || why,
          lnk, 'settle:' || new.id || ':' || new.status || ':' || u);
      end if;
    end loop;
  end if; return new; end $$;
