-- Smart Solution ERP - 0017_online_store.sql
-- Public mobile storefront support:
--  * product flags for homepage sections (popular / best seller / coming soon)
--  * 'cod' (cash on delivery) payment method
--  * place_online_order() security-definer RPC: create/reuse customer by mobile,
--    insert sales_order (sales_channel='online', no salesperson, COD) + items.

alter table public.products
  add column if not exists is_popular boolean not null default false,
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_coming_soon boolean not null default false;

do $$ begin
  alter type payment_method add value if not exists 'cod';
exception when duplicate_object then null;
end $$;

-- Bulk discount tiers shared by cart UI + server-side order placement.
create or replace function bulk_discount_pct(p_quantity numeric)
returns numeric
language sql
immutable
as $$
  select case
    when p_quantity >= 24 then 15.0
    when p_quantity >= 12 then 10.0
    when p_quantity >= 6  then 5.0
    else 0.0
  end;
$$;

create or replace function place_online_order(
  p_name text,
  p_mobile text,
  p_address text default '',
  p_note text default '',
  p_items jsonb default '[]'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_branch_id uuid;
  v_order_id uuid;
  v_invoice_no text;
  v_subtotal numeric := 0;
  v_qty numeric := 0;
  v_discount numeric := 0;
  v_item jsonb;
  v_product record;
begin
  if p_name is null or trim(p_name) = '' then
    raise exception 'Customer name is required';
  end if;
  if p_mobile is null or trim(p_mobile) = '' then
    raise exception 'Mobile number is required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- reuse existing customer by mobile, otherwise create
  select id into v_customer_id
  from public.customers
  where mobile = trim(p_mobile)
  order by created_at
  limit 1;

  if v_customer_id is null then
    insert into public.customers (name, mobile, address, status)
    values (trim(p_name), trim(p_mobile), nullif(trim(p_address), ''), 'active')
    returning id into v_customer_id;
  end if;

  -- branch: first active branch
  select id into v_branch_id
  from public.branches
  where status = 'active'
  order by created_at
  limit 1;

  -- validate items + compute subtotal and total quantity
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;

    v_subtotal := v_subtotal + v_product.selling_price * coalesce((v_item->>'quantity')::numeric, 1);
    v_qty := v_qty + coalesce((v_item->>'quantity')::numeric, 1);
  end loop;

  v_discount := round(v_subtotal * bulk_discount_pct(v_qty) / 100.0, 2);

  v_invoice_no := 'ONL-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*100000)::int::text, 5, '0');

  insert into public.sales_orders (
    invoice_no, customer_id, branch_id, salesperson_id,
    payment_method, sales_channel, subtotal, discount, tax, total,
    paid_amount, order_date, status, note
  ) values (
    v_invoice_no, v_customer_id, v_branch_id, null,
    'cod', 'online', v_subtotal, v_discount, 0, v_subtotal - v_discount,
    0, now(), 'completed', nullif(trim(p_note), '')
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    insert into public.sales_items (
      order_id, product_id, variant_id, quantity, unit_price, discount, total
    ) values (
      v_order_id,
      v_product.id,
      (v_item->>'variant_id')::uuid,
      coalesce((v_item->>'quantity')::numeric, 1),
      v_product.selling_price,
      0,
      v_product.selling_price * coalesce((v_item->>'quantity')::numeric, 1)
    );
  end loop;

  return jsonb_build_object(
    'id', v_order_id,
    'invoice_no', v_invoice_no,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_subtotal - v_discount,
    'customer_id', v_customer_id
  );
end;
$$;

grant execute on function bulk_discount_pct(numeric) to anon, authenticated;
grant execute on function place_online_order(text, text, text, text, jsonb) to anon, authenticated;
