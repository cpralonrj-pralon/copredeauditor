-- SAFE FIX V2 (Sem alterar Role)

-- 1. Garantir que o schema 'extensions' existe e é acessível
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 2. Garantir que a extensão pgcrypto está no lugar certo
-- Se ela já estiver no 'public', vamos mover (ou garantir que existe no extensions)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO supabase_auth_admin;

-- 3. Liberar o schema Public para o Auth Admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin;

-- 4. Limpeza final de qualquer gatilho (Trigger) que esteja quebrado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
