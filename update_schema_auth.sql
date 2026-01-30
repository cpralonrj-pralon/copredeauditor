-- Create a table for public profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  login text not null unique,
  role text not null check (role in ('admin', 'analyst', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
-- Public read access to profiles (needed to fetch role on login)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Only admins can insert/update profiles (conceptually, though initially we might need open access for setup or trigger)
create policy "Admins can insert profiles"
  on profiles for insert
  with check ( auth.uid() in (select id from profiles where role = 'admin') );

create policy "Admins can update profiles"
  on profiles for update
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- Function to handle new user creation (optional, if we successfully map via trigger)
-- For now, we will rely on manual insertion or app-side logic for the first user.

-- Trigger to create profile? 
-- Since we want specific roles, maybe we don't auto-create with default 'user'.
-- We will handle profile creation explicitly in the Admin page.

-- TRIGGER (Optional - auto create basic profile if missing)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, login, role)
  values (new.id, split_part(new.email, '@', 1), 'analyst'); -- Default to analyst
  return new;
end;
$$ language plpgsql security definer;

-- Trigger disabled for now because we want to control role creation.
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();
