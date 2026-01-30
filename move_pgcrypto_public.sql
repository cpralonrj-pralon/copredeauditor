-- SOLUÇÃO DE VISIBILIDADE (Mover pgcrypto para public)
-- Se não podemos ensinar o caminho para o robô (search_path), movemos as ferramentas para onde ele já olha (public).

-- 1. Mover extensão para public
-- Se der erro dizendo que já está, tudo bem.
BEGIN;
  ALTER EXTENSION pgcrypto SET SCHEMA public;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível mover a extensão (pode já estar no public ou permissão negada): %', SQLERRM;
END;

-- 2. Garantir permissões nas funções do Public
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Teste de Fogo
-- Se isso rodar sem erro e gerar um hash, o banco está pronto.
SELECT crypt('teste123', gen_salt('bf')) as hash_teste;
