-- Payment handles live in their own table (not on profiles) so they are only read when someone is about to pay you.
create table payment_handles (
  user_id uuid primary key references profiles on delete cascade,
  upi_id text, venmo_handle text, updated_at timestamptz not null default now(),
  constraint upi_fmt check (upi_id is null or upi_id ~ '^[a-zA-Z0-9._-]{2,100}@[a-zA-Z][a-zA-Z0-9]{1,63}$'),
  constraint venmo_fmt check (venmo_handle is null or venmo_handle ~ '^[A-Za-z0-9_-]{5,30}$')); -- strict formats: nothing that could inject extra link parameters
alter table payment_handles enable row level security;
create policy ph_self on payment_handles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Readable only by people who share a group with the owner.
create policy ph_peers on payment_handles for select using (exists (
  select 1 from group_members a join group_members b using (group_id) where a.user_id = auth.uid() and b.user_id = payment_handles.user_id));
