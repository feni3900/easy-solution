-- Smart Solution ERP - 0015_user_name_split
-- Split user names into first_name + last_name. Keep full_name as combined for
-- backward compatibility with existing reads.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text;

-- backfill from full_name (last token = last name)
update public.users
set first_name = split_part(trim(full_name), ' ', 1),
    last_name = substring(trim(full_name) from length(split_part(trim(full_name), ' ', 1)) + 2)
where full_name is not null and full_name <> '';

update public.users
set last_name = first_name
where (last_name is null or last_name = '') and first_name is not null and first_name <> '';
