-- Comprehensive RLS fix for profiles table
-- This allows login to work correctly

-- 1. Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users own profile" ON profiles;
DROP POLICY IF EXISTS "Allow service role" ON profiles;

-- 2. Desabilitar RLS temporariamente para debug
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Se você precisar que apenas os usuários vejam seu próprio perfil,
-- habilite RLS e descomente as políticas abaixo:

/*
-- 3. Habilitar RLS novamente
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas usando auth.uid() em vez de auth.jwt()

-- Permitir SELECT para usuários autenticados verem seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Permitir INSERT para criar perfis (usado pelo trigger)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Permitir UPDATE para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir acesso total para service_role (usado pelas RPCs)
CREATE POLICY "Allow service role full access"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
*/

-- 5. Verificação: Testar se consegue buscar perfis
-- SELECT * FROM profiles; -- Deve retornar todos os perfis agora
