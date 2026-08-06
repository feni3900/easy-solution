-- Smart Solution ERP - 0037_add_remove_sizes
-- Sizes and Units master tables for Add/Remove menu

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  size_name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create index if not exists idx_sizes_name on public.sizes(lower(size_name));

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create index if not exists idx_units_name on public.units(lower(name));

alter table public.sizes enable row level security;
alter table public.units enable row level security;

create policy "sizes_auth_all" on public.sizes
  for all to authenticated using (true) with check (true);
create policy "sizes_service_all" on public.sizes
  for all to service_role using (true) with check (true);

create policy "units_auth_all" on public.units
  for all to authenticated using (true) with check (true);
create policy "units_service_all" on public.units
  for all to service_role using (true) with check (true);

grant select, insert, update, delete on public.sizes to authenticated;
grant select, insert, update, delete on public.units to authenticated;
