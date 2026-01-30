-- SOLUÇÃO CRÍTICA: CITEXT
-- O campo 'email' usa o tipo 'citext'. Se o Auth não conseguir ver esse TIPO, ele falha ao carregar o schema.

-- 1. Garantir que citext existe e está no PUBLIC (onde é visível)
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

-- Tentar mover se estiver em outro lugar
BEGIN;
  ALTER EXTENSION citext SET SCHEMA public;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Citext já deve estar no schema certo ou não pode ser movido.';
END;

-- 2. Dar permissão de USO no TIPO citext (MUITO IMPORTANTE)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TYPE public.citext TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- 3. Teste de Impersonação (Simulando o Admin)
DO $$
BEGIN
  -- Tentar virar o Admin
  SET ROLE supabase_auth_admin;
  
  -- Testar se consegue ver a tabela users (que usa citext)
  PERFORM id FROM auth.users LIMIT 1;
  RAISE NOTICE '✅ TESTE ADMIN: Sucesso ao ler auth.users!';
  
  -- Testar se consegue usar citext explicitamente
  PERFORM 'teste@email.com'::public.citext;
  RAISE NOTICE '✅ TESTE ADMIN: Sucesso ao usar citext!';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ TESTE ADMIN FALHOU: %', SQLERRM;
END $$;
