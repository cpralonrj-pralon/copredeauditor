-- DIAGNÓSTICO DE PRECISÃO: "Impersonando" o Admin
-- Vamos descobrir EXATAMENTE o que o supabase_auth_admin enxerga (ou não enxerga).

DO $$
DECLARE
    v_count integer;
    v_path text;
    v_citext_schema text;
    v_pgcrypto_schema text;
BEGIN
    -- 1. TROCAR DE IDENTIDADE (Virar o Admin do Auth)
    SET ROLE supabase_auth_admin;
    
    -- 2. VERIFICAR MEU CAMINHO (Search Path)
    SHOW search_path INTO v_path;
    RAISE NOTICE '🔍 Search Path Atual: %', v_path;

    -- 3. LOCALIZAR EXTENSÕES (Onde elas estão?)
    SELECT n.nspname INTO v_citext_schema
    FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'citext';
    
    SELECT n.nspname INTO v_pgcrypto_schema
    FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pgcrypto';
    
    RAISE NOTICE '📍 Extensões: Citext em [%], Pgcrypto em [%]', v_citext_schema, v_pgcrypto_schema;

    -- 4. TENTAR LER USUÁRIOS (Onde costuma falhar)
    -- Se falhar aqui, o problema é leitura básica na tabela ou tipo citext
    BEGIN
        SELECT count(*) INTO v_count FROM auth.users;
        RAISE NOTICE '✅ Leitura auth.users: SUCESSO (% usuários)', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ LEITURA auth.users FALHOU: %', SQLERRM;
    END;

    -- 5. TENTAR USAR PGCRYPTO
    BEGIN
        PERFORM digest('teste', 'sha256'); -- Função básica do pgcrypto
        RAISE NOTICE '✅ Pgcrypto: SUCESSO';
    EXCEPTION WHEN OTHERS THEN
         -- Tentar com schema explícito se tivermos achado
        IF v_pgcrypto_schema IS NOT NULL THEN
             RAISE NOTICE '⚠️ Pgcrypto Direto falhou. Tente chamar %.digest()', v_pgcrypto_schema;
        END IF;
        RAISE NOTICE '❌ PGCRYPTO FALHOU: %', SQLERRM;
    END;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '🔥 ERRO GERAL NO DIAGNÓSTICO: %', SQLERRM;
END $$;
