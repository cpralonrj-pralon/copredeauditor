-- Script para deletar usuário completamente
-- Compatível com todas as versões do Supabase

DO $$
DECLARE
    v_user_id uuid;
    v_login text := 'N5772610'; -- ← MUDE AQUI o login do usuário a deletar
    v_email text;
BEGIN
    v_email := lower(v_login) || '@claro.com.br';
    
    -- Buscar ID do usuário
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário % não encontrado', v_login;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deletando usuário %: %', v_login, v_user_id;
    
    -- Deletar na ordem correta
    BEGIN
        -- 1. Identities
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        RAISE NOTICE 'Identities deletadas';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao deletar identities: %', SQLERRM;
    END;
    
    BEGIN
        -- 2. Sessions
        DELETE FROM auth.sessions WHERE user_id = v_user_id;
        RAISE NOTICE 'Sessions deletadas';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao deletar sessions: %', SQLERRM;
    END;
    
    BEGIN
        -- 3. Refresh Tokens (usa WHERE user_id, não token)
        DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id::text;
        RAISE NOTICE 'Refresh tokens deletados';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao deletar refresh tokens: %', SQLERRM;
    END;
    
    BEGIN
        -- 4. Profile (public.profiles)
        DELETE FROM public.profiles WHERE id = v_user_id;
        RAISE NOTICE 'Profile deletado';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao deletar profile: %', SQLERRM;
    END;
    
    BEGIN
        -- 5. Usuário por último
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE 'Usuário deletado';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao deletar usuário: %', SQLERRM;
    END;
    
    RAISE NOTICE '✅ Usuário % deletado completamente!', v_login;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro geral: %', SQLERRM;
END $$;
