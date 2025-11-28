-- ============================================
-- VERIFICAÇÃO DE AUTENTICAÇÃO: elo.gabriela@gmail.com
-- ============================================
-- Este script verifica o status de autenticação do usuário
-- ============================================

-- Verificar status completo em auth.users
SELECT 
  '🔐 STATUS DE AUTENTICAÇÃO' as verificacao,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO - Isso pode causar erro de login!'
    ELSE '✅ Email confirmado'
  END as status_email,
  CASE 
    WHEN encrypted_password IS NULL THEN '❌ SEM SENHA - Precisa definir senha!'
    ELSE '✅ Senha configurada'
  END as status_senha,
  raw_user_meta_data
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- Verificar se há tentativas de login bloqueadas
SELECT 
  '🚫 BLOQUEIOS' as verificacao,
  id,
  email,
  banned_until,
  CASE 
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ USUÁRIO BLOQUEADO até ' || banned_until::text
    ELSE '✅ Usuário não está bloqueado'
  END as status_bloqueio
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- ============================================
-- CORREÇÕES POSSÍVEIS
-- ============================================

-- 1. Para confirmar o email manualmente (se tiver acesso ao banco):
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'elo.gabriela@gmail.com' AND email_confirmed_at IS NULL;

-- 2. Para desbloquear o usuário (se estiver bloqueado):
-- UPDATE auth.users 
-- SET banned_until = NULL
-- WHERE email = 'elo.gabriela@gmail.com';

-- 3. Para redefinir senha, use o Supabase Dashboard:
-- Authentication > Users > Encontre o usuário > Reset Password
-- OU use a Admin API do Supabase

