-- RESTAURAR GATILHO DE PERFIL
-- Isso garante que ao criar um usuário no Auth, o Perfil seja criado no Public automaticamente.

-- 1. Função que roda quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, login, role)
  VALUES (
    new.id,
    split_part(new.email, '@', 1), -- Pega o login do email (antes do @)
    COALESCE(new.raw_user_meta_data->>'role', 'user') -- Pega a role do metadata ou usa 'user'
  );
  RETURN new;
END;
$$;

-- 2. Recriar o Gatilho
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Garantir permissão para o Auth executar isso
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
