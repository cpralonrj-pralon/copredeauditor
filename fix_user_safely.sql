-- 1. FIX TABLE (Just in case)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  login text not null unique,
  role text not null check (role in ('admin', 'analyst', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ENABLE RLS
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using ( true );
drop policy if exists "Admins can insert profiles" on profiles;
create policy "Admins can insert profiles" on profiles for insert with check ( auth.uid() in (select id from profiles where role = 'admin') );
drop policy if exists "Admins can update profiles" on profiles;
create policy "Admins can update profiles" on profiles for update using ( auth.uid() in (select id from profiles where role = 'admin') );

-- 3. SANITIZE USER (Clean Slate with strictly valid data)
create extension if not exists pgcrypto;

-- Delete potential corrupt user
delete from auth.users where email = 'n0057998@coprede.auditor';

-- Insert with NULLs for tokens (Prevent 500 errors)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
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
  'authenticated', -- aud
  'authenticated', -- role
  'n0057998@coprede.auditor',
  crypt('cop123', gen_salt('bf')),
  now(), -- confirmed
  '{"provider":"email","providers":["email"]}',
  '{"login":"N0057998"}',
  now(),
  now(),
  NULL, -- Important: Use NULL, not empty string
  NULL,
  NULL,
  NULL
);

-- 4. RE-LINK PROFILE
INSERT INTO public.profiles (id, login, role)
SELECT id, 'N0057998', 'admin' FROM auth.users WHERE email = 'n0057998@coprede.auditor'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
