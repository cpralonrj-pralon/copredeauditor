-- Script para verificar o status do usuário N5772610

-- 1. Verificar se existe na tabela profiles
SELECT 'PROFILES' as tabela, id, login, role, created_at
FROM profiles
WHERE login = 'N5772610';

-- 2. Verificar se existe em auth.users
SELECT 'AUTH.USERS' as tabela, id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users
WHERE email = 'n5772610@claro.com.br';

-- 3. Verificar se tem identities
SELECT 'IDENTITIES' as tabela, id, user_id, identity_data, provider
FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'n5772610@claro.com.br');

-- 4. Verificar se tem sessões ativas
SELECT 'SESSIONS' as tabela, id, user_id, created_at, updated_at
FROM auth.sessions
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'n5772610@claro.com.br');

-- ========================================
-- Se quiser DELETAR completamente este usuário, descomente e execute:
-- ========================================

/*
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'n5772610@claro.com.br';
    
    IF v_user_id IS NOT NULL THEN
        -- Deletar tudo relacionado
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        DELETE FROM auth.sessions WHERE user_id = v_user_id;
        DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id;
        DELETE FROM public.profiles WHERE id = v_user_id;
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário N5772610 deletado completamente!';
    ELSE
        RAISE NOTICE 'Usuário N5772610 não encontrado';
    END IF;
END $$;
*/
