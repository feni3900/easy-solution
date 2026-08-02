-- Smart Solution ERP - 0016_supplier_payment.sql
-- Record a payment to a supplier. Inserts into supplier_ledger (reduces due via
-- trg_supp_due_insert) and cash_book. Security definer so the client doesn't need
-- direct write access to the ledger tables.

create or replace function record_supplier_payment(
  p_supplier_id uuid,
  p_amount numeric,
  p_date timestamptz default now(),
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive';
  end if;

  insert into public.supplier_ledger (supplier_id, transaction_type, amount, date, reference_id, note)
  values (p_supplier_id, 'payment', -abs(p_amount), p_date, gen_random_uuid()::text, coalesce(p_note, ''));

  insert into public.cash_book (branch_id, transaction_type, amount, date, reference_id, note)
  values (
    (select branch_id from public.users where id = auth.uid()),
    'cash_out',
    p_amount,
    p_date,
    gen_random_uuid()::text,
    coalesce(p_note, 'Supplier payment')
  );
end;
$$;

grant execute on function record_supplier_payment(uuid, numeric, timestamptz, text) to authenticated;
