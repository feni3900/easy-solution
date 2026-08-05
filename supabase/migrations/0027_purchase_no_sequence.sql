-- Smart Solution ERP - 0027_purchase_no_sequence.sql
-- Sequential purchase invoice numbers: PUR-YYYYMM-00001, 00002, ...

-- 1) Sequence for the per-month running number.
create sequence if not exists public.purchase_no_seq;

-- 2) Rewrite next_purchase_no() to emit a sequential number.
create or replace function public.next_purchase_no()
returns text
language plpgsql
security definer
as $$
declare seq bigint;
begin
  select nextval('public.purchase_no_seq') into seq;
  return 'PUR-' || to_char(now(), 'YYYYMM') || '-' || lpad(seq::text, 5, '0');
end;
$$;

-- 3) Renumber existing purchases in date order so they start at ...-00001.
update public.purchases p
set purchase_no = 'PUR-' || to_char(p.purchase_date, 'YYYYMM') || '-' ||
  lpad((select count(*) from public.purchases p2 where p2.purchase_date <= p.purchase_date)::text, 5, '0')
where p.purchase_no is not null;
