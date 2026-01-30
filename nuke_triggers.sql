-- 1. NUCLEAR OPTION FOR TRIGGERS
-- Using CASCADE to destroy any trigger linked to this function automatically
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Clean up any other potential triggers by name (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS check_user_role ON public.profiles;

-- 3. RE-GRANT PERMISSIONS (Redundant but safe)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;

-- 4. FORCE PASSWORD UPDATE (Just to be sure crypto is valid)
UPDATE auth.users 
SET encrypted_password = crypt('cop123', gen_salt('bf')) 
WHERE email = 'n0057998@coprede.auditor';
