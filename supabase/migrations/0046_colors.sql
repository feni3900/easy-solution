-- Maruf Enterprise - 0046_colors
-- Colors master table for Add/Remove menu, plus color column on products

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  color_name text not null,
  category_id bigint,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create index if not exists idx_colors_name on public.colors(lower(color_name));

alter table public.products
  add column if not exists color text;

alter table public.colors enable row level security;

create policy "colors_auth_all" on public.colors
  for all to authenticated using (true) with check (true);
create policy "colors_service_all" on public.colors
  for all to service_role using (true) with check (true);

grant select, insert, update, delete on public.colors to authenticated;