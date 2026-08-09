-- Smart Solution ERP - 0043_guest_user.sql
-- Create a read-only Guest user: can log in and view the dashboard but cannot edit anything.
-- The app enforces read-only via: client guardedFetch (blocks non-GET), isGuest() server checks,
-- and the amber read-only banner. This migration only creates the account.
-- Credentials: guest@maruf.com / guest123  (change the password after first use)
-- NOTE: If a Guest user already exists, this script is a no-op.

-- Create the auth user (email confirmed) if not present
DO $$
DECLARE
  guest_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'guest@maruf.com') THEN
    guest_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      guest_user_id,
      'guest@maruf.com',
      crypt('guest123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}'
    );
  ELSE
    SELECT id INTO guest_user_id FROM auth.users WHERE email = 'guest@maruf.com' LIMIT 1;
  END IF;

  -- Ensure a matching profile exists with the Guest role
  IF guest_user_id IS NOT NULL THEN
    INSERT INTO public.users (user_id, username, full_name, role_id, salesperson_nickname, is_active)
    VALUES (guest_user_id, 'guest', 'Guest User', 4, 'Guest', true)
    ON CONFLICT (user_id) DO UPDATE SET
      role_id = EXCLUDED.role_id,
      is_active = true;
  END IF;
END $$;
