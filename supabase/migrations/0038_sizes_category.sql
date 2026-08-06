-- Smart Solution ERP - 0038_sizes_category
-- Sizes depend on category

alter table public.sizes add column if not exists category_id integer references public.categories(category_id) on delete cascade;

create index if not exists idx_sizes_category on public.sizes(category_id);
