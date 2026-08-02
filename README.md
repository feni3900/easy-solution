# Smart Solution ERP

A full-featured, multi-company / multi-branch ERP + ecommerce platform.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** Tailwind CSS v4, shadcn/ui (Base UI adapter), Recharts, TanStack Table
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Hosting:** Vercel + Supabase

## Project Layout

```
src/
  app/
    (dashboard)/            # All ERP admin modules (sidebar-protected)
      accounts/             # Cash book, bank accounts, expenses, income
      customers/            # Customers + groups
      ecommerce/            # Storefront admin (products, coupons, reviews)
      inventory/            # Ledger, adjustments, transfers, damages
      organization/         # Companies, branches, units, warehouses
      products/             # Products + categories/brands/units/variants
      purchases/            # Purchases + returns
      reports/              # Sales, purchases, inventory, P&L
      sales/                # POS, orders, returns
      suppliers/            # Suppliers + groups
      users/                # Users, roles, activity log
      dashboard/            # KPI dashboard
      notifications/        # In-app notifications
      search/               # Global search
      settings/             # App settings
    store/                  # Public ecommerce storefront
      product/[id]/         # Product detail
      search/               # Store search
      cart/                 # Cart (localStorage)
    login/                  # Login page
  components/
    crud-manager.tsx        # Generic list + create/edit/delete manager
    data-table.tsx          # Generic TanStack data table
    layout/                 # Sidebar + header
  lib/
    supabase/client.ts      # Browser Supabase client
    supabase/server.ts      # Server Supabase client (cookies)
    auth.ts                 # Session + role helpers
    constants.ts            # Roles, currencies, nav items
src/proxy.ts                # Next.js 16 auth middleware
supabase/migrations/        # Database schema (run in order)
```

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in Supabase Dashboard → Project Settings → API.

### 3. Apply the database schema

Open Supabase Dashboard → SQL Editor and run each file in `supabase/migrations/` **in numeric order** (0001 through 0012):

| File | Purpose |
| ---- | ------- |
| 0001_extensions.sql | `uuid-ossp`, `pgcrypto`, `updated_at` trigger helper |
| 0002_organization.sql | companies, branches, business_units, warehouses |
| 0003_user_management.sql | roles, permissions, users, activity_logs (+ 7 default roles) |
| 0004_products.sql | units, categories, brands, products, variants, images |
| 0005_inventory.sql | inventory_ledger, adjustments, transfers, damages + stock functions/triggers |
| 0006_customers_suppliers.sql | customers/suppliers + ledgers + due-sync triggers |
| 0007_sales_purchases.sql | sales orders/items/returns, purchases, auto stock + ledger triggers |
| 0008_accounts.sql | cash_book, bank_accounts, expenses, income |
| 0009_ecommerce.sql | website_products, website_categories, coupons, reviews |
| 0010_system.sql | settings, audit_logs, notifications, invoice/purchase number functions |
| 0011_rls_policies.sql | Row-Level Security for all tables |
| 0012_seed.sql | Demo companies (Maruf Enterprise/BDT, Maa Electronics/EUR) + sample data |

> The seed inserts two demo companies so you can log in and explore immediately. You can delete `0012_seed.sql` before running if you want a clean start.

### 4. Create your first user

1. Sign up via the app's login page (or create a user in Supabase Dashboard → Authentication → Users).
2. In Supabase SQL Editor, link that auth user to the `users` table:

```sql
-- Replace 'AUTH_USER_ID' with the user's UUID from Supabase Auth
insert into users (id, company_id, branch_id, role_id, full_name, email)
select
  'AUTH_USER_ID',
  c.id,
  b.id,
  r.id,
  'Admin',
  'you@example.com'
from companies c
cross join branches b
cross join roles r
where r.name = 'Super Admin'
limit 1;
```

### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000. `/login` to sign in, `/store` for the public storefront.

## Roles (from spec)

| Role | Permissions |
| ---- | ----------- |
| Super Admin | Full access, unlimited discounts |
| Admin | Everything except company management |
| Manager | Manage inventory, view reports |
| Branch Manager | Own-branch operations, 5–10% discount |
| Cashier | POS + sales, 0% discount |
| Accountant | Accounts + reports |
| Storefront Manager | Ecommerce + storefront admin |

## Business rules enforced in the DB

- Every product requires barcode/SKU, category, price and stock.
- Sales/purchases automatically update inventory ledger and stock.
- Credit sales are tracked via `customer_ledger` (due balance syncs automatically).
- Cash-in/out posts to `cash_book` automatically.
- Discounts are capped by role (cashier 0%, branch manager ≤10%, admin ≤5%, super admin unlimited; 20% bulk discount for 6+ items).
- Low-stock notifications are generated automatically.
- Multi-currency support (BDT/EUR) via per-company settings.

## Deployment (Vercel)

1. Push the project to GitHub.
2. In Vercel, **Import Project** → select the repo → Framework: Next.js.
3. Add the two environment variables from `.env.example`.
4. Deploy. The `src/proxy.ts` middleware handles auth redirects automatically.
