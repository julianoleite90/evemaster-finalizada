-- ============================================
-- VERIFICAR E RESETAR SENHA DO USUÁRIO
-- ============================================
-- NOTA: Senhas são armazenadas como hash e NÃO podem ser visualizadas
-- Este script permite verificar se há senha e resetá-la se necessário

-- 1. Verificar informações sobre a senha do usuário Juliano
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at as data_criacao,
  last_sign_in_at as ultimo_login,
  raw_user_meta_data->>'full_name' as nome
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 2. Verificar informações sobre a senha do usuário Fabiano (se existir)
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at as data_criacao,
  last_sign_in_at as ultimo_login,
  raw_user_meta_data->>'full_name' as nome
FROM auth.users
WHERE email = 'fabianobraun@gmail.com';

-- 3. Listar TODOS os usuários e status de senha
SELECT 
  email,
  encrypted_password IS NOT NULL as tem_senha,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at as data_criacao,
  last_sign_in_at as ultimo_login
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- IMPORTANTE: Para resetar a senha, você precisa:
-- ============================================
-- 1. Usar a interface do Supabase Dashboard:
--    - Vá em Authentication > Users
--    - Clique no usuário
--    - Clique em "Send password reset email"
--
-- 2. OU usar a API do Supabase Auth:
--    - POST para /auth/v1/recover
--    - Com o email do usuário
--
-- 3. OU criar uma nova senha diretamente (requer privilégios admin):
--    - Use a função admin do Supabase para atualizar a senha
--
-- NOTA: Não é possível ver a senha atual por segurança (ela é um hash irreversível)

