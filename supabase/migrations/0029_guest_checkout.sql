-- Allow anonymous (guest) web checkout: insert orders/items/customers + deduct stock.

-- 1) RLS policies so anon can insert into the guest-checkout tables
create policy "Public insert access" on public.web_orders
  for insert to anon with check (true);

create policy "Public insert access" on public.order_items
  for insert to anon with check (true);

create policy "Public insert access" on public.customers
  for insert to anon with check (true);

-- 2) deduct_stock runs as the function owner so it can update products
--    and write stock_journal even for anon callers (controlled operation:
--    it still validates stock before deducting).
create or replace function public.deduct_stock(
  p_product_id int,
  p_quantity int,
  p_movement_type stock_movement_enum,
  p_reference_id int default null,
  p_reference_no varchar default null,
  p_notes text default null,
  p_created_by uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_stock int;
    v_new_stock int;
begin
    select current_stock into v_current_stock
    from products where product_id = p_product_id for update;

    if v_current_stock is null then
        raise exception 'Product not found: %', p_product_id;
    end if;

    if v_current_stock < p_quantity then
        raise exception 'Insufficient stock for product %: available %, requested %',
            p_product_id, v_current_stock, p_quantity;
    end if;

    v_new_stock := v_current_stock - p_quantity;

    update products set current_stock = v_new_stock where product_id = p_product_id;

    insert into stock_journal (product_id, movement_type, quantity_change, stock_before, stock_after,
                               reference_id, reference_no, notes, created_by)
    values (p_product_id, p_movement_type, -p_quantity, v_current_stock, v_new_stock,
            p_reference_id, p_reference_no, p_notes, p_created_by);

    return true;
end;
$$;

grant execute on function public.deduct_stock(int, int, stock_movement_enum, int, varchar, text, uuid) to anon, authenticated;

-- 3) anon needs sequence usage to insert rows with serial PKs
grant usage on sequence public.customers_customer_id_seq to anon, authenticated;
grant usage on sequence public.web_orders_order_id_seq to anon, authenticated;
grant usage on sequence public.order_items_order_item_id_seq to anon, authenticated;
