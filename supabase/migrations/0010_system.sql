-- Smart Solution ERP - 0010_system
-- Settings, Audit Logs, Backup History, Notifications, Login History

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb,
  group_name text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.backup_history (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  date timestamptz not null default now(),
  status text not null default 'success' check (status in ('success', 'failed', 'in_progress')),
  size_bytes bigint default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,   -- low_stock, payment, supplier_due, new_order, purchase_received
  title text not null,
  message text,
  is_read boolean not null default false,
  data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  ip_address text,
  user_agent text,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_audit_created on public.audit_logs(created_at);

-- default settings
insert into public.settings (key, value, group_name) values
  ('company_name', '"Smart Solution"', 'company'),
  ('company_currency', '"BDT"', 'company'),
  ('company_language', '"en"', 'company'),
  ('low_stock_alert', '10', 'inventory'),
  ('allow_negative_stock', 'false', 'inventory'),
  ('cashier_discount_limit', '0', 'sales'),
  ('branch_manager_discount_min', '5', 'sales'),
  ('branch_manager_discount_max', '10', 'sales'),
  ('bulk_discount_percent', '20', 'sales'),
  ('bulk_discount_min_items', '6', 'sales'),
  ('invoice_prefix', '"INV-"', 'pos'),
  ('auto_receipt_print', 'true', 'pos')
on conflict (key) do nothing;

-- auto-generate invoice numbers
create or replace function next_invoice_no()
returns text
language plpgsql
security definer
as $$
declare prefix text; seq bigint;
begin
  select coalesce(value->>0, 'INV-') into prefix from public.settings where key = 'invoice_prefix';
  seq := (nextval(pg_get_serial_sequence('public.sales_orders', 'id')) + 1000);
  return prefix || to_char(now(), 'YYYYMM') || '-' || seq;
end;
$$;

create or replace function next_purchase_no()
returns text
language plpgsql
as $$
begin
  return 'PUR-' || to_char(now(), 'YYYYMM') || '-' || floor(random() * 9000 + 1000)::bigint;
end;
$$;

-- low stock notifications
create or replace function low_stock_notify()
returns trigger
language plpgsql
security definer
as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  insert into public.notifications (user_id, type, title, message, data)
  select u.id, 'low_stock', 'Low stock alert',
         'Product stock is below minimum threshold',
         jsonb_build_object('product_id', pid)
  from public.users u
  where u.role_id in (select id from public.roles where name in ('super_admin', 'company_admin', 'warehouse_manager'));
  return coalesce(new, old);
end;
$$;
