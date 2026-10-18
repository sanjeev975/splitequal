-- 1) Usernames become mandatory. Backfill accounts that have none (old accounts / old trigger fallback).
update profiles set username = left(regexp_replace(lower(display_name), '[^a-z0-9]', '', 'g'), 12) || '_' || substr(replace(id::text, '-', ''), 1, 5) where username is null;
alter table profiles alter column username set not null;

-- 2) New signups: no more silent fallback. A taken/invalid username now fails the signup instead of creating a username-less account.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare dn text := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1));
        un text := nullif(trim(new.raw_user_meta_data->>'username'), '');
begin
  if un is null then un := left(regexp_replace(lower(dn), '[^a-z0-9]', '', 'g'), 12) || '_' || substr(replace(new.id::text, '-', ''), 1, 5); end if;
  insert into profiles (id, display_name, username) values (new.id, dn, un);
  return new; end $$;

-- 3) Display names must be unique (case-insensitive, trimmed) WITHIN a group. Covers invite links, add-by-email, any membership insert.
create function enforce_unique_member_name() returns trigger language plpgsql security definer set search_path = public as $$
declare nm text; begin
  select display_name into nm from profiles where id = new.user_id;
  if exists (select 1 from group_members m join profiles p on p.id = m.user_id
             where m.group_id = new.group_id and m.user_id <> new.user_id and lower(trim(p.display_name)) = lower(trim(nm))) then
    raise exception 'A member with the display name "%" is already in this group. Change your display name in Profile first.', nm;
  end if; return new; end $$;
create trigger member_name_unique before insert on group_members for each row execute function enforce_unique_member_name();

-- 4) Renaming yourself can't create a duplicate in any group you are already in.
create function enforce_unique_name_on_rename() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(trim(new.display_name)) <> lower(trim(old.display_name)) and exists (
    select 1 from group_members a join group_members b on b.group_id = a.group_id and b.user_id <> new.id
    join profiles p on p.id = b.user_id where a.user_id = new.id and lower(trim(p.display_name)) = lower(trim(new.display_name))) then
    raise exception 'Someone in one of your groups already uses the display name "%". Choose a different name.', new.display_name;
  end if; return new; end $$;
create trigger rename_name_unique before update of display_name on profiles for each row execute function enforce_unique_name_on_rename();
