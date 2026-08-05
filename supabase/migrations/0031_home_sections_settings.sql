-- Smart Solution ERP - 0031_home_sections_settings.sql
-- Editable feature cards, section titles, and CTA for the storefront homepage.

insert into public.settings (key, value, group_name) values
  ('home_feature_1_title', '"Cash on Delivery"', 'ecommerce'),
  ('home_feature_1_desc', '"Pay when it arrives"', 'ecommerce'),
  ('home_feature_2_title', '"Bulk Discounts"', 'ecommerce'),
  ('home_feature_2_desc', '"Save up to 15% on 6+"', 'ecommerce'),
  ('home_feature_3_title', '"Live Stock"', 'ecommerce'),
  ('home_feature_3_desc', '"Synced from the ERP"', 'ecommerce'),
  ('home_popular_title', '"Popular"', 'ecommerce'),
  ('home_bestsellers_title', '"Best Sellers"', 'ecommerce'),
  ('home_comingsoon_title', '"Coming Soon"', 'ecommerce'),
  ('home_catalog_heading', '"Browse the full catalog"', 'ecommerce'),
  ('home_catalog_subhead', '"Every product in our ERP catalog is available to order with cash on delivery."', 'ecommerce'),
  ('home_address_line1', '"123 Business Avenue"', 'ecommerce'),
  ('home_address_line2', '"Suite 100, Dhaka 1212"', 'ecommerce'),
  ('home_address_city', '"Dhaka"', 'ecommerce'),
  ('home_address_country', '"Bangladesh"', 'ecommerce'),
  ('home_phone', '"+880 1234-567890"', 'ecommerce'),
  ('home_email', '"info@smartsolution.com"', 'ecommerce'),
  ('home_map_embed_url', '""', 'ecommerce'),
  ('home_map_title', '"Find Us on the Map"', 'ecommerce')
on conflict (key) do nothing;
