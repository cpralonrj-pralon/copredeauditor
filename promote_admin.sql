-- PROMOVER PARA ADMIN
-- Atualiza o perfil baseado no email do usuario (linkando com auth.users)

UPDATE public.profiles
SET role = 'admin'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'pralon@claro.com.br';

-- Verificação
SELECT email, role 
FROM public.profiles 
JOIN auth.users ON profiles.id = auth.users.id
WHERE email = 'pralon@claro.com.br';
