-- ============================================
-- VERIFICAÇÃO E CORREÇÃO DE AUTENTICAÇÃO
-- elo.gabriela@gmail.com
-- ============================================

-- 1. VERIFICAR STATUS ATUAL
SELECT 
  '📊 STATUS ATUAL' as info,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO'
    ELSE '✅ Email confirmado'
  END as status_email,
  CASE 
    WHEN encrypted_password IS NULL THEN '❌ SEM SENHA'
    ELSE '✅ Senha configurada'
  END as status_senha,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- ============================================
-- CORREÇÕES
-- ============================================

-- 2. CONFIRMAR EMAIL (se não estiver confirmado)
-- IMPORTANTE: Isso só funciona se você tiver acesso direto ao banco
-- Se não funcionar, use o Supabase Dashboard ou Admin API
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'elo.gabriela@gmail.com' 
AND email_confirmed_at IS NULL;

-- Verificar se foi confirmado
SELECT 
  '✅ Email confirmado?' as verificacao,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ SIM - Email confirmado'
    ELSE '❌ NÃO - Ainda precisa confirmar via Dashboard ou Admin API'
  END as status
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- ============================================
-- IMPORTANTE: REDEFINIR SENHA
-- ============================================
-- NÃO é possível redefinir senha diretamente via SQL por questões de segurança
-- Use uma das opções abaixo:

-- OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em: Authentication > Users
-- 3. Encontre: elo.gabriela@gmail.com
-- 4. Clique nos "..." (três pontos)
-- 5. Selecione: "Reset Password"
-- 6. O usuário receberá um email para redefinir a senha

-- OPÇÃO 2: Via Admin API (se tiver acesso)
-- Use o endpoint: POST /auth/v1/admin/users/{user_id}/generate_recovery_token
-- Ou: POST /auth/v1/admin/users/{user_id} com body: { "password": "nova_senha" }

-- OPÇÃO 3: Criar nova senha temporária via API
-- Veja o arquivo: app/api/admin/update-user-password/route.ts

