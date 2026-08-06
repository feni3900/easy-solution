-- Bulk discount configuration on web_settings
alter table public.web_settings
  add column if not exists bulk_discount_percent numeric(5,2) not null default 20,
  add column if not exists bulk_discount_min_items int not null default 6;

update public.web_settings
  set bulk_discount_percent = 20, bulk_discount_min_items = 6
  where bulk_discount_percent is null or bulk_discount_min_items is null;

-- Bulk discount rate now read from web_settings (single configurable tier).
-- Falls back to 0 (no discount) when not configured.
create or replace function public.bulk_discount_pct(p_quantity numeric)
returns numeric
language plpgsql
stable
as $$
declare
  v_pct numeric;
  v_min int;
begin
  select bulk_discount_percent, bulk_discount_min_items
    into v_pct, v_min
    from public.web_settings
   limit 1;

  if v_pct is null or v_min is null or p_quantity < v_min then
    return 0;
  end if;
  return v_pct;
end;
$$;

grant execute on function public.bulk_discount_pct(numeric) to anon, authenticated;
