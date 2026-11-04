-- profiles.avatar_path holds either 'preset:1'..'preset:8' or '<user_id>/<uuid>.webp|png' (own folder only).
alter table profiles add constraint avatar_fmt check (avatar_path is null or avatar_path ~ '^preset:[1-8]$' or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(webp|png)$'));
-- Private bucket, 2 MB cap and MIME allow-list enforced by Storage itself. Viewable by the owner and people who share a group with them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/webp','image/png','image/jpeg']) on conflict (id) do nothing;
create policy av_read on storage.objects for select using (bucket_id = 'avatars' and (
  (storage.foldername(name))[1] = auth.uid()::text or exists (
    select 1 from group_members a join group_members b using (group_id) where a.user_id = auth.uid() and b.user_id::text = (storage.foldername(name))[1])));
create policy av_insert on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy av_delete on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
