-- Smart Solution ERP - 0005_inventory
-- Inventory Ledger (single source of truth), Adjustments, Transfers, Damages

do $$ begin
  create type inventory_txn_type as enum ('purchase', 'sale', 'return', 'transfer_in', 'transfer_out', 'damage', 'adjustment', 'opening');
exception when duplicate_object then null;
end $$;

create table if not exists public.inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  transaction_type inventory_txn_type not null,
  quantity numeric(14,2) not null default 0,   -- positive = in, negative = out
  unit_cost numeric(14,2) not null default 0,
  date timestamptz not null default now(),
  branch_id uuid references public.branches(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  reference_id text,  -- order / purchase / transfer id
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  quantity_change numeric(14,2) not null,   -- + gain, - loss
  reason text,
  date timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  from_warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  to_warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity numeric(14,2) not null,
  date timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.damaged_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  quantity numeric(14,2) not null,
  reason text,
  date timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ledger_product on public.inventory_ledger(product_id);
create index if not exists idx_ledger_date on public.inventory_ledger(date);

-- current stock = sum of ledger quantities for a product (optionally per warehouse/variant)
create or replace function current_stock(p_product uuid, p_variant uuid default null, p_warehouse uuid default null)
returns numeric
language sql
stable
as $$
  select coalesce(sum(quantity), 0)
  from public.inventory_ledger
  where product_id = p_product
    and (p_variant is null or variant_id = p_variant)
    and (p_warehouse is null or warehouse_id = p_warehouse);
$$;

-- helper: append ledger row (single write point)
create or replace function append_ledger(
  p_product uuid, p_type inventory_txn_type, p_qty numeric, p_cost numeric default 0,
  p_branch uuid default null, p_warehouse uuid default null, p_ref text default null,
  p_variant uuid default null, p_note text default null
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.inventory_ledger
    (product_id, variant_id, transaction_type, quantity, unit_cost, date, branch_id, warehouse_id, reference_id, note)
  values
    (p_product, p_variant, p_type, p_qty, p_cost, now(), p_branch, p_warehouse, p_ref, p_note);
end;
$$;

-- stock adjustment automatically writes to ledger
create or replace function stock_adjustment_ledger()
returns trigger
language plpgsql
security definer
as $$
begin
  perform append_ledger(
    new.product_id, 'adjustment', new.quantity_change, 0,
    null, new.warehouse_id, new.id::text, new.variant_id, 'Stock adjustment: ' || coalesce(new.reason, '')
  );
  return new;
end;
$$;

drop trigger if exists trg_adjustment_ledger on public.stock_adjustments;
create trigger trg_adjustment_ledger after insert on public.stock_adjustments
  for each row execute function stock_adjustment_ledger();

-- damaged product automatically writes to ledger
create or replace function damage_ledger()
returns trigger
language plpgsql
security definer
as $$
begin
  perform append_ledger(
    new.product_id, 'damage', -abs(new.quantity), 0,
    null, new.warehouse_id, new.id::text, new.variant_id, 'Damaged: ' || coalesce(new.reason, '')
  );
  return new;
end;
$$;

drop trigger if exists trg_damage_ledger on public.damaged_products;
create trigger trg_damage_ledger after insert on public.damaged_products
  for each row execute function damage_ledger();

-- stock transfer writes transfer_out (from) and transfer_in (to)
create or replace function transfer_ledger()
returns trigger
language plpgsql
security definer
as $$
begin
  perform append_ledger(new.product_id, 'transfer_out', -abs(new.quantity), 0, null, new.from_warehouse_id, new.id::text, new.variant_id, 'Transfer out');
  perform append_ledger(new.product_id, 'transfer_in', abs(new.quantity), 0, null, new.to_warehouse_id, new.id::text, new.variant_id, 'Transfer in');
  return new;
end;
$$;

drop trigger if exists trg_transfer_ledger on public.stock_transfers;
create trigger trg_transfer_ledger after insert on public.stock_transfers
  for each row execute function transfer_ledger();
