-- Smart Solution ERP - 0002_organization
-- Companies -> Branches -> Business Units -> Warehouses

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  currency text not null default 'BDT',
  phone text,
  email text,
  address text,
  logo text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  country text,
  city text,
  phone text,
  email text,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  location text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated before update on public.companies
  for each row execute function trigger_updated_at();
drop trigger if exists trg_branches_updated on public.branches;
create trigger trg_branches_updated before update on public.branches
  for each row execute function trigger_updated_at();
drop trigger if exists trg_units_updated on public.business_units;
create trigger trg_units_updated before update on public.business_units
  for each row execute function trigger_updated_at();
drop trigger if exists trg_warehouses_updated on public.warehouses;
create trigger trg_warehouses_updated before update on public.warehouses
  for each row execute function trigger_updated_at();
