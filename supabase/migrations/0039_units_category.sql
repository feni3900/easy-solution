-- Smart Solution ERP - 0039_units_category
-- Units depend on category

alter table public.units add column if not exists category_id integer references public.categories(category_id) on delete cascade;

create index if not exists idx_units_category on public.units(category_id);
