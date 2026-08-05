-- Smart Solution ERP - 0033_users_company_id.sql
-- Add company_id to users table for multi-tenant data isolation.

-- Add the column (nullable first for backfill)
alter table public.users add column if not exists company_id uuid references public.companies(id) on delete set null;

-- Backfill from branch -> company relationship
update public.users u
set company_id = b.company_id
from public.branches b
where u.branch_id = b.id
  and u.company_id is null;

-- Create index for fast lookups
create index if not exists idx_users_company on public.users(company_id);

-- RLS: company-level read isolation
-- Users can only see other users in the same company
create policy "users_company_isolation" on public.users
  for select using (
    company_id = (
      select company_id from public.users where id = auth.uid()
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Products: company-level read isolation
create policy "products_company_isolation" on public.products
  for select using (
    exists (
      select 1 from public.branches
      where branches.id = products.branch_id
        and branches.company_id = (
          select company_id from public.users where id = auth.uid()
        )
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Branches: company-level read isolation
create policy "branches_company_isolation" on public.branches
  for select using (
    company_id = (
      select company_id from public.users where id = auth.uid()
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Sales orders: company isolation through branch
create policy "sales_orders_company_isolation" on public.sales_orders
  for select using (
    exists (
      select 1 from public.branches
      where branches.id = sales_orders.branch_id
        and branches.company_id = (
          select company_id from public.users where id = auth.uid()
        )
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Customers: company isolation through branch
create policy "customers_company_isolation" on public.customers
  for select using (
    branch_id is null
    or exists (
      select 1 from public.branches
      where branches.id = customers.branch_id
        and branches.company_id = (
          select company_id from public.users where id = auth.uid()
        )
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Purchases: company isolation through branch
create policy "purchases_company_isolation" on public.purchases
  for select using (
    branch_id is null
    or exists (
      select 1 from public.branches
      where branches.id = purchases.branch_id
        and branches.company_id = (
          select company_id from public.users where id = auth.uid()
        )
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Cash book: company isolation through branch
create policy "cash_book_company_isolation" on public.cash_book
  for select using (
    branch_id is null
    or exists (
      select 1 from public.branches
      where branches.id = cash_book.branch_id
        and branches.company_id = (
          select company_id from public.users where id = auth.uid()
        )
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );

-- Settings: company isolation
create policy "settings_company_isolation" on public.settings
  for select using (
    company_id is null
    or company_id = (
      select company_id from public.users where id = auth.uid()
    )
    or exists (
      select 1 from public.users where id = auth.uid() and role_id in (
        select id from public.roles where name = 'super_admin'
      )
    )
  );
