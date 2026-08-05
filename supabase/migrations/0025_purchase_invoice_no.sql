-- Smart Solution ERP - 0025_purchase_invoice_no.sql
-- Backfill purchase_no for existing purchases that were created without one.
-- Format matches next_purchase_no(): PUR-YYYYMM-XXXX (random 4-digit).

update public.purchases p
set purchase_no = 'PUR-' || to_char(purchase_date, 'YYYYMM') || '-' || lpad(floor(random() * 9000 + 1000)::int::text, 4, '0')
where p.purchase_no is null or p.purchase_no = '';

-- Make sure future inserts keep a number even if the client misses it.
create or replace function ensure_purchase_no()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.purchase_no is null or new.purchase_no = '' then
    new.purchase_no := public.next_purchase_no();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_purchase_no on public.purchases;
create trigger trg_purchase_no before insert on public.purchases
  for each row execute function ensure_purchase_no();
