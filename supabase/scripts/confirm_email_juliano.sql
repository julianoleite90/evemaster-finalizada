-- ============================================
-- CONFIRMAR EMAIL DO JULIANO
-- ============================================
-- Script simples para confirmar o email

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND email_confirmed_at IS NULL;

-- Verificar se foi confirmado
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';



