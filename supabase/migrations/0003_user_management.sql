-- Smart Solution ERP - 0003_user_management
-- Roles, Permissions, Users (linked to auth.users), Activity Logs

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  module_name text not null,
  access_level text not null default 'read' check (access_level in ('read', 'write', 'full')),
  created_at timestamptz not null default now(),
  unique (role_id, module_name)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  role_id uuid not null references public.roles(id),
  full_name text not null,
  mobile text,
  email text,
  photo text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_users_updated on public.users;
create trigger trg_users_updated before update on public.users
  for each row execute function trigger_updated_at();

-- default roles
insert into public.roles (name, description) values
  ('super_admin', 'Full access, unlimited discounts, credit approval, manage users/settings'),
  ('company_admin', 'Manage company level modules'),
  ('branch_manager', 'Branch only access, approve credit sales, 5-10% discount'),
  ('cashier', 'POS sales, cash collection'),
  ('salesperson', 'Limited sales role'),
  ('accountant', 'Financial reports, ledgers'),
  ('warehouse_manager', 'Stock management')
on conflict (name) do nothing;

-- audit helper
create or replace function log_activity()
returns trigger
language plpgsql
as $$
begin
  insert into public.activity_logs (user_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    TG_ARGV[0],
    TG_ARGV[1],
    coalesce(new.id::text, old.id::text),
    row_to_json(new)::jsonb
  );
  return coalesce(new, old);
end;
$$;
