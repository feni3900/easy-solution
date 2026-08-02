-- Smart Solution ERP - 0022_backfill_null_branch.sql
-- Any product left without a branch goes to the first active branch (defensive).

update public.products
set branch_id = (select id from public.branches where status = 'active' order by created_at limit 1)
where branch_id is null;
