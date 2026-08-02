-- Smart Solution ERP - 0006_customers_suppliers
-- Customers + Customer Ledger, Suppliers + Supplier Ledger, Groups

create table if not exists public.customer_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_percent numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.customer_groups(id) on delete set null,
  name text not null,
  mobile text not null,   -- required per business rules
  email text,
  address text,
  previous_due numeric(14,2) not null default 0,
  current_due numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('sale', 'payment', 'return')),
  amount numeric(14,2) not null default 0,   -- + due, - paid
  date timestamptz not null default now(),
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.supplier_groups(id) on delete set null,
  name text not null,
  mobile text,
  company text,
  email text,
  address text,
  due_balance numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_ledger (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase', 'payment', 'return')),
  amount numeric(14,2) not null default 0,
  date timestamptz not null default now(),
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_mobile on public.customers(mobile);
create index if not exists idx_cust_ledger_customer on public.customer_ledger(customer_id);
create index if not exists idx_supp_ledger_supplier on public.supplier_ledger(supplier_id);

-- keep customer current_due in sync
create or replace function customer_due_sync()
returns trigger
language plpgsql
security definer
as $$
declare due numeric;
begin
  select coalesce(sum(amount), 0) into due
  from public.customer_ledger where customer_id = coalesce(new.customer_id, old.customer_id);
  update public.customers
    set current_due = due + previous_due
    where id = coalesce(new.customer_id, old.customer_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_cust_due_insert on public.customer_ledger;
create trigger trg_cust_due_insert after insert on public.customer_ledger
  for each row execute function customer_due_sync();
drop trigger if exists trg_cust_due_update on public.customer_ledger;
create trigger trg_cust_due_update after update on public.customer_ledger
  for each row execute function customer_due_sync();

-- keep supplier due_balance in sync
create or replace function supplier_due_sync()
returns trigger
language plpgsql
security definer
as $$
declare due numeric;
begin
  select coalesce(sum(amount), 0) into due
  from public.supplier_ledger where supplier_id = coalesce(new.supplier_id, old.supplier_id);
  update public.suppliers
    set due_balance = due
    where id = coalesce(new.supplier_id, old.supplier_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_supp_due_insert on public.supplier_ledger;
create trigger trg_supp_due_insert after insert on public.supplier_ledger
  for each row execute function supplier_due_sync();
drop trigger if exists trg_supp_due_update on public.supplier_ledger;
create trigger trg_supp_due_update after update on public.supplier_ledger
  for each row execute function supplier_due_sync();
