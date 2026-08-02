-- Smart Solution ERP - 0020_store_branches.sql
-- Link products to a store/branch so the storefront can filter by country store.
-- Also expose active branches publicly so the storefront can render the store switcher.

alter table public.products
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

create index if not exists idx_products_branch on public.products(branch_id);

-- public read for active branches (storefront switcher)
create policy "branches_public_read" on public.branches
  for select using (status = 'active');

-- backfill: split the demo catalog between the two stores
update public.products
set branch_id = (select id from public.branches where country = 'Bangladesh' limit 1)
where branch_id is null
  and name in ('Classic Perfume 50ml', 'Wireless Headphones', 'Notebook A4');

update public.products
set branch_id = (select id from public.branches where country = 'Greece' limit 1)
where branch_id is null
  and name in ('Mechanical Keyboard', 'Eau de Cologne 100ml');
