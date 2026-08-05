-- Smart Solution ERP - 0029_storefront_home_settings.sql
-- Editable storefront homepage content (banner + hero) stored in settings.

insert into public.settings (key, value, group_name) values
  ('home_hero_title', '"Discover Premium Fragrances & Smart Gadgets"', 'ecommerce'),
  ('home_hero_subhead', '"Explore our exclusive collection of oil-based perfumes, spray perfumes, mobile gadgets, speakers, and premium accessories--all in one place."', 'ecommerce'),
  ('home_banner_url', '"/images/home-banner.png"', 'ecommerce')
on conflict (key) do nothing;
