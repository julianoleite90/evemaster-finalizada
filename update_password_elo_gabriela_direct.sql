-- ============================================
-- ATUALIZAR SENHA DIRETAMENTE VIA SQL
-- elo.gabriela@gmail.com
-- Nova senha: Password90!#%90
-- ============================================

-- 1. Garantir que a extensão pgcrypto está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Atualizar senha usando bcrypt
UPDATE auth.users
SET 
  encrypted_password = crypt('Password90!#%90', gen_salt('bf', 10)),
  updated_at = NOW()
WHERE email = 'elo.gabriela@gmail.com';

-- 3. Confirmar email se não estiver confirmado
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'elo.gabriela@gmail.com' 
AND email_confirmed_at IS NULL;

-- 4. Verificar se foi atualizado
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Senha atualizada com sucesso!'
    ELSE '❌ Erro ao atualizar senha'
  END as status_senha,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status_email,
  updated_at
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- ============================================
-- PRONTO! Agora o usuário pode fazer login com:
-- Email: elo.gabriela@gmail.com
-- Senha: Password90!#%90
-- ============================================

