-- SAFE NUCLEAR CLEANUP (No reserved role modification)

-- 1. VARRER E DELETAR GATILHOS (Isso é permitido e resolve o problema)
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
        RAISE NOTICE 'Trigger removido: %', trg.trigger_name;
    END LOOP;
END $$;

-- 2. Limpar a função problemática (causa raiz comum)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. PERMISSÕES DE TABELA (Permitido e Funcional)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;

-- 4. Re-criptografar senha (para garantir)
UPDATE auth.users 
SET encrypted_password = crypt('cop123', gen_salt('bf')) 
WHERE email = 'n0057998@coprede.auditor';
