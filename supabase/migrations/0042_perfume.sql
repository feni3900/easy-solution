-- Smart Solution ERP - 0042_perfume
-- Maruf Perfume: password-locked perfume manufacturing section.
-- Uses the SAME database; access is gated by a section password stored in perfume_settings.

-- helper trigger (self-contained so this migration runs on any project)
create or replace function public.trigger_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Settings (section password)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Default section password is "maruf2026" (sha256). Change it from /perfume/settings.
insert into public.perfume_settings (key, value)
values ('section_password_hash', 'e6fb93b512ea8929c2b0db00de5cc53010cfa976436c3802c3aeb631670dfb92')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Ingredients (raw materials)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_ingredients (
  id bigint generated always as identity primary key,
  name text not null,
  unit text not null default 'ml',
  stock_qty numeric not null default 0,
  cost_per_unit numeric not null default 0,
  low_stock_threshold numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger perfume_ingredients_updated_at
  before update on public.perfume_ingredients
  for each row execute function trigger_updated_at();

-- ---------------------------------------------------------------------------
-- Recipes (BOM header)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_recipes (
  id bigint generated always as identity primary key,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger perfume_recipes_updated_at
  before update on public.perfume_recipes
  for each row execute function trigger_updated_at();

-- ---------------------------------------------------------------------------
-- Recipe items (BOM lines: ingredient per bottle)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_recipe_items (
  id bigint generated always as identity primary key,
  recipe_id bigint not null references public.perfume_recipes(id) on delete cascade,
  ingredient_id bigint not null references public.perfume_ingredients(id) on delete cascade,
  qty_per_bottle numeric not null default 0,
  unit text not null default 'ml',
  unique (recipe_id, ingredient_id)
);

-- ---------------------------------------------------------------------------
-- Batches (production runs)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_batches (
  id bigint generated always as identity primary key,
  recipe_id bigint not null references public.perfume_recipes(id),
  batch_no text not null unique,
  bottles numeric not null default 0,
  ingredient_cost numeric not null default 0,
  notes text,
  produced_at timestamptz not null default now(),
  created_by uuid
);

-- ---------------------------------------------------------------------------
-- Finished perfume stock
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_stock (
  id bigint generated always as identity primary key,
  recipe_id bigint not null unique references public.perfume_recipes(id),
  stock_qty numeric not null default 0,
  price numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfume_settings enable row level security;
alter table public.perfume_ingredients enable row level security;
alter table public.perfume_recipes enable row level security;
alter table public.perfume_recipe_items enable row level security;
alter table public.perfume_batches enable row level security;
alter table public.perfume_stock enable row level security;

-- Self-contained RLS: only signed-in ERP users can read/write perfume data.
-- (Uses the standard `authenticated` role instead of app-specific role helpers.)
create policy "perfume_settings_read" on public.perfume_settings
  for select to authenticated using (true);
create policy "perfume_settings_write" on public.perfume_settings
  for all to authenticated using (true) with check (true);

create policy "perfume_ingredients_read" on public.perfume_ingredients
  for select to authenticated using (true);
create policy "perfume_ingredients_write" on public.perfume_ingredients
  for all to authenticated using (true) with check (true);

create policy "perfume_recipes_read" on public.perfume_recipes
  for select to authenticated using (true);
create policy "perfume_recipes_write" on public.perfume_recipes
  for all to authenticated using (true) with check (true);

create policy "perfume_recipe_items_read" on public.perfume_recipe_items
  for select to authenticated using (true);
create policy "perfume_recipe_items_write" on public.perfume_recipe_items
  for all to authenticated using (true) with check (true);

create policy "perfume_batches_read" on public.perfume_batches
  for select to authenticated using (true);
create policy "perfume_batches_write" on public.perfume_batches
  for all to authenticated using (true) with check (true);

create policy "perfume_stock_read" on public.perfume_stock
  for select to authenticated using (true);
create policy "perfume_stock_write" on public.perfume_stock
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Produce batch (atomic: check stock, deduct ingredients, create batch, add stock)
-- ---------------------------------------------------------------------------
create or replace function public.produce_perfume_batch(
  p_recipe_id bigint,
  p_bottles numeric,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_no text;
  v_total_cost numeric := 0;
  v_item record;
begin
  if p_bottles is null or p_bottles <= 0 then
    raise exception 'Bottles must be greater than 0';
  end if;

  if not exists (select 1 from perfume_recipes where id = p_recipe_id) then
    raise exception 'Recipe not found';
  end if;

  -- check availability of every ingredient, compute cost, deduct stock
  for v_item in
    select ri.ingredient_id, ri.qty_per_bottle, i.stock_qty, i.cost_per_unit
    from perfume_recipe_items ri
    join perfume_ingredients i on i.id = ri.ingredient_id
    where ri.recipe_id = p_recipe_id
  loop
    if v_item.qty_per_bottle * p_bottles > v_item.stock_qty then
      raise exception 'Insufficient ingredient stock for ingredient id % (need %, have %)',
        v_item.ingredient_id, v_item.qty_per_bottle * p_bottles, v_item.stock_qty;
    end if;
  end loop;

  for v_item in
    select ri.ingredient_id, ri.qty_per_bottle, i.stock_qty, i.cost_per_unit
    from perfume_recipe_items ri
    join perfume_ingredients i on i.id = ri.ingredient_id
    where ri.recipe_id = p_recipe_id
  loop
    update perfume_ingredients
    set stock_qty = stock_qty - (v_item.qty_per_bottle * p_bottles)
    where id = v_item.ingredient_id;

    v_total_cost := v_total_cost + (v_item.qty_per_bottle * v_item.cost_per_unit * p_bottles);
  end loop;

  v_batch_no := 'BATCH-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
  insert into perfume_batches (recipe_id, batch_no, bottles, ingredient_cost, notes, created_by)
  values (p_recipe_id, v_batch_no, p_bottles, round(v_total_cost, 2), p_notes, auth.uid());

  insert into perfume_stock (recipe_id, stock_qty)
  values (p_recipe_id, p_bottles)
  on conflict (recipe_id)
  do update set stock_qty = perfume_stock.stock_qty + excluded.stock_qty,
                updated_at = now();

  return v_batch_no;
end;
$$;

grant execute on function public.produce_perfume_batch(bigint, numeric, text) to authenticated;
