-- Verified customer reviews, moderation states, duplicate protection, and wishlist indexes.
alter table public.reviews add column if not exists customer_name text;
alter table public.reviews add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table public.reviews add column if not exists reviewer_hash text;
alter table public.reviews add column if not exists moderation_status text not null default 'pending';
alter table public.reviews add column if not exists moderated_at timestamptz;
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

update public.reviews
set customer_name=coalesce(nullif(customer_name,''),'TOMOC хэрэглэгч'),
    moderation_status=case when is_approved then 'approved' else 'pending' end
where customer_name is null or moderation_status is null;

alter table public.reviews alter column customer_name set not null;
alter table public.reviews drop constraint if exists reviews_moderation_status_check;
alter table public.reviews add constraint reviews_moderation_status_check
  check(moderation_status in ('pending','approved','rejected'));

create unique index if not exists reviews_product_reviewer_unique
  on public.reviews(product_id,reviewer_hash) where reviewer_hash is not null;
create unique index if not exists reviews_product_user_unique
  on public.reviews(product_id,user_id) where user_id is not null;
create index if not exists reviews_moderation_idx
  on public.reviews(moderation_status,created_at desc);
create index if not exists wishlists_user_created_idx
  on public.wishlists(user_id,created_at desc);

create or replace function public.sync_review_moderation()
returns trigger language plpgsql as $$
begin
  new.is_approved := new.moderation_status='approved';
  new.updated_at := now();
  if old.moderation_status is distinct from new.moderation_status then
    new.moderated_at := case when new.moderation_status='pending' then null else now() end;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_moderation_sync on public.reviews;
create trigger reviews_moderation_sync before update on public.reviews
for each row execute function public.sync_review_moderation();

drop policy if exists "public reads approved reviews" on public.reviews;
create policy "public reads approved reviews" on public.reviews for select
  using(moderation_status='approved' or auth.uid()=user_id or public.is_admin());

-- Review creation goes through the server route so purchase ownership can be verified.
drop policy if exists "users create reviews" on public.reviews;

