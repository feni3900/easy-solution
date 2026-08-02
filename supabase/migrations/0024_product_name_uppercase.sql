-- Smart Solution ERP - 0024_product_name_uppercase
-- Normalize existing product names to uppercase (new ones are uppercased in the UI)
update public.products set name = upper(name) where name <> upper(name);
