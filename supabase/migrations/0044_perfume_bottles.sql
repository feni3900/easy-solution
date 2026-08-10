-- Smart Solution ERP - 0044_perfume_bottles.sql
-- Maruf Perfume: add bottle/packaging stock so each produced unit consumes one bottle.
-- Adds a perfume_bottles table (name, unit, stock_qty, cost_per_unit, low_stock_threshold)
-- and redefines produce_perfume_batch() to deduct one bottle per produced unit.

-- helper trigger (self-contained)
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
-- Bottles (packaging / containers)
-- ---------------------------------------------------------------------------
create table if not exists public.perfume_bottles (
  id bigint generated always as identity primary key,
  name text not null,
  unit text not null default 'pc',
  stock_qty numeric not null default 0,
  cost_per_unit numeric not null default 0,
  low_stock_threshold numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger perfume_bottles_updated_at
  before update on public.perfume_bottles
  for each row execute function trigger_updated_at();

-- Track which bottle type a batch used
alter table public.perfume_batches
  add column if not exists bottle_id bigint references public.perfume_bottles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfume_bottles enable row level security;

create policy "perfume_bottles_read" on public.perfume_bottles
  for select to authenticated using (true);
create policy "perfume_bottles_write" on public.perfume_bottles
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Produce batch (now consumes one bottle per produced unit)
-- ---------------------------------------------------------------------------
create or replace function public.produce_perfume_batch(
  p_recipe_id bigint,
  p_bottles numeric,
  p_bottle_id bigint,
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
  v_bottle_cost numeric := 0;
begin
  if p_bottles is null or p_bottles <= 0 then
    raise exception 'Bottles must be greater than 0';
  end if;

  if not exists (select 1 from perfume_recipes where id = p_recipe_id) then
    raise exception 'Recipe not found';
  end if;

  -- bottle availability + cost
  if p_bottle_id is not null then
    select cost_per_unit into v_bottle_cost
    from perfume_bottles where id = p_bottle_id;

    if v_bottle_cost is null then
      raise exception 'Bottle not found';
    end if;

    if p_bottles > (select stock_qty from perfume_bottles where id = p_bottle_id) then
      raise exception 'Insufficient bottle stock (need %, have %)',
        p_bottles, (select stock_qty from perfume_bottles where id = p_bottle_id);
    end if;
  end if;

  -- check availability of every ingredient, compute cost
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

  -- deduct ingredients, accumulate ingredient cost
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

  -- deduct bottles (one per produced unit) and add bottle cost
  if p_bottle_id is not null then
    update perfume_bottles
    set stock_qty = stock_qty - p_bottles
    where id = p_bottle_id;

    v_total_cost := v_total_cost + (v_bottle_cost * p_bottles);
  end if;

  v_batch_no := 'BATCH-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
  insert into perfume_batches (recipe_id, batch_no, bottles, ingredient_cost, bottle_id, notes, created_by)
  values (p_recipe_id, v_batch_no, p_bottles, round(v_total_cost, 2), p_bottle_id, p_notes, auth.uid());

  insert into perfume_stock (recipe_id, stock_qty)
  values (p_recipe_id, p_bottles)
  on conflict (recipe_id)
  do update set stock_qty = perfume_stock.stock_qty + excluded.stock_qty,
                updated_at = now();

  return v_batch_no;
end;
$$;

grant execute on function public.produce_perfume_batch(bigint, numeric, bigint, text) to authenticated;

-- table-level grants (needed in addition to RLS)
grant select, insert, update, delete on public.perfume_bottles to authenticated;
