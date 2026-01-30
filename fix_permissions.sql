-- 1. FIX PERMISSIONS (Crucial for "Database error querying schema")
-- GoTrue (Supabase Auth) needs access to public schema if any trigger exists
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.profiles TO postgres;

-- 2. REMOVE BAD TRIGGERS
-- Sometimes old triggers stay behind and break the Auth flow
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. ENSURE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 4. JUST TO BE SURE - RESET USER AGAIN (Run this part only if user isn't there, but it's safe to run)
-- Note: We are NOT deleting this time, just ensuring permissions above.
-- If you need to recreate, use the previous script 'fix_user_safely.sql' AFTER this one.
