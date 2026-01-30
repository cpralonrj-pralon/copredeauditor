-- ULTIMATE PERMISSION FIX
-- Targeted at the "extensions" schema and search_path

-- 1. Ensure Auth Admin can access the Extensions schema (where pgcrypto usually lives)
GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO supabase_auth_admin;

-- 2. Ensure Auth Admin can access Public schema
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;

-- 3. Set the Search Path explicitly so Auth knows where to look for pgcrypto
-- This is often the cause of "Database error" during login (cannot find crypt())
ALTER ROLE supabase_auth_admin SET search_path TO public, extensions, auth;

-- 4. Re-verify pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 5. One last sweep for zombie triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
