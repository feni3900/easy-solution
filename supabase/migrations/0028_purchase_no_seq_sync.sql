-- Smart Solution ERP - 0028_purchase_no_seq_sync.sql
-- Advance the purchase_no sequence past existing numbers so new
-- purchases don't collide with already-issued PUR-...-0000N.

select setval('public.purchase_no_seq', coalesce(max(seq), 0))
from (
  select right(purchase_no, 5)::bigint as seq
  from public.purchases
  where purchase_no ~ 'PUR-[0-9]{6}-[0-9]{5}$'
) s;
