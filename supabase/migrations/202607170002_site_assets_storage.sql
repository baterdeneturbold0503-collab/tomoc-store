insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('site-assets','site-assets',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public site-assets read" on storage.objects;
create policy "public site-assets read"
on storage.objects for select
using (bucket_id = 'site-assets');

drop policy if exists "admins upload site-assets" on storage.objects;
create policy "admins upload site-assets"
on storage.objects for insert
with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "admins update site-assets" on storage.objects;
create policy "admins update site-assets"
on storage.objects for update
using (bucket_id = 'site-assets' and public.is_admin())
with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "admins delete site-assets" on storage.objects;
create policy "admins delete site-assets"
on storage.objects for delete
using (bucket_id = 'site-assets' and public.is_admin());
