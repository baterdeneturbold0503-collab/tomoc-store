-- TOMOC Store / Supabase PostgreSQL schema
create extension if not exists "uuid-ossp";

create type public.user_role as enum ('customer','admin');
create type public.order_status as enum ('pending','confirmed','packing','shipped','delivered','cancelled','refunded');
create type public.payment_status as enum ('pending','paid','failed','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, avatar_url text, role public.user_role not null default 'customer',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default uuid_generate_v4(), name text not null, slug text unique not null,
  description text, image_url text, sort_order int default 0, is_active boolean default true, created_at timestamptz default now()
);
create table public.products (
  id uuid primary key default uuid_generate_v4(), category_id uuid references public.categories(id) on delete set null,
  name text not null, slug text unique not null, description text, benefits text[], sku text unique,
  price integer not null check(price >= 0), compare_at_price integer, stock integer not null default 0 check(stock >= 0),
  images text[] not null default '{}', is_featured boolean default false, is_active boolean default true,
  seo_title text, seo_description text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.product_variants (
  id uuid primary key default uuid_generate_v4(), product_id uuid not null references public.products(id) on delete cascade,
  name text not null, value text not null, sku text unique, stock int default 0, price_delta int default 0
);
create table public.addresses (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references public.profiles(id) on delete cascade,
  label text default 'Үндсэн', city text not null, district text, khoroo text, address_line text not null, is_default boolean default false
);
create table public.coupons (
  id uuid primary key default uuid_generate_v4(), code text unique not null, discount_type text not null check(discount_type in ('percent','fixed')),
  discount_value integer not null, min_order integer default 0, max_uses integer, used_count integer default 0,
  starts_at timestamptz default now(), expires_at timestamptz, is_active boolean default true
);
create table public.orders (
  id uuid primary key default uuid_generate_v4(), order_number text unique not null default ('TOM-' || upper(substr(md5(random()::text),1,8))),
  user_id uuid references public.profiles(id) on delete set null, customer_name text not null, phone text not null, email text,
  shipping_address jsonb not null, subtotal int not null, discount int default 0, shipping_fee int default 0, total int not null,
  coupon_code text, status public.order_status default 'pending', payment_status public.payment_status default 'pending',
  payment_provider text, payment_reference text, notes text, tracking_note text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.order_items (
  id uuid primary key default uuid_generate_v4(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null, variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null, unit_price int not null, quantity int not null check(quantity > 0), image_url text
);
create table public.wishlists (
  user_id uuid references public.profiles(id) on delete cascade, product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(), primary key(user_id, product_id)
);
create table public.reviews (
  id uuid primary key default uuid_generate_v4(), product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null, rating int not null check(rating between 1 and 5), title text, body text not null,
  is_verified boolean default false, is_approved boolean default false, created_at timestamptz default now()
);
create table public.blog_posts (
  id uuid primary key default uuid_generate_v4(), author_id uuid references public.profiles(id), title text not null, slug text unique not null,
  excerpt text, content text, cover_url text, published boolean default false, published_at timestamptz, created_at timestamptz default now()
);
create table public.subscribers (id uuid primary key default uuid_generate_v4(), email text unique not null, is_active boolean default true, created_at timestamptz default now());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin'); $$;
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
create trigger products_updated before update on products for each row execute function set_updated_at();
create trigger orders_updated before update on orders for each row execute function set_updated_at();
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

alter table profiles enable row level security; alter table categories enable row level security; alter table products enable row level security;
alter table product_variants enable row level security; alter table addresses enable row level security; alter table coupons enable row level security;
alter table orders enable row level security; alter table order_items enable row level security; alter table wishlists enable row level security;
alter table reviews enable row level security; alter table blog_posts enable row level security; alter table subscribers enable row level security;

create policy "public reads active categories" on categories for select using(is_active or is_admin());
create policy "public reads active products" on products for select using(is_active or is_admin());
create policy "public reads variants" on product_variants for select using(true);
create policy "public reads approved reviews" on reviews for select using(is_approved or is_admin());
create policy "public reads published posts" on blog_posts for select using(published or is_admin());
create policy "users read own profile" on profiles for select using(auth.uid()=id or is_admin());
create policy "users update own profile" on profiles for update using(auth.uid()=id) with check(auth.uid()=id);
create policy "users manage addresses" on addresses for all using(auth.uid()=user_id or is_admin()) with check(auth.uid()=user_id or is_admin());
create policy "users manage wishlist" on wishlists for all using(auth.uid()=user_id or is_admin()) with check(auth.uid()=user_id or is_admin());
create policy "users create reviews" on reviews for insert with check(auth.uid()=user_id);
create policy "users read own orders" on orders for select using(auth.uid()=user_id or is_admin());
create policy "users create own orders" on orders for insert with check(user_id is null or auth.uid()=user_id);
create policy "users read own order items" on order_items for select using(exists(select 1 from orders o where o.id=order_id and (o.user_id=auth.uid() or is_admin())));
create policy "anyone subscribes" on subscribers for insert with check(true);
create policy "admins categories" on categories for all using(is_admin()) with check(is_admin());
create policy "admins products" on products for all using(is_admin()) with check(is_admin());
create policy "admins variants" on product_variants for all using(is_admin()) with check(is_admin());
create policy "admins coupons" on coupons for all using(is_admin()) with check(is_admin());
create policy "admins orders" on orders for all using(is_admin()) with check(is_admin());
create policy "admins order items" on order_items for all using(is_admin()) with check(is_admin());
create policy "admins reviews" on reviews for all using(is_admin()) with check(is_admin());
create policy "admins posts" on blog_posts for all using(is_admin()) with check(is_admin());
create policy "admins subscribers" on subscribers for select using(is_admin());

create index products_category_idx on products(category_id); create index products_active_idx on products(is_active,is_featured);
create index orders_user_idx on orders(user_id,created_at desc); create index orders_number_idx on orders(order_number);
create index reviews_product_idx on reviews(product_id,is_approved); create index posts_published_idx on blog_posts(published,published_at desc);

insert into categories(name,slug,sort_order) values ('Үс арчилгаа','hair-care',1),('Спорт хувцас','sportswear',2),('Галбиржуулагч','shapewear',3) on conflict do nothing;
insert into coupons(code,discount_type,discount_value,min_order,max_uses) values ('TOMOC10','percent',10,50000,1000) on conflict do nothing;

insert into products(category_id,name,slug,description,benefits,sku,price,stock,images,is_featured,is_active)
values
  ((select id from categories where slug='hair-care'),'Argan Oil Nourishing Shampoo','argan-oil-nourishing-shampoo','Үсийг зөөлрүүлж, шаардлагатай тэжээлээр ханган, хуурайшилтыг багасгахад зориулсан өдөр тутмын арчилгаа.',array['Үсийг зөөлрүүлнэ','Тэжээл өгнө','Хуурайшилтыг багасгана'],'TOM-ARGAN-001',49900,100,array['/images/tomoc-beauty-campaign.png'],true,true),
  ((select id from categories where slug='hair-care'),'Anti Hair Loss Shampoo','anti-hair-loss-shampoo','Хуйхыг зөөлөн арчилж, үсний угийг дэмжихэд зориулсан үс уналтын эсрэг шампунь.',array['Үс уналтын эсрэг','Хуйх арчилна','Үсний угийг дэмжинэ'],'TOM-HAIR-002',49900,100,array['/images/tomoc-beauty-campaign.png'],true,true),
  ((select id from categories where slug='sportswear'),'High Waist Seamless Leggings','high-waist-seamless-leggings','Бэлхүүсийг зөөлөн барих seamless хийцтэй, биед эвтэйхэн, өдөр тутмын хөдөлгөөнд тохиромжтой леггинс.',array['Бэлхүүс барина','Биед эвтэйхэн','Өдөр тутамд тохиромжтой'],'TOM-LEG-003',69900,100,array['/images/tomoc-hero.png'],true,true),
  ((select id from categories where slug='shapewear'),'Slim Body Shapewear','slim-body-shapewear','Галбирыг жигд тодруулж, гэдэс хэсгийг барих бөгөөд хувцасны доор үл мэдэгдэх цэвэр хийцтэй.',array['Галбир тодруулна','Гэдэс барина','Хувцасны доор мэдэгдэхгүй'],'TOM-SHAPE-004',79900,100,array['/images/tomoc-hero.png'],false,true),
  ((select id from categories where slug='sportswear'),'Women''s Sportswear','womens-sportswear','Дасгал болон өдөр тутмын хөдөлгөөнд тохирсон, биед эвтэйхэн уян хатан материалтай спорт хувцас.',array['Дасгалд тохиромжтой','Өдөр тутамд тохиромжтой','Уян хатан материал'],'TOM-SPORT-005',89900,100,array['/images/tomoc-hero.png'],false,true)
on conflict(slug) do update set name=excluded.name,description=excluded.description,benefits=excluded.benefits,price=excluded.price,images=excluded.images,is_active=true,updated_at=now();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('products','products',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "public product images" on storage.objects for select using(bucket_id='products');
create policy "admins upload product images" on storage.objects for all using(bucket_id='products' and public.is_admin()) with check(bucket_id='products' and public.is_admin());
