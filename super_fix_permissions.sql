-- SUPER PERMISSION FIX
-- This script grants extensive permissions to the Auth system to ensure it can read/write everything in Public.

-- 1. Grant Usage on Public Schema
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Grant Tables Access
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. Grant Sequences Access (for ID generation)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Grant Functions Access
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 5. Set Search Path for Auth Admin (Crucial for triggers finding functions)
ALTER ROLE supabase_auth_admin SET search_path TO public, extensions, auth;

-- 6. Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 7. Cleaning up potential zombie triggers again
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
