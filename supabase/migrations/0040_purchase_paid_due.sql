-- Smart Solution ERP - 0040_purchase_paid_due
-- Add paid_amount and due_amount to purchases, backfill from notes/partial payment data

alter table public.purchases add column if not exists paid_amount numeric(12,2) not null default 0;
alter table public.purchases add column if not exists due_amount numeric(12,2) not null default 0;

-- Backfill existing rows from payment_type + notes (Partial stores "Cash: X | Due: Y")
update public.purchases
set paid_amount = case
      when payment_type = 'Cash' then total_amount
      when payment_type = 'Partial' then coalesce((substring(notes from 'Cash: ([0-9.]+)'))::numeric, 0)
      else 0
    end,
    due_amount = case
      when payment_type = 'Credit' then total_amount
      when payment_type = 'Partial' then coalesce((substring(notes from 'Due: ([0-9.]+)'))::numeric, total_amount)
      else 0
    end
where paid_amount = 0 and due_amount = 0;
