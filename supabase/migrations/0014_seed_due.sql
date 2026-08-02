-- Smart Solution ERP - 0014_seed_due.sql
-- Give demo customers outstanding dues so the cart's Previous/Current Due shows real values.
-- current_due is kept in sync by the customer_due_sync trigger on customer_ledger inserts.

update public.customers set previous_due = 500.00 where mobile = '01711111111';
update public.customers set previous_due = 250.00 where mobile = '06991111111';

insert into public.customer_ledger (customer_id, transaction_type, amount, date, note)
select id, 'sale', 300.00, now() - interval '5 days', 'Previous outstanding invoice'
from public.customers where mobile = '01711111111';

insert into public.customer_ledger (customer_id, transaction_type, amount, date, note)
select id, 'sale', 120.00, now() - interval '2 days', 'Previous outstanding invoice'
from public.customers where mobile = '06991111111';
