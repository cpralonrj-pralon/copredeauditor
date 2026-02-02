-- ⚠️⚠️⚠️ SCRIPT COMPLETO PARA ZERAR O BANCO ⚠️⚠️⚠️
-- ATENÇÃO: Este script vai deletar MUITA coisa!

-- ========================================
-- OPÇÃO 1: Limpar APENAS incidentes (RECOMENDADO)
-- ========================================
TRUNCATE TABLE assertividade_incidentes RESTART IDENTITY CASCADE;

-- ========================================
-- OPÇÃO 2: Limpar incidentes E usuários (CUIDADO!)
-- ========================================
-- Descomente as linhas abaixo para executar:

/*
-- Limpar incidentes
TRUNCATE TABLE assertividade_incidentes RESTART IDENTITY CASCADE;

-- Deletar todos os usuários (EXCETO o atual)
DO $$
DECLARE
    v_current_user_id uuid;
BEGIN
    -- Pegar ID do usuário atual (você)
    v_current_user_id := auth.uid();
    
    -- Deletar todos os outros usuários
    DELETE FROM auth.identities WHERE user_id != v_current_user_id;
    DELETE FROM auth.sessions WHERE user_id != v_current_user_id;
    DELETE FROM public.profiles WHERE id != v_current_user_id;
    DELETE FROM auth.users WHERE id != v_current_user_id;
    
    RAISE NOTICE 'Usuários deletados, mantido apenas o usuário atual';
END $$;
*/

-- ========================================
-- OPÇÃO 3: RESET TOTAL (MUITO PERIGOSO!)
-- ========================================
-- Limpa TUDO, incluindo VOCÊ mesmo!

/*
TRUNCATE TABLE assertividade_incidentes RESTART IDENTITY CASCADE;
TRUNCATE TABLE technicians RESTART IDENTITY CASCADE;
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM public.profiles;
DELETE FROM auth.users;
*/

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Ver o que tem no banco antes de deletar:

SELECT 'assertividade_incidentes' as tabela, COUNT(*) as total FROM assertividade_incidentes
UNION ALL
SELECT 'technicians', COUNT(*) FROM technicians
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;
