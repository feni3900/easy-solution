-- Smart Solution ERP - 0008_accounts
-- Cash Book, Bank Accounts, Expenses, Income

create table if not exists public.cash_book (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  transaction_type text not null check (transaction_type in ('cash_in', 'cash_out')),
  amount numeric(14,2) not null default 0,
  date timestamptz not null default now(),
  reference_id text,
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  bank_name text not null,
  account_number text,
  balance numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  expense_type text not null,
  amount numeric(14,2) not null default 0,
  date timestamptz not null default now(),
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  income_type text not null,
  amount numeric(14,2) not null default 0,
  date timestamptz not null default now(),
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- expenses / income write to cash book automatically
create or replace function expense_cash_out()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.cash_book (branch_id, transaction_type, amount, date, reference_id, note)
  values (new.branch_id, 'cash_out', new.amount, new.date, new.id::text, 'Expense: ' || new.expense_type);
  return new;
end;
$$;

create or replace function income_cash_in()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.cash_book (branch_id, transaction_type, amount, date, reference_id, note)
  values (new.branch_id, 'cash_in', new.amount, new.date, new.id::text, 'Income: ' || new.income_type);
  return new;
end;
$$;

drop trigger if exists trg_expense_cash on public.expenses;
create trigger trg_expense_cash after insert on public.expenses
  for each row execute function expense_cash_out();
drop trigger if exists trg_income_cash on public.income;
create trigger trg_income_cash after insert on public.income
  for each row execute function income_cash_in();
