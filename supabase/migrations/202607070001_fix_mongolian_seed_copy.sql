-- Normalize TOMOC Store seed copy after earlier migrations.
-- Safe to run repeatedly.

update public.reviews
set customer_name = 'TOMOC хэрэглэгч'
where customer_name is null
   or customer_name = ''
   or customer_name like '%Ð%'
   or customer_name like '%Ñ%';

insert into public.shipping_zones(name,code,sort_order) values
  ('Улаанбаатар','ulaanbaatar',1),
  ('Орон нутаг','countryside',2),
  ('Өөрөө авах','pickup',3)
on conflict(code) do update
set name = excluded.name,
    is_active = true,
    sort_order = excluded.sort_order;

insert into public.shipping_methods(zone_id,name,code,method_type,flat_rate,free_shipping_threshold,estimated_min_days,estimated_max_days,sort_order) values
  ((select id from public.shipping_zones where code='ulaanbaatar'),'Хот дотор хүргэлт','ub-standard','flat_rate',5000,100000,1,2,1),
  ((select id from public.shipping_zones where code='countryside'),'Орон нутгийн унаа','countryside-terminal','flat_rate',10000,null,2,5,1),
  ((select id from public.shipping_zones where code='pickup'),'Өөрөө ирж авах','store-pickup','pickup',0,null,0,0,1)
on conflict(code) do update
set name = excluded.name,
    zone_id = excluded.zone_id,
    method_type = excluded.method_type,
    flat_rate = excluded.flat_rate,
    free_shipping_threshold = excluded.free_shipping_threshold,
    estimated_min_days = excluded.estimated_min_days,
    estimated_max_days = excluded.estimated_max_days,
    is_active = true,
    sort_order = excluded.sort_order;
