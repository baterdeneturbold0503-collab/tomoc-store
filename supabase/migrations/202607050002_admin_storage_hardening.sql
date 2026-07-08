-- Checkout writes only through the validated server route using the service role.
drop policy if exists "users create own orders" on public.orders;

-- Public catalog reads remain available; all mutations are admin/service-role only.
drop policy if exists "public reads active products" on public.products;
create policy "public reads active products"
  on public.products for select
  using(is_active or public.is_admin());

drop policy if exists "public product images" on storage.objects;
create policy "public product images"
  on storage.objects for select
  using(bucket_id='products');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images"
  on storage.objects for insert
  with check(bucket_id='products' and public.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images"
  on storage.objects for update
  using(bucket_id='products' and public.is_admin())
  with check(bucket_id='products' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images"
  on storage.objects for delete
  using(bucket_id='products' and public.is_admin());

create extension if not exists pg_trgm;
create index if not exists products_name_search_idx
  on public.products using gin(name gin_trgm_ops);
create index if not exists products_stock_idx
  on public.products(stock) where is_active=true;
