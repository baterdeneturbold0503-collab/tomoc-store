-- Required PostgREST grants for Supabase API roles.
-- RLS policies still control which rows each role can access.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant select on public.shipping_zones to anon, authenticated;
grant select on public.shipping_methods to anon, authenticated;

grant insert on public.subscribers to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant all on public.addresses to authenticated;
grant all on public.wishlists to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.order_status_history to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
