-- Smart Solution ERP - 0023_image_gallery
-- Image gallery: upload images to storage bucket + track in table

-- 1) public storage bucket for gallery images (public read via getPublicUrl)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

-- storage policies for the gallery bucket
create policy "gallery_objects_select" on storage.objects
  for select using (bucket_id = 'gallery');
create policy "gallery_objects_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery');
create policy "gallery_objects_update" on storage.objects
  for update to authenticated using (bucket_id = 'gallery');
create policy "gallery_objects_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery');

-- 2) gallery index table
create table if not exists public.image_gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  file_name text,
  mime_type text,
  size bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_image_gallery_created on public.image_gallery(created_at desc);

alter table public.image_gallery enable row level security;

create policy "gallery_read" on public.image_gallery
  for select using (current_role_name() is not null);
create policy "gallery_write" on public.image_gallery
  for all using (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'))
  with check (current_role_name() in ('super_admin', 'company_admin', 'branch_manager'));
