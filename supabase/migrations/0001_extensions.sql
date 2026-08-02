-- Smart Solution ERP - Extensions & base helpers
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- common trigger: updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function trigger_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
