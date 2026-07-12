-- Product image uploads for TOMOC Store admin.
-- Public bucket keeps storefront images fast and simple; writes remain admin-only.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public product-images read" on storage.objects;
create policy "public product-images read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "admins upload product-images" on storage.objects;
create policy "admins upload product-images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins update product-images" on storage.objects;
create policy "admins update product-images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product-images" on storage.objects;
create policy "admins delete product-images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
