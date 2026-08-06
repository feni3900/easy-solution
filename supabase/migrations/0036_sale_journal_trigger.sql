-- ============================================================
-- 0036_sale_journal_trigger.sql
-- Auto-post journal entries for completed sales invoices,
-- add plain-language Money In accounts.
-- ============================================================

-- 1) New accounts for the simplified Money In / Money Out flow
insert into public.chart_of_accounts (account_code, account_name, account_type) values
  ('2100','Loan Received','Liability'),
  ('3200','Owner Investment','Equity'),
  ('4200','Other Income','Revenue')
on conflict (account_code) do nothing;

-- 2) Trigger function: post a balanced journal entry per sale invoice
create or replace function public.post_sale_journal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cash_id     int;
  v_revenue_id  int;
  v_ar_id       int;
  v_entry_id    int;
  v_entry_no    varchar;
begin
  select account_id into v_cash_id from chart_of_accounts where account_code = '1000' limit 1;
  select account_id into v_revenue_id from chart_of_accounts where account_code = '4000' limit 1;
  select account_id into v_ar_id from chart_of_accounts where account_code = '1200' limit 1;

  v_entry_no := 'JE-SALE-' || new.invoice_id;
  if exists (select 1 from journal_entries where entry_no = v_entry_no) then
    return new;
  end if;

  insert into journal_entries (entry_no, entry_date, description, reference_type, reference_id, created_by)
  values (v_entry_no, new.sale_date::date, 'Sale invoice ' || new.invoice_no, new.channel::text, new.invoice_id, new.created_by)
  returning entry_id into v_entry_id;

  if new.paid_amount > 0 then
    insert into journal_entry_lines (entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_cash_id, 'Cash received', new.paid_amount, 0);
  end if;

  if new.due_amount > 0 then
    insert into journal_entry_lines (entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_ar_id, 'Due from customer', new.due_amount, 0);
  end if;

  insert into journal_entry_lines (entry_id, account_id, description, debit, credit)
  values (v_entry_id, v_revenue_id, 'Sales revenue', 0, new.total_amount);

  return new;
end;
$$;

drop trigger if exists trg_sale_journal on public.sales_invoices;
create trigger trg_sale_journal
after insert on public.sales_invoices
for each row execute function public.post_sale_journal();

-- 3) Backfill journal entries for existing sales invoices
do $$
declare
  r record;
  v_cash_id     int;
  v_revenue_id  int;
  v_ar_id       int;
  v_entry_id    int;
  v_entry_no    varchar;
begin
  select account_id into v_cash_id from chart_of_accounts where account_code = '1000' limit 1;
  select account_id into v_revenue_id from chart_of_accounts where account_code = '4000' limit 1;
  select account_id into v_ar_id from chart_of_accounts where account_code = '1200' limit 1;

  for r in
    select * from sales_invoices
    where not exists (select 1 from journal_entries where entry_no = 'JE-SALE-' || sales_invoices.invoice_id)
  loop
    v_entry_no := 'JE-SALE-' || r.invoice_id;
    insert into journal_entries (entry_no, entry_date, description, reference_type, reference_id, created_by)
    values (v_entry_no, r.sale_date::date, 'Sale invoice ' || r.invoice_no, r.channel::text, r.invoice_id, r.created_by)
    returning entry_id into v_entry_id;

    if r.paid_amount > 0 then
      insert into journal_entry_lines (entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_cash_id, 'Cash received', r.paid_amount, 0);
    end if;

    if r.due_amount > 0 then
      insert into journal_entry_lines (entry_id, account_id, description, debit, credit)
      values (v_entry_id, v_ar_id, 'Due from customer', r.due_amount, 0);
    end if;

    insert into journal_entry_lines (entry_id, account_id, description, debit, credit)
    values (v_entry_id, v_revenue_id, 'Sales revenue', 0, r.total_amount);
  end loop;
end;
$$;
