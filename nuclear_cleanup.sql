-- NUCLEAR CLEANUP: Dynamic Trigger Removal
-- This script finds ALL triggers on auth.users and deletes them one by one.

DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || trg.trigger_name || '" ON auth.users CASCADE';
        RAISE NOTICE 'Deleted trigger: %', trg.trigger_name;
    END LOOP;
END $$;

-- Drop the function too (safe to do)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Re-apply Perms (Just in case)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
ALTER ROLE supabase_auth_admin SET search_path TO public, extensions, auth;

-- Verify user password again
UPDATE auth.users 
SET encrypted_password = crypt('cop123', gen_salt('bf')) 
WHERE email = 'n0057998@coprede.auditor';
