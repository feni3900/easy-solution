-- Smart Solution ERP - 0030_ecommerce_pages_banners.sql
-- Static pages (About, Contact, etc.) and homepage banners for the storefront.

create table if not exists public.ecommerce_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecommerce_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  subtitle text,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.ecommerce_pages (slug, title, body, is_published) values
  ('about', 'About Us', '<p>Tell your story here.</p>', true),
  ('contact', 'Contact Us', '<p>Get in touch.</p>', true),
  ('terms', 'Terms & Conditions', '<p>Terms go here.</p>', true)
on conflict (slug) do nothing;
