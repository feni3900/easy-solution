-- Smart Solution ERP - 0013_fix_item_triggers
-- Move stock ledger writes from parent (orders/purchases) triggers to item triggers.
-- Previously the parent trigger ran before line items were inserted (client inserts them
-- in a separate request), so no ledger entries were created and the insert errored.

-- Sales: ledger entry per line item (uses parent order's branch)
create or replace function sales_item_ledger()
returns trigger
language plpgsql
security definer
as $$
begin
  perform append_ledger(
    new.product_id, 'sale', -abs(new.quantity), new.unit_price,
    (select branch_id from public.sales_orders where id = new.order_id),
    null, new.order_id::text, new.variant_id, 'Sale invoice'
  );
  return new;
end;
$$;

drop trigger if exists trg_sales_item_ledger on public.sales_items;
create trigger trg_sales_item_ledger after insert on public.sales_items
  for each row execute function sales_item_ledger();

-- Purchases: ledger entry per line item (uses parent purchase's branch)
create or replace function purchase_item_ledger()
returns trigger
language plpgsql
security definer
as $$
declare br uuid;
begin
  select branch_id into br from public.purchases where id = new.purchase_id;
  perform append_ledger(
    new.product_id, 'purchase', abs(new.quantity), new.unit_price,
    br, null, new.purchase_id::text, new.variant_id, 'Purchase ' || coalesce(
      (select purchase_no from public.purchases where id = new.purchase_id), '')
  );
  return new;
end;
$$;

drop trigger if exists trg_purchase_item_ledger on public.purchase_items;
create trigger trg_purchase_item_ledger after insert on public.purchase_items
  for each row execute function purchase_item_ledger();

-- Parent triggers: keep only customer/supplier due + cash book (fire on insert).
-- Guard the sales one on status so pending orders don't move stock before approval.
create or replace function sales_stock_out()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.payment_method = 'credit' and new.customer_id is not null then
    insert into public.customer_ledger (customer_id, transaction_type, amount, date, reference_id, note)
    values (new.customer_id, 'sale', new.total - coalesce(new.paid_amount, 0), new.order_date, new.id::text, 'Invoice ' || coalesce(new.invoice_no, ''));
  end if;

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

create or replace function purchase_stock_in()
returns trigger
language plpgsql
security definer
as $$
begin
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
