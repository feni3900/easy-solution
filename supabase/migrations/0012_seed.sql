-- Smart Solution ERP - 0012_seed.sql
-- Demo data: two companies per the spec (Bangladesh + Greece)

insert into public.companies (name, country, currency, phone, email, address) values
  ('Maruf Enterprise', 'Bangladesh', 'BDT', '+8801712345678', 'info@maruf.com', 'Dhaka, Bangladesh'),
  ('Maa Electronics', 'Greece', 'EUR', '+302100000000', 'info@maaelectronics.gr', 'Athens, Greece')
on conflict do nothing;

insert into public.branches (company_id, name, country, city) 
select id, name || ' - Main Branch', country, case when country = 'Bangladesh' then 'Dhaka' else 'Athens' end
from public.companies
on conflict do nothing;

insert into public.units (name, symbol) values
  ('Piece', 'pc'), ('Box', 'box'), ('Kilogram', 'kg'), ('Liter', 'L')
on conflict do nothing;

insert into public.categories (name) values
  ('Perfume'), ('Electronics'), ('Stationery')
on conflict do nothing;

insert into public.brands (name) values
  ('Nike'), ('Samsung'), ('Casio'), ('Reynolds')
on conflict do nothing;

-- sample products
insert into public.products (barcode, sku, name, brand_id, category_id, unit_id, purchase_price, selling_price, minimum_stock, image)
select
  '890' || lpad(row_number() over ()::text, 9, '0'),
  'SKU-' || row_number() over ()::text,
  p.name,
  br.id, c.id, u.id,
  p.cost, p.price, 5, null
from (values
  ('Classic Perfume 50ml', 300, 450),
  ('Wireless Headphones', 1200, 1600),
  ('Notebook A4', 40, 60),
  ('Mechanical Keyboard', 900, 1250),
  ('Eau de Cologne 100ml', 500, 700)
) as p(name, cost, price)
cross join lateral (select id from public.brands order by random() limit 1) br
cross join lateral (select id from public.categories where name = case
  when p.name ilike '%perfume%' or p.name ilike '%cologne%' then 'Perfume'
  when p.name ilike '%headphone%' or p.name ilike '%keyboard%' then 'Electronics'
  else 'Stationery' end) c
cross join lateral (select id from public.units order by random() limit 1) u
on conflict (barcode) do nothing;

-- demo customers + suppliers
insert into public.customers (name, mobile, email, address) values
  ('Rahim Uddin', '01711111111', 'rahim@mail.com', 'Dhaka'),
  ('Maria Papadopoulou', '06991111111', 'maria@mail.gr', 'Athens'),
  ('Walk-in Customer', '00000000000', null, null)
on conflict do nothing;

insert into public.suppliers (name, mobile, company, email, address) values
  ('Supplier One', '01822222222', 'Global Traders', 'supplier1@mail.com', 'Dhaka'),
  ('Supplier Two', '06992222222', 'Euro Imports', 'supplier2@mail.gr', 'Athens')
on conflict do nothing;
