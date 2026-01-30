-- Script para criar usuários manualmente sem auto-login
-- Este script deleta o usuário se já existir e cria novamente

DO $$
DECLARE
    v_user_id uuid;
    v_login text := 'N5775246';  -- ← MUDE AQUI o login
    v_email text := 'n5775246@claro.com.br';  -- ← MUDE AQUI o email
    v_password text := 'cop123';  -- ← MUDE AQUI a senha
    v_role text := 'analyst';  -- ou 'admin'
    v_existing_id uuid;
BEGIN
    -- Verificar se o email já existe
    SELECT id INTO v_existing_id FROM auth.users WHERE email = v_email;
    
    IF v_existing_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário existente encontrado: %, deletando...', v_email;
        
        -- Deletar identities primeiro (se existirem)
        DELETE FROM auth.identities WHERE user_id = v_existing_id;
        
        -- Deletar sessões
        DELETE FROM auth.sessions WHERE user_id = v_existing_id;
        
        -- Deletar refresh tokens
        DELETE FROM auth.refresh_tokens WHERE user_id = v_existing_id;
        
        -- Deletar perfil
        DELETE FROM public.profiles WHERE id = v_existing_id;
        
        -- Deletar usuário por último
        DELETE FROM auth.users WHERE id = v_existing_id;
        
        RAISE NOTICE 'Usuário deletado com sucesso';
    END IF;

    -- Criar novo usuário no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('login', v_login),
        now(),
        now(),
        '',
        ''
    ) RETURNING id INTO v_user_id;

    -- Criar ou atualizar perfil (UPSERT para evitar conflito com trigger)
    INSERT INTO public.profiles (id, login, role)
    VALUES (v_user_id, v_login, v_role)
    ON CONFLICT (id) DO UPDATE
    SET login = EXCLUDED.login, role = EXCLUDED.role;

    RAISE NOTICE 'Usuário % criado com sucesso! ID: %', v_login, v_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro: %', SQLERRM;
        RAISE;
END $$;
