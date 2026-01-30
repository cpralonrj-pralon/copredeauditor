-- RPC Function para criar usuários sem auto-login
-- Execute este script UMA VEZ no Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_user_admin(
    p_login text,
    p_password text,
    p_role text DEFAULT 'analyst'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões de superusuário
AS $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_existing_id uuid;
BEGIN
    -- Apenas admins podem chamar essa função
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Apenas administradores podem criar usuários'
        );
    END IF;

    -- Gerar email
    v_email := lower(p_login) || '@claro.com.br';

    -- Verificar se usuário já existe
    SELECT id INTO v_existing_id 
    FROM auth.users 
    WHERE email = v_email;
    
    IF v_existing_id IS NOT NULL THEN
        -- Deletar usuário existente
        DELETE FROM auth.identities WHERE user_id = v_existing_id;
        DELETE FROM auth.sessions WHERE user_id = v_existing_id;
        DELETE FROM auth.refresh_tokens WHERE user_id = v_existing_id;
        DELETE FROM public.profiles WHERE id = v_existing_id;
        DELETE FROM auth.users WHERE id = v_existing_id;
    END IF;

    -- Criar novo usuário
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
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('login', upper(p_login)),
        now(),
        now(),
        '',
        ''
    ) RETURNING id INTO v_user_id;

    -- Criar perfil (com UPSERT)
    INSERT INTO public.profiles (id, login, role)
    VALUES (v_user_id, upper(p_login), p_role)
    ON CONFLICT (id) DO UPDATE
    SET login = EXCLUDED.login, role = EXCLUDED.role;

    RETURN json_build_object(
        'success', true,
        'message', 'Usuário ' || upper(p_login) || ' criado com sucesso!',
        'user_id', v_user_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Erro: ' || SQLERRM
        );
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION create_user_admin IS 'Cria usuários via RPC sem auto-login. Apenas admins podem chamar.';
