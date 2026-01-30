-- 0. Create Table and Policies if they don't exist (Fix for 42P01 error)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  login text not null unique,
  role text not null check (role in ('admin', 'analyst', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Setup Policies (Drop if exists to avoid errors on re-run)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using ( true );

drop policy if exists "Admins can insert profiles" on profiles;
create policy "Admins can insert profiles" on profiles for insert with check ( auth.uid() in (select id from profiles where role = 'admin') );

drop policy if exists "Admins can update profiles" on profiles;
create policy "Admins can update profiles" on profiles for update using ( auth.uid() in (select id from profiles where role = 'admin') );

-- ==========================================
-- USER CREATION LOGIC
-- ==========================================

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 1. Remove user if exists (Clean slate)
delete from auth.users where email = 'n0057998@coprede.auditor';

-- 2. Create the user manually in auth.users with password 'cop123'
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
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'n0057998@coprede.auditor';

  INSERT INTO public.profiles (id, login, role)
  VALUES (new_user_id, 'N0057998', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;
