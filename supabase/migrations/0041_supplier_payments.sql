-- Smart Solution ERP - 0041_supplier_payments
-- Supplier payment ledger (mirror of customer_due_payments)

create table if not exists public.supplier_payments (
    payment_id serial primary key,
    supplier_id integer not null references public.suppliers(supplier_id),
    purchase_id integer null references public.purchases(purchase_id) on delete set null,
    amount_paid numeric(12,2) not null,
    payment_mode text not null default 'Cash',
    transaction_ref varchar(100) null,
    remarks text null,
    recorded_by uuid null references public.users(user_id),
    created_at timestamptz default now()
);

create index if not exists idx_supplier_payments_supplier on public.supplier_payments(supplier_id);
create index if not exists idx_supplier_payments_purchase on public.supplier_payments(purchase_id);

alter table public.supplier_payments enable row level security;

create policy "Authenticated full access" on public.supplier_payments
  for all to authenticated using (true) with check (true);
create policy "Authenticated read access" on public.supplier_payments
  for select to authenticated using (true);
create policy "Public read access" on public.supplier_payments
  for select to anon using (true);
create policy "Service role full access" on public.supplier_payments
  for all to service_role using (true) with check (true);

grant all on public.supplier_payments to authenticated, service_role, anon;
grant usage on sequence supplier_payments_payment_id_seq to authenticated, service_role, anon;
