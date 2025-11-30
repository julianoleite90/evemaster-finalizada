-- Script para diagnosticar e corrigir problema de login
-- Email: julianodesouzaleite@gmail.com
-- User ID: 11362ea0-669d-4dd9-9698-506bc69a827e

-- 1. Verificar status completo do usuário
SELECT 
  '=== STATUS DO USUÁRIO ===' as info,
  au.id as auth_user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  au.encrypted_password IS NOT NULL as tem_senha,
  pu.id as public_user_id,
  pu.full_name,
  pu.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ NÃO EXISTE em auth.users'
    WHEN pu.id IS NULL THEN '⚠️ Existe em auth mas NÃO em public.users'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email NÃO confirmado'
    WHEN au.encrypted_password IS NULL THEN '⚠️ NÃO tem senha definida'
    ELSE '✅ Usuário OK'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julianodesouzaleite@gmail.com' OR au.id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 2. Verificar se o usuário existe em auth.users
SELECT 
  '=== VERIFICAÇÃO AUTH.USERS ===' as info,
  id,
  email,
  email_confirmed_at,
  encrypted_password IS NOT NULL as tem_senha,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com' OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 3. Verificar se o usuário existe em public.users
SELECT 
  '=== VERIFICAÇÃO PUBLIC.USERS ===' as info,
  id,
  email,
  full_name,
  role,
  cpf,
  phone,
  created_at
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com' OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 4. Verificar organizador associado
SELECT 
  '=== ORGANIZADOR ASSOCIADO ===' as info,
  o.id as organizer_id,
  o.company_name,
  o.user_id,
  u.email,
  u.full_name
FROM organizers o
JOIN users u ON o.user_id = u.id
WHERE u.email = 'julianodesouzaleite@gmail.com' OR u.id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 5. CORREÇÃO: Confirmar email se não estiver confirmado
-- Descomente e execute se o email não estiver confirmado:
/*
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com' 
  AND email_confirmed_at IS NULL;
*/

-- 6. CORREÇÃO: Criar usuário em auth.users se não existir mas existir em public.users
-- ATENÇÃO: Isso requer acesso admin. Execute apenas se necessário:
/*
DO $$
DECLARE
  public_user_id UUID;
  public_user_email TEXT;
  public_user_name TEXT;
BEGIN
  -- Buscar dados do public.users
  SELECT id, email, full_name INTO public_user_id, public_user_email, public_user_name
  FROM public.users
  WHERE email = 'julianodesouzaleite@gmail.com';
  
  -- Verificar se não existe em auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = public_user_id
  ) THEN
    -- Criar usuário em auth.users
    -- NOTA: Isso requer usar a API do Supabase Admin, não pode ser feito via SQL direto
    RAISE NOTICE 'Usuário existe em public.users mas não em auth.users. Use a API Admin para criar.';
  ELSE
    RAISE NOTICE 'Usuário já existe em auth.users.';
  END IF;
END $$;
*/

-- 7. Verificar se há problema com a senha
-- A senha é hasheada, então não podemos verificar diretamente
-- Mas podemos verificar se existe:
SELECT 
  '=== VERIFICAÇÃO DE SENHA ===' as info,
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha_hash,
  CASE 
    WHEN encrypted_password IS NULL THEN '❌ NÃO tem senha definida - precisa resetar'
    ELSE '✅ Tem senha definida'
  END as status_senha
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com' OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 8. Verificar tentativas de login recentes (se houver tabela de logs)
-- SELECT * FROM auth.audit_log_entries 
-- WHERE payload->>'email' = 'julianodesouzaleite@gmail.com'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 9. SOLUÇÃO RECOMENDADA: Resetar senha via Supabase Dashboard
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em Authentication > Users
-- 3. Busque por: julianodesouzaleite@gmail.com
-- 4. Clique em "Send password reset email" ou "Reset password"
-- 5. Ou use o comando abaixo via API Admin

-- 10. Verificar se o problema é case sensitivity no email
SELECT 
  '=== VERIFICAÇÃO CASE SENSITIVITY ===' as info,
  id,
  email,
  LOWER(email) as email_lowercase,
  email = 'julianodesouzaleite@gmail.com' as match_exato,
  LOWER(email) = LOWER('julianodesouzaleite@gmail.com') as match_case_insensitive
FROM auth.users
WHERE LOWER(email) = LOWER('julianodesouzaleite@gmail.com');

