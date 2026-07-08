-- Creates orders and reserves stock in one database transaction.
create or replace function public.create_store_order(
  p_order_number text,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_shipping_address jsonb,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_order_id uuid;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'EMPTY_ORDER';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1,least(10,coalesce((v_item->>'qty')::integer,1)));
    select * into v_product from public.products
      where slug=v_item->>'slug' and is_active=true for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND:%',v_item->>'slug'; end if;
    if v_product.stock < v_qty then raise exception 'INSUFFICIENT_STOCK:%',v_product.slug; end if;
    v_subtotal := v_subtotal + (v_product.price*v_qty);
  end loop;

  insert into public.orders(order_number,customer_name,phone,email,shipping_address,subtotal,discount,shipping_fee,total,status,payment_status,payment_provider,notes)
  values(p_order_number,p_customer_name,p_phone,nullif(p_email,''),p_shipping_address,v_subtotal,0,0,v_subtotal,'pending','pending','bank_transfer',nullif(p_notes,''))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1,least(10,coalesce((v_item->>'qty')::integer,1)));
    select * into v_product from public.products where slug=v_item->>'slug' for update;
    insert into public.order_items(order_id,product_id,product_name,unit_price,quantity,image_url)
    values(v_order_id,v_product.id,v_product.name,v_product.price,v_qty,v_product.images[1]);
    update public.products set stock=stock-v_qty where id=v_product.id;
  end loop;

  return jsonb_build_object('id',v_order_id,'order_number',p_order_number,'total',v_subtotal);
end;
$$;

revoke all on function public.create_store_order(text,text,text,text,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_store_order(text,text,text,text,jsonb,text,jsonb) to service_role;
