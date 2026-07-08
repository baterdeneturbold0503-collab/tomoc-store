-- QPay Merchant V2 invoice state and verification audit.
create table if not exists public.qpay_invoices (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  invoice_id text not null unique,
  qr_text text,
  qpay_short_url text,
  status text not null default 'pending' check(status in ('pending','paid','failed','cancelled')),
  paid_amount integer not null default 0,
  payment_id text,
  last_checked_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qpay_invoices_status_idx on public.qpay_invoices(status,created_at desc);
alter table public.qpay_invoices enable row level security;
drop policy if exists "admins qpay invoices" on public.qpay_invoices;
create policy "admins qpay invoices" on public.qpay_invoices for select using(public.is_admin());
drop trigger if exists qpay_invoices_updated on public.qpay_invoices;
create trigger qpay_invoices_updated before update on public.qpay_invoices for each row execute function public.set_updated_at();

