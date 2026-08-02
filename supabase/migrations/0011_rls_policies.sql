-- Smart Solution ERP - 0011_rls_policies
-- Row Level Security. Role helpers.

create or replace function current_role_name()
returns text
language sql
stable
security definer
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid();
$$;

create or replace function current_user_branch()
returns uuid
language sql
stable
security definer
as $$
  select branch_id from public.users where id = auth.uid();
$$;

-- enable RLS on all tables
alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.business_units enable row level security;
alter table public.warehouses enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.users enable row level security;
alter table public.activity_logs enable row level security;
alter table public.units enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_ledger enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.stock_transfers enable row level security;
alter table public.damaged_products enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_items enable row level security;
alter table public.sales_returns enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.purchase_returns enable row level security;
alter table public.customer_groups enable row level security;
alter table public.customers enable row level security;
alter table public.customer_ledger enable row level security;
alter table public.supplier_groups enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_ledger enable row level security;
alter table public.cash_book enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
alter table public.website_products enable row level security;
alter table public.website_categories enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.backup_history enable row level security;
alter table public.notifications enable row level security;
alter table public.login_history enable row level security;

-- super admin / company admin can do everything on org + catalog
create policy "org_manage_any" on public.companies
  for all using (current_role_name() in ('super_admin')) with check (current_role_name() in ('super_admin'));

create policy "org_read_all" on public.companies
  for select using (current_role_name() is not null);

create policy "branches_manage" on public.branches
  for all using (current_role_name() in ('super_admin', 'company_admin'))
  with check (current_role_name() in ('super_admin', 'company_admin'));

create policy "branches_read_all" on public.branches
  for select using (current_role_name() is not null);

create policy "units_manage" on public.business_units
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "units_read" on public.business_units
  for select using (current_role_name() is not null);

create policy "warehouses_manage" on public.warehouses
  for all using (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'));

create policy "warehouses_read" on public.warehouses
  for select using (current_role_name() is not null);

-- products: staff can read, admin-ish can write
create policy "products_read" on public.products
  for select using (current_role_name() is not null);

create policy "products_write" on public.products
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'warehouse_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'warehouse_manager'));

create policy "catalog_read" on public.categories
  for select using (current_role_name() is not null);
create policy "catalog_write" on public.categories
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "brands_read" on public.brands
  for select using (current_role_name() is not null);
create policy "brands_write" on public.brands
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "units_read" on public.units
  for select using (current_role_name() is not null);
create policy "units_write" on public.units
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "variants_read" on public.product_variants
  for select using (current_role_name() is not null);
create policy "variants_write" on public.product_variants
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'warehouse_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'warehouse_manager'));

create policy "images_read" on public.product_images
  for select using (current_role_name() is not null);
create policy "images_write" on public.product_images
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

-- inventory ledger is append-only via triggers; allow read for staff, insert only via definer funcs
create policy "ledger_read" on public.inventory_ledger
  for select using (current_role_name() is not null);

create policy "adjustments_write" on public.stock_adjustments
  for all using (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'));

create policy "transfers_write" on public.stock_transfers
  for all using (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'));

create policy "damages_write" on public.damaged_products
  for all using (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'warehouse_manager'));

-- customers / suppliers: everyone logged in can read; manage by admin
create policy "customers_read" on public.customers
  for select using (current_role_name() is not null);
create policy "customers_write" on public.customers
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'salesperson'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'salesperson'));

create policy "cust_ledger_read" on public.customer_ledger
  for select using (current_role_name() is not null);

create policy "suppliers_read" on public.suppliers
  for select using (current_role_name() is not null);
create policy "suppliers_write" on public.suppliers
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "supp_ledger_read" on public.supplier_ledger
  for select using (current_role_name() is not null);

-- sales: cashier + above can insert
create policy "sales_read" on public.sales_orders
  for select using (current_role_name() is not null);
create policy "sales_write" on public.sales_orders
  for insert with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'cashier', 'salesperson'));
create policy "sales_update" on public.sales_orders
  for update using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "sales_items_read" on public.sales_items
  for select using (current_role_name() is not null);
create policy "sales_items_write" on public.sales_items
  for insert with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager', 'cashier', 'salesperson'));

create policy "sales_returns_read" on public.sales_returns
  for select using (current_role_name() is not null);
create policy "sales_returns_write" on public.sales_returns
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

-- purchases
create policy "purchases_read" on public.purchases
  for select using (current_role_name() is not null);
create policy "purchases_write" on public.purchases
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "purchase_items_read" on public.purchase_items
  for select using (current_role_name() is not null);
create policy "purchase_items_write" on public.purchase_items
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "purchase_returns_write" on public.purchase_returns
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

-- accounts
create policy "cash_book_read" on public.cash_book
  for select using (current_role_name() in ('super_admin', 'company_admin', 'accountant', 'branch_manager'));
create policy "cash_book_write" on public.cash_book
  for insert with check (current_role_name() in ('super_admin', 'company_admin', 'accountant', 'branch_manager'));

create policy "bank_read" on public.bank_accounts
  for select using (current_role_name() in ('super_admin', 'company_admin', 'accountant', 'branch_manager'));
create policy "bank_write" on public.bank_accounts
  for all using (current_role_name() in ('super_admin', 'company_admin', 'accountant'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'accountant'));

create policy "expenses_read" on public.expenses
  for select using (current_role_name() in ('super_admin', 'company_admin', 'accountant', 'branch_manager'));
create policy "expenses_write" on public.expenses
  for all using (current_role_name() in ('super_admin', 'company_admin', 'accountant'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'accountant'));

create policy "income_read" on public.income
  for select using (current_role_name() in ('super_admin', 'company_admin', 'accountant', 'branch_manager'));
create policy "income_write" on public.income
  for all using (current_role_name() in ('super_admin', 'company_admin', 'accountant'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'accountant'));

-- ecommerce: public storefront reads via anon; management via staff
create policy "web_products_read" on public.website_products
  for select using (current_role_name() is not null or true);
create policy "web_products_write" on public.website_products
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "web_categories_read" on public.website_categories
  for select using (true);
create policy "web_categories_write" on public.website_categories
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "coupons_read" on public.coupons
  for select using (true);
create policy "coupons_write" on public.coupons
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));

create policy "reviews_read" on public.reviews
  for select using (true);
create policy "reviews_write" on public.reviews
  for insert with check (true);

-- system
create policy "settings_read" on public.settings
  for select using (current_role_name() is not null);
create policy "settings_write" on public.settings
  for all using (current_role_name() in ('super_admin'))
  with check (current_role_name() in ('super_admin'));

create policy "audit_logs_read" on public.audit_logs
  for select using (current_role_name() in ('super_admin', 'company_admin'));

create policy "backup_read" on public.backup_history
  for select using (current_role_name() in ('super_admin'));
create policy "backup_write" on public.backup_history
  for all using (current_role_name() in ('super_admin'))
  with check (current_role_name() in ('super_admin'));

create policy "notifications_read" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_write" on public.notifications
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_read" on public.users
  for select using (current_role_name() is not null);
create policy "users_write" on public.users
  for all using (current_role_name() in ('super_admin', 'company_admin'))
  with check (current_role_name() in ('super_admin', 'company_admin'));

create policy "roles_read" on public.roles
  for select using (current_role_name() is not null);
create policy "roles_write" on public.roles
  for all using (current_role_name() in ('super_admin'))
  with check (current_role_name() in ('super_admin'));

create policy "permissions_read" on public.permissions
  for select using (current_role_name() is not null);
create policy "permissions_write" on public.permissions
  for all using (current_role_name() in ('super_admin'))
  with check (current_role_name() in ('super_admin'));

create policy "activity_logs_read" on public.activity_logs
  for select using (current_role_name() in ('super_admin', 'company_admin'));
