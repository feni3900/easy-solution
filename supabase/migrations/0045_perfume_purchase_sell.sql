-- Smart Solution ERP - 0045_perfume_purchase_sell
-- Maruf Perfume: raw-material purchases (ingredients + bottles) and finished-goods sales (invoices).
-- NOTE: adapted to the live DB schema (suppliers.supplier_id / customers.customer_id, no ledger tables).

-- ---------------------------------------------------------------------------
-- Purchases
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_purchases (
  id bigint generated always as identity primary key,
  purchase_no text not null unique,
  supplier_id bigint references public.suppliers(supplier_id) on delete set null,
  purchase_date timestamptz not null default now(),
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- item_type: 'ingredient' | 'bottle'
create table if not exists public.perfume_purchase_items (
  id bigint generated always as identity primary key,
  purchase_id bigint not null references public.perfume_purchases(id) on delete cascade,
  item_type text not null check (item_type in ('ingredient', 'bottle')),
  item_id bigint not null,
  quantity numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0
);

-- ---------------------------------------------------------------------------
-- Sales (finished perfume invoices)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_sales (
  id bigint generated always as identity primary key,
  invoice_no text not null unique,
  customer_id bigint references public.customers(customer_id) on delete set null,
  sale_date timestamptz not null default now(),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  due_amount numeric(14,2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'credit', 'card', 'mobile_payment')),
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.perfume_sale_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references public.perfume_sales(id) on delete cascade,
  recipe_id bigint not null references public.perfume_recipes(id),
  quantity numeric(14,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfume_purchases enable row level security;
alter table public.perfume_purchase_items enable row level security;
alter table public.perfume_sales enable row level security;
alter table public.perfume_sale_items enable row level security;

create policy "perfume_purchases_read" on public.perfume_purchases
  for select to authenticated using (true);
create policy "perfume_purchases_write" on public.perfume_purchases
  for all to authenticated using (true) with check (true);

create policy "perfume_purchase_items_read" on public.perfume_purchase_items
  for select to authenticated using (true);
create policy "perfume_purchase_items_write" on public.perfume_purchase_items
  for all to authenticated using (true) with check (true);

create policy "perfume_sales_read" on public.perfume_sales
  for select to authenticated using (true);
create policy "perfume_sales_write" on public.perfume_sales
  for all to authenticated using (true) with check (true);

create policy "perfume_sale_items_read" on public.perfume_sale_items
  for select to authenticated using (true);
create policy "perfume_sale_items_write" on public.perfume_sale_items
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.perfume_purchases to authenticated;
grant select, insert, update, delete on public.perfume_purchase_items to authenticated;
grant select, insert, update, delete on public.perfume_sales to authenticated;
grant select, insert, update, delete on public.perfume_sale_items to authenticated;

-- ---------------------------------------------------------------------------
-- Purchase raw materials (ingredients + bottles) atomically.
-- p_items jsonb: [{"type":"ingredient"|"bottle","id":..,"qty":..,"unit_price":..}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.purchase_perfume_raw(
  p_supplier_id bigint default null,
  p_items jsonb default null,
  p_paid numeric default 0,
  p_note text default null,
  p_purchase_date timestamptz default now()
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_no text;
  v_total numeric := 0;
  v_item record;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No purchase items';
  end if;

  v_purchase_no := 'PPUR-' || to_char(p_purchase_date, 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  insert into perfume_purchases (purchase_no, supplier_id, purchase_date, paid_amount, note, created_by)
  values (v_purchase_no, p_supplier_id, p_purchase_date, coalesce(p_paid, 0), p_note, auth.uid());

  for v_item in select * from jsonb_to_recordset(p_items) as x("type" text, id bigint, qty numeric, unit_price numeric)
  loop
    if v_item.type = 'ingredient' then
      if not exists (select 1 from perfume_ingredients where id = v_item.id) then
        raise exception 'Ingredient id % not found', v_item.id;
      end if;
      update perfume_ingredients
      set stock_qty = stock_qty + v_item.qty,
          cost_per_unit = v_item.unit_price
      where id = v_item.id;
    elsif v_item.type = 'bottle' then
      if not exists (select 1 from perfume_bottles where id = v_item.id) then
        raise exception 'Bottle id % not found', v_item.id;
      end if;
      update perfume_bottles
      set stock_qty = stock_qty + v_item.qty,
          cost_per_unit = v_item.unit_price
      where id = v_item.id;
    else
      raise exception 'Unknown item type: %', v_item.type;
    end if;

    v_total := v_total + (v_item.qty * v_item.unit_price);

    insert into perfume_purchase_items (purchase_id, item_type, item_id, quantity, unit_price, total)
    values ((select id from perfume_purchases where purchase_no = v_purchase_no), v_item.type, v_item.id, v_item.qty, v_item.unit_price, v_item.qty * v_item.unit_price);
  end loop;

  update perfume_purchases
  set total = round(v_total, 2)
  where purchase_no = v_purchase_no;

  return v_purchase_no;
end;
$$;

grant execute on function public.purchase_perfume_raw(bigint, jsonb, numeric, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Sell finished perfume atomically.
-- p_items jsonb: [{"recipe_id":..,"qty":..,"unit_price":..}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.sell_perfume(
  p_customer_id bigint default null,
  p_items jsonb default null,
  p_paid numeric default 0,
  p_payment_method text default 'cash',
  p_discount numeric default 0,
  p_note text default null,
  p_sale_date timestamptz default now()
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_no text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_due numeric := 0;
  v_item record;
  v_stock numeric;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No sale items';
  end if;

  v_invoice_no := 'PSAL-' || to_char(p_sale_date, 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  insert into perfume_sales (invoice_no, customer_id, sale_date, paid_amount, payment_method, discount, note, created_by)
  values (v_invoice_no, p_customer_id, p_sale_date, coalesce(p_paid, 0), coalesce(p_payment_method, 'cash'), coalesce(p_discount, 0), p_note, auth.uid());

  for v_item in select * from jsonb_to_recordset(p_items) as x(recipe_id bigint, qty numeric, unit_price numeric)
  loop
    select stock_qty into v_stock from perfume_stock where recipe_id = v_item.recipe_id;
    if v_stock is null or v_stock < v_item.qty then
      raise exception 'Insufficient finished stock for recipe id % (have %, need %)',
        v_item.recipe_id, coalesce(v_stock, 0), v_item.qty;
    end if;

    update perfume_stock
    set stock_qty = stock_qty - v_item.qty,
        updated_at = now()
    where recipe_id = v_item.recipe_id;

    v_subtotal := v_subtotal + (v_item.qty * v_item.unit_price);

    insert into perfume_sale_items (sale_id, recipe_id, quantity, unit_price, total)
    values ((select id from perfume_sales where invoice_no = v_invoice_no), v_item.recipe_id, v_item.qty, v_item.unit_price, v_item.qty * v_item.unit_price);
  end loop;

  v_total := v_subtotal - coalesce(p_discount, 0);
  v_due := v_total - coalesce(p_paid, 0);

  update perfume_sales
  set subtotal = round(v_subtotal, 2),
      total = round(v_total, 2),
      due_amount = round(v_due, 2)
  where invoice_no = v_invoice_no;

  return v_invoice_no;
end;
$$;

grant execute on function public.sell_perfume(bigint, jsonb, numeric, text, numeric, text, timestamptz) to authenticated;
