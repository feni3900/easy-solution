-- Smart Solution ERP - 0034_seed_admin_users.sql
-- Create default admin users for each company.
-- IMPORTANT: After running this, you MUST set passwords via Supabase Dashboard:
-- Authentication > Users > Find the user > Reset Password

-- First, ensure company_id is set on all users based on their branch
UPDATE public.users u
SET company_id = b.company_id
FROM public.branches b
WHERE u.branch_id = b.id
  AND u.company_id IS NULL;

-- Get company IDs
DO $$
DECLARE
  maruf_company_id uuid;
  maa_company_id uuid;
  dhaka_branch_id uuid;
  athens_branch_id uuid;
  admin_role_id uuid;
  maruf_user_id uuid;
  maa_user_id uuid;
BEGIN
  -- Find companies
  SELECT id INTO maruf_company_id FROM companies WHERE name ILIKE '%maruf%' LIMIT 1;
  SELECT id INTO maa_company_id FROM companies WHERE name ILIKE '%maa%' LIMIT 1;
  
  -- If companies don't exist, use the first two
  IF maruf_company_id IS NULL THEN
    SELECT id INTO maruf_company_id FROM companies ORDER BY created_at LIMIT 1;
  END IF;
  IF maa_company_id IS NULL THEN
    SELECT id INTO maa_company_id FROM companies WHERE id != maruf_company_id ORDER BY created_at LIMIT 1;
  END IF;

  -- Find branches
  SELECT id INTO dhaka_branch_id FROM branches WHERE company_id = maruf_company_id AND country = 'Bangladesh' LIMIT 1;
  SELECT id INTO athens_branch_id FROM branches WHERE company_id = maa_company_id AND country = 'Greece' LIMIT 1;
  
  -- If branches don't exist, use first branch per company
  IF dhaka_branch_id IS NULL THEN
    SELECT id INTO dhaka_branch_id FROM branches WHERE company_id = maruf_company_id LIMIT 1;
  END IF;
  IF athens_branch_id IS NULL THEN
    SELECT id INTO athens_branch_id FROM branches WHERE company_id = maa_company_id LIMIT 1;
  END IF;

  -- Get admin role
  SELECT id INTO admin_role_id FROM roles WHERE name = 'company_admin' LIMIT 1;
  IF admin_role_id IS NULL THEN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  END IF;

  -- Create Maruf Enterprise admin (if not exists)
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@maruf.com') THEN
    maruf_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      maruf_user_id,
      'admin@maruf.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}'
    );
    INSERT INTO public.users (id, full_name, email, role_id, branch_id, company_id, status)
    VALUES (maruf_user_id, 'Maruf Admin', 'admin@maruf.com', admin_role_id, dhaka_branch_id, maruf_company_id, 'active');
    RAISE NOTICE 'Created Maruf admin user: admin@maruf.com';
  ELSE
    RAISE NOTICE 'Maruf admin user already exists: admin@maruf.com';
  END IF;

  -- Create Maa Electronics admin (if not exists)
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@maaelectronics.com') THEN
    maa_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      maa_user_id,
      'admin@maaelectronics.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}'
    );
    INSERT INTO public.users (id, full_name, email, role_id, branch_id, company_id, status)
    VALUES (maa_user_id, 'Maa Electronics Admin', 'admin@maaelectronics.com', admin_role_id, athens_branch_id, maa_company_id, 'active');
    RAISE NOTICE 'Created Maa Electronics admin user: admin@maaelectronics.com';
  ELSE
    RAISE NOTICE 'Maa Electronics admin user already exists: admin@maaelectronics.com';
  END IF;

END $$;
