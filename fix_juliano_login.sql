-- ============================================
-- CORRIGIR LOGIN DO JULIANO
-- Email: julianodesouzaleite@gmail.com
-- User ID: 11362ea0-669d-4dd9-9698-506bc69a827e
-- Senha: Password90!#%90
-- ============================================

-- PROBLEMA IDENTIFICADO:
-- O usuário existe em public.users e está vinculado a um organizador,
-- mas pode estar faltando:
-- 1. Email não confirmado em auth.users
-- 2. Senha não definida ou incorreta em auth.users
-- 3. Usuário não existe em auth.users (criado apenas em public.users)

-- ============================================
-- PASSO 1: DIAGNÓSTICO
-- ============================================
SELECT 
  '=== DIAGNÓSTICO INICIAL ===' as info,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.encrypted_password IS NOT NULL as tem_senha,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.full_name,
  CASE 
    WHEN au.id IS NULL THEN '❌ NÃO EXISTE em auth.users - PRECISA CRIAR'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email NÃO confirmado - PRECISA CONFIRMAR'
    WHEN au.encrypted_password IS NULL THEN '⚠️ NÃO tem senha - PRECISA DEFINIR'
    ELSE '✅ Usuário existe, mas senha pode estar incorreta'
  END as problema_identificado
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE pu.email = 'julianodesouzaleite@gmail.com' OR pu.id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- ============================================
-- PASSO 2: GARANTIR EXTENSÃO pgcrypto
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- PASSO 3: CORRIGIR/CONFIRMAR EMAIL
-- ============================================
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com' 
  AND (email_confirmed_at IS NULL OR email_confirmed_at IS NULL);

-- ============================================
-- PASSO 4: DEFINIR/ATUALIZAR SENHA
-- ============================================
UPDATE auth.users
SET 
  encrypted_password = crypt('Password90!#%90', gen_salt('bf', 10)),
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  au.id,
  au.email,
  au.email_confirmed_at,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✅ Senha definida com sucesso!'
    ELSE '❌ Erro ao definir senha'
  END as status_senha,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status_email,
  au.updated_at,
  pu.full_name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- PRONTO! Agora o usuário pode fazer login com:
-- Email: julianodesouzaleite@gmail.com
-- Senha: Password90!#%90
-- ============================================

-- NOTA: Se o usuário NÃO existir em auth.users, será necessário criar via API Admin:
-- Use a rota: /api/admin/update-user-password
-- Ou crie manualmente no Supabase Dashboard

