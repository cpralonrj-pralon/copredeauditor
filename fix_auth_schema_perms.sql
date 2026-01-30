-- ULTIMATE AUTH FIX: Resetar permissões do próprio schema de Auth
-- Às vezes o supabase_auth_admin perde acesso à própria tabela de usuários.

-- 1. Garantir acesso ao Schema Auth
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- 2. Garantir acesso ao Schema Information_Schema (para ler metadados)
GRANT USAGE ON SCHEMA information_schema TO supabase_auth_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO supabase_auth_admin;

-- 3. Garantir acesso do Postgres (Owner) também
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;

-- 4. Garantir que a tabela de profiles (Public) está visível
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
