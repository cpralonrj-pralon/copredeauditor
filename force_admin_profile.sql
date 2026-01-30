-- FORÇAR CRIAÇÃO DE PERFIL ADMIN
-- Garante que o usuário pralon@claro.com.br tenha uma linha na tabela profiles e seja admin.

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- 1. Achar o ID do usuário no Auth
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'pralon@claro.com.br';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário pralon@claro.com.br não encontrado no Auth!';
    END IF;

    -- 2. Inserir ou Atualizar o Profile
    INSERT INTO public.profiles (id, login, role)
    VALUES (v_user_id, 'PRALON', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', login = 'PRALON';

    RAISE NOTICE '✅ Perfil verificado/criado com sucesso para PRALON (ADMIN).';
END $$;
