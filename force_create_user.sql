-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 1. Remove user if exists (Clean slate)
delete from auth.users where email = 'n0057998@coprede.auditor';

-- 2. Create the user manually in auth.users with password 'cop123'
-- We set email_confirmed_at to NOW() so it doesn't ask for verification
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'n0057998@coprede.auditor',
  crypt('cop123', gen_salt('bf')), -- Password: cop123
  now(), -- Auto-confirm
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"login":"N0057998"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Link to public.profiles (Ensure the admin role)
-- We use a DO block to get the ID we just created
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'n0057998@coprede.auditor';

  INSERT INTO public.profiles (id, login, role)
  VALUES (new_user_id, 'N0057998', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;
