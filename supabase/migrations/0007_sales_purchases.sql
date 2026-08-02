-- Smart Solution ERP - 0007_sales_purchases
-- Sales Orders/Items/Returns, Purchases/Items/Returns

do $$ begin
  create type order_status as enum ('pending', 'approved', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type payment_method as enum ('cash', 'credit', 'card', 'bank_transfer', 'mobile_payment');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type sales_channel as enum ('pos', 'online');
exception when duplicate_object then null;
end $$;

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique,
  customer_id uuid references public.customers(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  salesperson_id uuid references public.users(id) on delete set null,
  payment_method payment_method not null default 'cash',
  sales_channel sales_channel not null default 'pos',
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  order_date timestamptz not null default now(),
  status order_status not null default 'pending',
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.sales_orders(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity numeric(14,2) not null,
  reason text,
  date timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ begin
  create type purchase_status as enum ('draft', 'ordered', 'received', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_no text unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  purchase_date timestamptz not null default now(),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status purchase_status not null default 'draft',
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_returns (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references public.purchases(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity numeric(14,2) not null,
  reason text,
  date timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_customer on public.sales_orders(customer_id);
create index if not exists idx_sales_date on public.sales_orders(order_date);
create index if not exists idx_sales_items_order on public.sales_items(order_id);
create index if not exists idx_purchases_supplier on public.purchases(supplier_id);
create index if not exists idx_purchases_date on public.purchases(purchase_date);
create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);

-- Sales order inventory: on create, stock out + customer due
create or replace function sales_stock_out()
returns trigger
language plpgsql
security definer
as $$
declare item record;
begin
  for item in
    select * from public.sales_items where order_id = new.id
  loop
    perform append_ledger(
      item.product_id, 'sale', -abs(item.quantity), item.unit_price,
      new.branch_id, null, new.id::text, item.variant_id, 'Sale invoice ' || coalesce(new.invoice_no, '')
    );
  end loop;

  -- customer due
  if new.payment_method = 'credit' and new.customer_id is not null then
    insert into public.customer_ledger (customer_id, transaction_type, amount, date, reference_id, note)
    values (new.customer_id, 'sale', new.total - coalesce(new.paid_amount, 0), new.order_date, new.id::text, 'Invoice ' || coalesce(new.invoice_no, ''));
  end if;

  -- cash book for cash payment
  if new.payment_method in ('cash', 'card', 'mobile_payment') and coalesce(new.paid_amount, 0) > 0 then
    insert into public.cash_book (branch_id, transaction_type, amount, date, reference_id, note)
    values (new.branch_id, 'cash_in', new.paid_amount, new.order_date, new.id::text, 'Sale invoice ' || coalesce(new.invoice_no, ''));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sales_stock on public.sales_orders;
create trigger trg_sales_stock after insert on public.sales_orders
  for each row when (new.status <> 'pending')
  execute function sales_stock_out();

-- Sales return: stock back in
create or replace function sales_return_stock()
returns trigger
language plpgsql
security definer
as $$
begin
  perform append_ledger(
    new.product_id, 'return', abs(new.quantity), 0,
    (select branch_id from public.sales_orders where id = new.order_id),
    null, new.id::text, new.variant_id, 'Sales return'
  );
  return new;
end;
$$;

drop trigger if exists trg_sales_return_stock on public.sales_returns;
create trigger trg_sales_return_stock after insert on public.sales_returns
  for each row execute function sales_return_stock();

-- Purchase received: stock in + supplier due
create or replace function purchase_stock_in()
returns trigger
language plpgsql
security definer
as $$
declare item record;
begin
  for item in
    select * from public.purchase_items where purchase_id = new.id
  loop
    perform append_ledger(
      item.product_id, 'purchase', abs(item.quantity), item.unit_price,
      new.branch_id, null, new.id::text, item.variant_id, 'Purchase ' || coalesce(new.purchase_no, '')
    );
  end loop;

  if new.supplier_id is not null and (new.total - coalesce(new.paid_amount, 0)) > 0 then
    insert into public.supplier_ledger (supplier_id, transaction_type, amount, date, reference_id, note)
    values (new.supplier_id, 'purchase', new.total - coalesce(new.paid_amount, 0), new.purchase_date, new.id::text, 'Purchase ' || coalesce(new.purchase_no, ''));
  end if;

  if coalesce(new.paid_amount, 0) > 0 then
    insert into public.cash_book (branch_id, transaction_type, amount, date, reference_id, note)
    values (new.branch_id, 'cash_out', new.paid_amount, new.purchase_date, new.id::text, 'Purchase ' || coalesce(new.purchase_no, ''));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_purchase_stock on public.purchases;
create trigger trg_purchase_stock after insert on public.purchases
  for each row when (new.status in ('received', 'ordered'))
  execute function purchase_stock_in();
