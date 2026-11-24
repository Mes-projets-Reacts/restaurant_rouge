insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'dish-images',
  'dish-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners can upload dish images" on storage.objects;
create policy "Owners can upload dish images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dish-images' and public.is_owner());

drop policy if exists "Owners can update dish images" on storage.objects;
create policy "Owners can update dish images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'dish-images' and public.is_owner())
  with check (bucket_id = 'dish-images' and public.is_owner());

drop policy if exists "Owners can delete dish images" on storage.objects;
create policy "Owners can delete dish images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'dish-images' and public.is_owner());
