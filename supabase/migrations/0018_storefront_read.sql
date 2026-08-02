-- Smart Solution ERP - 0018_storefront_read.sql
-- Public storefront needs anonymous read access to the catalog (products,
-- categories, brands). Restrict to active rows only. Stock/price fields are
-- intentionally exposed for the storefront.

create policy "products_public_read" on public.products
  for select using (status = 'active');

create policy "categories_public_read" on public.categories
  for select using (status = 'active');

create policy "brands_public_read" on public.brands
  for select using (status = 'active');

create policy "variants_public_read" on public.product_variants
  for select using (true);

create policy "reviews_public_read" on public.reviews
  for select using (status = 'approved');
