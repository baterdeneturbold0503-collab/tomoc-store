-- Simple homepage CMS content store.

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "public read site content" on public.site_content;
create policy "public read site content"
  on public.site_content for select
  using (true);

drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content"
  on public.site_content for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_content(key,value)
values ('homepage','{}'::jsonb)
on conflict (key) do nothing;
