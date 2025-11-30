-- Script para verificar usuário e diagnóstico de login
-- Email: julianodesouzaleite@gmail.com
-- Senha: Password90!#%90

-- 1. Verificar se existe na tabela auth.users (Supabase Auth)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 2. Verificar se existe na tabela public.users
SELECT 
  id,
  email,
  full_name,
  role,
  cpf,
  phone,
  created_at,
  updated_at
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 3. Verificar se o email está confirmado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN 'Email NÃO confirmado'
    ELSE 'Email confirmado em: ' || u.email_confirmed_at::text
  END as status_email,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- 4. Verificar se há múltiplos registros com o mesmo email
SELECT 
  'auth.users' as tabela,
  COUNT(*) as total_registros
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com'
UNION ALL
SELECT 
  'public.users' as tabela,
  COUNT(*) as total_registros
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 5. Verificar dados completos do usuário (join entre auth e public)
SELECT 
  au.id as auth_id,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  pu.id as public_user_id,
  pu.full_name,
  pu.role,
  pu.cpf,
  pu.phone,
  pu.created_at as public_created_at,
  CASE 
    WHEN au.id IS NULL THEN '❌ Não existe em auth.users'
    WHEN pu.id IS NULL THEN '⚠️ Existe em auth.users mas NÃO em public.users'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email não confirmado'
    ELSE '✅ Usuário completo e confirmado'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 6. Verificar se há problemas de senha (não podemos ver a senha, mas podemos verificar tentativas)
-- Nota: Senhas são hasheadas, não podemos verificar diretamente
-- Mas podemos verificar se o usuário existe e está ativo

-- 7. Verificar organizador associado (se for organizador)
SELECT 
  o.id as organizer_id,
  o.company_name,
  o.user_id,
  u.email,
  u.full_name
FROM organizers o
JOIN users u ON o.user_id = u.id
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- 8. Verificar afiliado associado (se for afiliado)
SELECT 
  a.id as affiliate_id,
  a.user_id,
  u.email,
  u.full_name
FROM affiliates a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- 9. Verificar todas as tentativas de login recentes (se houver logs)
-- Nota: Isso depende de ter logs configurados no Supabase

-- 10. Script para resetar senha (se necessário)
-- Descomente e execute apenas se precisar resetar a senha:
/*
-- Primeiro, verificar se o usuário existe
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'julianodesouzaleite@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'Usuário não encontrado em auth.users';
  ELSE
    RAISE NOTICE 'Usuário encontrado com ID: %', user_id;
    -- Para resetar senha, use o Supabase Dashboard ou a API
    -- Não é possível resetar senha diretamente via SQL por questões de segurança
  END IF;
END $$;
*/

