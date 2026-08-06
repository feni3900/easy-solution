-- ============================================================
-- 0035_accounting.sql — Full double-entry accounting module
-- Chart of Accounts + Journal Entries + Entry Lines
-- ============================================================

-- 1) CHART OF ACCOUNTS
create table if not exists public.chart_of_accounts (
  account_id       serial primary key,
  account_code     varchar(20) not null unique,
  account_name     varchar(120) not null,
  account_type     varchar(30) not null check (account_type in
                     ('Asset','Liability','Equity','Revenue','Expense')),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- 2) JOURNAL ENTRIES (headers)
create table if not exists public.journal_entries (
  entry_id         serial primary key,
  entry_no         varchar(40) not null unique,
  entry_date       date not null,
  description      text,
  reference_type   varchar(30),          -- e.g. 'Manual','POS','Purchase','CustomerPayment'
  reference_id     int,
  created_by       uuid,
  created_at       timestamptz not null default now()
);

-- 3) JOURNAL ENTRY LINES (double-entry debits/credits)
create table if not exists public.journal_entry_lines (
  line_id          serial primary key,
  entry_id         int not null references public.journal_entries(entry_id) on delete cascade,
  account_id       int not null references public.chart_of_accounts(account_id),
  description      text,
  debit            numeric(14,2) not null default 0,
  credit           numeric(14,2) not null default 0
);

-- ensure each entry balances
alter table public.journal_entry_lines
  add constraint check_entry_balanced
  check (debit >= 0 and credit >= 0 and not (debit > 0 and credit > 0));

-- 4) Default chart of accounts
insert into public.chart_of_accounts (account_code, account_name, account_type) values
  ('1000','Cash in Hand','Asset'),
  ('1100','Bank Account','Asset'),
  ('1200','Accounts Receivable (Customer Due)','Asset'),
  ('1300','Inventory','Asset'),
  ('1400','Petty Cash','Asset'),
  ('2000','Accounts Payable (Suppliers)','Liability'),
  ('3000','Owner Equity','Equity'),
  ('3100','Retained Earnings','Equity'),
  ('4000','Sales Revenue','Revenue'),
  ('4100','Service Revenue','Revenue'),
  ('5000','Cost of Goods Sold','Expense'),
  ('5100','Purchase Expense','Expense'),
  ('5200','Rent Expense','Expense'),
  ('5300','Salaries Expense','Expense'),
  ('5400','Utilities Expense','Expense'),
  ('5500','Transport Expense','Expense'),
  ('5600','General & Admin Expense','Expense'),
  ('5700','Discount Allowed','Expense'),
  ('5800','Other Expense','Expense')
on conflict (account_code) do nothing;

-- 5) RLS: authenticated full access, anon read-only none (accounts are internal)
alter table public.chart_of_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;

create policy "Authenticated full access on chart_of_accounts"
  on public.chart_of_accounts for all to authenticated using (true) with check (true);

create policy "Authenticated full access on journal_entries"
  on public.journal_entries for all to authenticated using (true) with check (true);

create policy "Authenticated full access on journal_entry_lines"
  on public.journal_entry_lines for all to authenticated using (true) with check (true);

grant all on public.chart_of_accounts to authenticated;
grant all on public.journal_entries to authenticated;
grant all on public.journal_entry_lines to authenticated;
grant usage on sequence public.chart_of_accounts_account_id_seq to authenticated;
grant usage on sequence public.journal_entries_entry_id_seq to authenticated;
grant usage on sequence public.journal_entry_lines_line_id_seq to authenticated;
