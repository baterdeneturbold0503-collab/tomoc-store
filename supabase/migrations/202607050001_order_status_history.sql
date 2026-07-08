-- Records every order lifecycle transition for customer tracking and admin audit.
create table if not exists public.order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history(order_id, created_at);

alter table public.order_status_history enable row level security;

drop policy if exists "admins read order history" on public.order_status_history;
create policy "admins read order history"
  on public.order_status_history for select
  using(public.is_admin());

create or replace function public.record_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_status_history(order_id,status,created_by)
    values(new.id,new.status,auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history
after insert or update of status on public.orders
for each row execute function public.record_order_status_history();

-- Backfill the current status for existing orders without history.
insert into public.order_status_history(order_id,status)
select o.id,o.status from public.orders o
where not exists(select 1 from public.order_status_history h where h.order_id=o.id);
