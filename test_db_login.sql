-- DIAGNÓSTICO FINAL: Testar Login por dentro do Banco (Bypassing API)
-- Isso vai nos dizer se o problema é o BANCO ou o SERVIDOR WEB do Supabase.

CREATE OR REPLACE FUNCTION public.check_credentials(p_email text, p_password text)
RETURNS text
SECURITY DEFINER -- Roda com permissão total (Postgres)
SET search_path = public, extensions, auth -- Garante que acha o pgcrypto e auth
AS $$
DECLARE
  v_user auth.users;
BEGIN
  -- 1. Tentar ler o usuário (Teste de leitura no Schema Auth)
  SELECT * INTO v_user FROM auth.users WHERE email = p_email;
  
  IF v_user IS NULL THEN
    RETURN '❌ Usuário não encontrado no banco (auth.users). Verifique o email.';
  END IF;

  -- 2. Tentar verificar senha (Teste do pgcrypto)
  IF v_user.encrypted_password = crypt(p_password, v_user.encrypted_password) THEN
    RETURN '✅ SUCESSO! O Banco está perfeito. O problema é no Servidor do Supabase (Cache).';
  ELSE
    RETURN '❌ Senha Incorreta. A criptografia funcionou, mas a senha não bate.';
  END IF;

EXCEPTION WHEN OTHERS THEN
   -- Aqui vamos pegar o erro REAL que o servidor está escondendo
   RETURN '❌ ERRO MONSTRO: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Rodar o teste imediatamente
SELECT public.check_credentials('n0057998@coprede.auditor', 'cop123') as resultado_teste;
