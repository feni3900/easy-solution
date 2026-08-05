-- Smart Solution ERP - 0032_contact_page_settings.sql
-- Editable settings for the storefront Contact Us page.

insert into public.settings (key, value, group_name) values
  ('contact_heading', '"Contact Us"', 'ecommerce'),
  ('contact_subhead', '"Have a question about an order or a product? Get in touch — our team usually replies within one business day."', 'ecommerce'),
  -- Address 1
  ('contact_addr1_label', '"Head Office"', 'ecommerce'),
  ('contact_addr1_street', '"123 Business Avenue"', 'ecommerce'),
  ('contact_addr1_street2', '"Suite 100"', 'ecommerce'),
  ('contact_addr1_city', '"Dhaka"', 'ecommerce'),
  ('contact_addr1_state', '"Dhaka Division"', 'ecommerce'),
  ('contact_addr1_postal', '"1212"', 'ecommerce'),
  ('contact_addr1_country', '"Bangladesh"', 'ecommerce'),
  -- Address 2
  ('contact_addr2_label', '"Branch Office"', 'ecommerce'),
  ('contact_addr2_street', '"456 Commerce Street"', 'ecommerce'),
  ('contact_addr2_street2', '"Floor 2"', 'ecommerce'),
  ('contact_addr2_city', '"Athens"', 'ecommerce'),
  ('contact_addr2_state', '"Attica"', 'ecommerce'),
  ('contact_addr2_postal', '"10431"', 'ecommerce'),
  ('contact_addr2_country', '"Greece"', 'ecommerce'),
  -- Phone
  ('contact_phone_1', '"+880 1712 345 678"', 'ecommerce'),
  ('contact_phone_2', '"+30 210 000 0000"', 'ecommerce'),
  -- Email
  ('contact_email_1', '"info@maruf.com"', 'ecommerce'),
  ('contact_email_2', '"info@maaelectronics.gr"', 'ecommerce'),
  -- Hours
  ('contact_hours_1', '"Sun–Thu: 9am–6pm"', 'ecommerce'),
  ('contact_hours_2', '"Fri–Sat: 10am–4pm"', 'ecommerce'),
  -- Contract Information
  ('contact_contract_heading', '"Company Information"', 'ecommerce'),
  ('contact_company_name', '"Maruf Enterprise Ltd."', 'ecommerce'),
  ('contact_trade_license', '"Trade License: TRAD/DNCC/045678/2024"', 'ecommerce'),
  ('contact_bin', '"BIN: 00123456789012"', 'ecommerce'),
  ('contact_tin', '"TIN: 123456789012"', 'ecommerce'),
  ('contact_vat_reg', '"VAT Registration: 1234-5678-9012"', 'ecommerce'),
  ('contact_reg_no', '"Company Reg: RJSC/BANA/12345/2024"', 'ecommerce'),
  -- Message CTA
  ('contact_form_heading', '"Send us a message"', 'ecommerce'),
  ('contact_form_subtext', '"Please include your order or invoice number if your message is about an existing order."', 'ecommerce'),
  ('contact_cta_email', '"info@maruf.com"', 'ecommerce'),
  -- Map
  ('contact_map_embed_url', '""', 'ecommerce')
on conflict (key) do nothing;
