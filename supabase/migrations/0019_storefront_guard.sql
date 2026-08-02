-- Smart Solution ERP - 0019_storefront_guard.sql
-- Prevent online orders of inactive or coming-soon products.

create or replace function place_online_order(
  p_name text,
  p_mobile text,
  p_address text default '',
  p_note text default '',
  p_items jsonb default '[]',
  p_branch_id uuid default null
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

  -- branch: explicit branch from the store, else the first product's branch, else first active
  select id into v_branch_id
  from public.branches
  where id = p_branch_id and status = 'active';

  if v_branch_id is null then
    select b.id into v_branch_id
    from public.products pr
    join public.branches b on b.id = pr.branch_id and b.status = 'active'
    where pr.id = (p_items->0->>'product_id')::uuid
    limit 1;
  end if;

  if v_branch_id is null then
    select id into v_branch_id
    from public.branches
    where status = 'active'
    order by created_at
    limit 1;
  end if;

  -- validate items + compute subtotal and total quantity
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;
    if coalesce(v_product.status, '') <> 'active' then
      raise exception 'Product is not available for order: %', v_product.name;
    end if;
    if coalesce(v_product.is_coming_soon, false) then
      raise exception 'Product is coming soon: %', v_product.name;
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
    'customer_id', v_customer_id,
    'branch_id', v_branch_id
  );
end;
$$;

grant execute on function place_online_order(text, text, text, text, jsonb, uuid) to anon, authenticated;
