-- Coupon redemption rules, shipping configuration, live quotes, and transactional order totals.
alter table public.coupons add column if not exists single_use boolean not null default false;
alter table public.coupons add column if not exists updated_at timestamptz not null default now();
alter table public.coupons drop constraint if exists coupons_discount_value_check;
alter table public.coupons add constraint coupons_discount_value_check check(
  (discount_type='percent' and discount_value between 1 and 100) or
  (discount_type='fixed' and discount_value > 0)
);

create table if not exists public.shipping_zones (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_methods (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null,
  code text not null unique,
  method_type text not null check(method_type in ('flat_rate','pickup')),
  flat_rate integer not null default 0 check(flat_rate >= 0),
  free_shipping_threshold integer check(free_shipping_threshold is null or free_shipping_threshold >= 0),
  estimated_min_days integer not null default 0 check(estimated_min_days >= 0),
  estimated_max_days integer not null default 0 check(estimated_max_days >= estimated_min_days),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  customer_hash text not null,
  discount_amount integer not null check(discount_amount >= 0),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists coupon_id uuid references public.coupons(id) on delete set null;
alter table public.orders add column if not exists shipping_method_id uuid references public.shipping_methods(id) on delete set null;

create index if not exists coupons_active_code_idx on public.coupons(code,is_active);
create index if not exists coupon_redemptions_lookup_idx on public.coupon_redemptions(coupon_id,customer_hash);
create index if not exists shipping_methods_zone_idx on public.shipping_methods(zone_id,is_active,sort_order);

alter table public.shipping_zones enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.coupon_redemptions enable row level security;

drop policy if exists "public reads shipping zones" on public.shipping_zones;
create policy "public reads shipping zones" on public.shipping_zones for select using(is_active or public.is_admin());
drop policy if exists "public reads shipping methods" on public.shipping_methods;
create policy "public reads shipping methods" on public.shipping_methods for select using(is_active or public.is_admin());
drop policy if exists "admins shipping zones" on public.shipping_zones;
create policy "admins shipping zones" on public.shipping_zones for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins shipping methods" on public.shipping_methods;
create policy "admins shipping methods" on public.shipping_methods for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins coupon redemptions" on public.coupon_redemptions;
create policy "admins coupon redemptions" on public.coupon_redemptions for select using(public.is_admin());

drop trigger if exists coupons_updated on public.coupons;
create trigger coupons_updated before update on public.coupons for each row execute function public.set_updated_at();
drop trigger if exists shipping_zones_updated on public.shipping_zones;
create trigger shipping_zones_updated before update on public.shipping_zones for each row execute function public.set_updated_at();
drop trigger if exists shipping_methods_updated on public.shipping_methods;
create trigger shipping_methods_updated before update on public.shipping_methods for each row execute function public.set_updated_at();

insert into public.shipping_zones(name,code,sort_order) values
  ('Улаанбаатар','ulaanbaatar',1),('Орон нутаг','countryside',2),('Өөрөө авах','pickup',3)
on conflict(code) do update set name=excluded.name,is_active=true,sort_order=excluded.sort_order;

insert into public.shipping_methods(zone_id,name,code,method_type,flat_rate,free_shipping_threshold,estimated_min_days,estimated_max_days,sort_order) values
  ((select id from public.shipping_zones where code='ulaanbaatar'),'Хот дотор хүргэлт','ub-standard','flat_rate',5000,100000,1,2,1),
  ((select id from public.shipping_zones where code='countryside'),'Орон нутгийн унаа','countryside-terminal','flat_rate',10000,null,2,5,1),
  ((select id from public.shipping_zones where code='pickup'),'Өөрөө ирж авах','store-pickup','pickup',0,null,0,0,1)
on conflict(code) do update set name=excluded.name,zone_id=excluded.zone_id,method_type=excluded.method_type,flat_rate=excluded.flat_rate,free_shipping_threshold=excluded.free_shipping_threshold,estimated_min_days=excluded.estimated_min_days,estimated_max_days=excluded.estimated_max_days,is_active=true,sort_order=excluded.sort_order;

create or replace function public.quote_store_order(
  p_items jsonb,
  p_coupon_code text,
  p_shipping_method_id uuid,
  p_customer_hash text
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_subtotal integer := 0; v_discount integer := 0; v_shipping integer := 0;
  v_item jsonb; v_product public.products%rowtype; v_qty integer;
  v_coupon public.coupons%rowtype; v_method public.shipping_methods%rowtype;
begin
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'EMPTY_ORDER'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty:=greatest(1,least(10,coalesce((v_item->>'qty')::integer,1)));
    select * into v_product from public.products where slug=v_item->>'slug' and is_active=true;
    if not found then raise exception 'PRODUCT_NOT_FOUND:%',v_item->>'slug'; end if;
    if v_product.stock<v_qty then raise exception 'INSUFFICIENT_STOCK:%',v_product.slug; end if;
    v_subtotal:=v_subtotal+(v_product.price*v_qty);
  end loop;
  if nullif(trim(p_coupon_code),'') is not null then
    select * into v_coupon from public.coupons where upper(code)=upper(trim(p_coupon_code));
    if not found or not v_coupon.is_active then raise exception 'COUPON_INVALID'; end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at>now() then raise exception 'COUPON_NOT_STARTED'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at<=now() then raise exception 'COUPON_EXPIRED'; end if;
    if v_coupon.max_uses is not null and v_coupon.used_count>=v_coupon.max_uses then raise exception 'COUPON_LIMIT'; end if;
    if v_subtotal<coalesce(v_coupon.min_order,0) then raise exception 'COUPON_MIN_ORDER:%',v_coupon.min_order; end if;
    if v_coupon.single_use and nullif(p_customer_hash,'') is null then raise exception 'COUPON_PHONE_REQUIRED'; end if;
    if v_coupon.single_use and exists(select 1 from public.coupon_redemptions where coupon_id=v_coupon.id and customer_hash=p_customer_hash) then raise exception 'COUPON_ALREADY_USED'; end if;
    v_discount:=case when v_coupon.discount_type='percent' then floor(v_subtotal*v_coupon.discount_value/100.0)::integer else least(v_subtotal,v_coupon.discount_value) end;
  end if;
  select sm.* into v_method from public.shipping_methods sm join public.shipping_zones sz on sz.id=sm.zone_id where sm.id=p_shipping_method_id and sm.is_active and sz.is_active;
  if not found then raise exception 'SHIPPING_METHOD_INVALID'; end if;
  v_shipping:=case when v_method.method_type='pickup' then 0 when v_method.free_shipping_threshold is not null and (v_subtotal-v_discount)>=v_method.free_shipping_threshold then 0 else v_method.flat_rate end;
  return jsonb_build_object('subtotal',v_subtotal,'discount',v_discount,'shipping_fee',v_shipping,'total',greatest(0,v_subtotal-v_discount+v_shipping),'coupon_code',case when v_coupon.id is null then null else v_coupon.code end,'shipping_method_id',v_method.id,'shipping_method',v_method.name,'estimated_min_days',v_method.estimated_min_days,'estimated_max_days',v_method.estimated_max_days);
end; $$;

drop function if exists public.create_store_order(text,text,text,text,jsonb,text,jsonb);
create or replace function public.create_store_order(
  p_order_number text, p_customer_name text, p_phone text, p_email text,
  p_shipping_address jsonb, p_notes text, p_items jsonb, p_coupon_code text,
  p_shipping_method_id uuid, p_customer_hash text, p_payment_provider text, p_user_id uuid
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_order_id uuid; v_subtotal integer:=0; v_discount integer:=0; v_shipping integer:=0; v_total integer:=0;
  v_item jsonb; v_product public.products%rowtype; v_qty integer;
  v_coupon public.coupons%rowtype; v_method public.shipping_methods%rowtype;
begin
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'EMPTY_ORDER'; end if;
  if p_payment_provider not in ('bank_transfer','qpay') then raise exception 'PAYMENT_PROVIDER_INVALID'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty:=greatest(1,least(10,coalesce((v_item->>'qty')::integer,1)));
    select * into v_product from public.products where slug=v_item->>'slug' and is_active=true for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND:%',v_item->>'slug'; end if;
    if v_product.stock<v_qty then raise exception 'INSUFFICIENT_STOCK:%',v_product.slug; end if;
    v_subtotal:=v_subtotal+(v_product.price*v_qty);
  end loop;
  if nullif(trim(p_coupon_code),'') is not null then
    select * into v_coupon from public.coupons where upper(code)=upper(trim(p_coupon_code)) for update;
    if not found or not v_coupon.is_active then raise exception 'COUPON_INVALID'; end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at>now() then raise exception 'COUPON_NOT_STARTED'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at<=now() then raise exception 'COUPON_EXPIRED'; end if;
    if v_coupon.max_uses is not null and v_coupon.used_count>=v_coupon.max_uses then raise exception 'COUPON_LIMIT'; end if;
    if v_subtotal<coalesce(v_coupon.min_order,0) then raise exception 'COUPON_MIN_ORDER:%',v_coupon.min_order; end if;
    if v_coupon.single_use and nullif(p_customer_hash,'') is null then raise exception 'COUPON_PHONE_REQUIRED'; end if;
    if v_coupon.single_use and exists(select 1 from public.coupon_redemptions where coupon_id=v_coupon.id and customer_hash=p_customer_hash) then raise exception 'COUPON_ALREADY_USED'; end if;
    v_discount:=case when v_coupon.discount_type='percent' then floor(v_subtotal*v_coupon.discount_value/100.0)::integer else least(v_subtotal,v_coupon.discount_value) end;
  end if;
  select sm.* into v_method from public.shipping_methods sm join public.shipping_zones sz on sz.id=sm.zone_id where sm.id=p_shipping_method_id and sm.is_active and sz.is_active for update of sm;
  if not found then raise exception 'SHIPPING_METHOD_INVALID'; end if;
  v_shipping:=case when v_method.method_type='pickup' then 0 when v_method.free_shipping_threshold is not null and (v_subtotal-v_discount)>=v_method.free_shipping_threshold then 0 else v_method.flat_rate end;
  v_total:=greatest(0,v_subtotal-v_discount+v_shipping);
  insert into public.orders(order_number,user_id,customer_name,phone,email,shipping_address,subtotal,discount,shipping_fee,total,coupon_code,coupon_id,shipping_method_id,status,payment_status,payment_provider,notes)
  values(p_order_number,p_user_id,p_customer_name,p_phone,nullif(p_email,''),p_shipping_address,v_subtotal,v_discount,v_shipping,v_total,case when v_coupon.id is null then null else v_coupon.code end,v_coupon.id,v_method.id,'pending','pending',p_payment_provider,nullif(p_notes,'')) returning id into v_order_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty:=greatest(1,least(10,coalesce((v_item->>'qty')::integer,1)));
    select * into v_product from public.products where slug=v_item->>'slug' for update;
    insert into public.order_items(order_id,product_id,product_name,unit_price,quantity,image_url) values(v_order_id,v_product.id,v_product.name,v_product.price,v_qty,v_product.images[1]);
    update public.products set stock=stock-v_qty where id=v_product.id;
  end loop;
  if v_coupon.id is not null then
    update public.coupons set used_count=used_count+1 where id=v_coupon.id;
    insert into public.coupon_redemptions(coupon_id,order_id,user_id,customer_hash,discount_amount) values(v_coupon.id,v_order_id,p_user_id,p_customer_hash,v_discount);
  end if;
  return jsonb_build_object('id',v_order_id,'order_number',p_order_number,'subtotal',v_subtotal,'discount',v_discount,'shipping_fee',v_shipping,'total',v_total,'shipping_method',v_method.name,'estimated_min_days',v_method.estimated_min_days,'estimated_max_days',v_method.estimated_max_days);
end; $$;

create or replace function public.rollback_store_order(p_order_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_item public.order_items%rowtype;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.status<>'pending' or v_order.payment_status<>'pending' then return; end if;
  for v_item in select * from public.order_items where order_id=p_order_id loop
    if v_item.product_id is not null then update public.products set stock=stock+v_item.quantity where id=v_item.product_id; end if;
  end loop;
  if v_order.coupon_id is not null then update public.coupons set used_count=greatest(0,used_count-1) where id=v_order.coupon_id; end if;
  delete from public.coupon_redemptions where order_id=p_order_id;
  update public.orders set status='cancelled',payment_status='failed' where id=p_order_id;
end; $$;

revoke all on function public.quote_store_order(jsonb,text,uuid,text) from public,anon,authenticated;
grant execute on function public.quote_store_order(jsonb,text,uuid,text) to service_role;
revoke all on function public.create_store_order(text,text,text,text,jsonb,text,jsonb,text,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.create_store_order(text,text,text,text,jsonb,text,jsonb,text,uuid,text,text,uuid) to service_role;
revoke all on function public.rollback_store_order(uuid) from public,anon,authenticated;
grant execute on function public.rollback_store_order(uuid) to service_role;
