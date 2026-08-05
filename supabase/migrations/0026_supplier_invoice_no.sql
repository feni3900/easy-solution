-- Smart Solution ERP - 0026_supplier_invoice_no.sql
-- Record the supplier's own invoice/bill number on a purchase.

alter table public.purchases
  add column if not exists supplier_invoice_no text;
