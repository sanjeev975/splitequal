create table expense_attachments (
  id uuid primary key default gen_random_uuid(), expense_id uuid not null references expenses on delete cascade,
  path text not null unique, file_name text not null, mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  created_by uuid not null default auth.uid() references profiles, created_at timestamptz not null default now());
alter table expense_attachments enable row level security;
create policy att_read on expense_attachments for select using (exists (select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id)));
create policy att_insert on expense_attachments for insert with check (created_by = auth.uid() and exists (
  select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id) and path like e.group_id::text || '/' || e.id::text || '/%'));
create policy att_delete on expense_attachments for delete using (exists (
  select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id) and (expense_attachments.created_by = auth.uid() or is_group_admin(e.group_id))));

-- Private bucket; size and MIME limits are enforced by Storage itself (trusted boundary). Path = <group_id>/<expense_id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']) on conflict (id) do nothing;
create policy rcpt_read on storage.objects for select using (bucket_id = 'receipts' and is_group_member(((storage.foldername(name))[1])::uuid));
create policy rcpt_insert on storage.objects for insert with check (bucket_id = 'receipts' and is_group_member(((storage.foldername(name))[1])::uuid));
create policy rcpt_delete on storage.objects for delete using (bucket_id = 'receipts' and is_group_member(((storage.foldername(name))[1])::uuid)
  and (owner_id = auth.uid()::text or is_group_admin(((storage.foldername(name))[1])::uuid)));
