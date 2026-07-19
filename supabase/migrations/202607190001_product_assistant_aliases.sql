alter table public.products add column if not exists aliases text[] not null default '{}';

comment on column public.products.aliases is 'Optional product search aliases for TOMOC AI assistant, for example Mongolian/English spelling variants.';

update public.products
set aliases = array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array[
  'ann chery',
  'annchery',
  'анн чери',
  'анн чэри',
  'аннчери',
  'анн чери корсет',
  'латекс корсет',
  'корсет'
]))
where slug = 'ann-chery';
