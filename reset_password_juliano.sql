-- Script para redefinir senha do usuário julianodesouzaleite@gmail.com
-- Senha: Password90!#%90
-- 
-- IMPORTANTE: Este script deve ser executado no Supabase SQL Editor
-- A senha será atualizada no auth.users do Supabase

-- 1. Verificar se o usuário existe
SELECT 
  '=== VERIFICAÇÃO DO USUÁRIO ===' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 2. ATUALIZAR SENHA
-- Nota: No Supabase, a senha precisa ser hashada. 
-- A melhor forma é usar a API do Supabase Admin ou o Dashboard.
-- 
-- Se você tiver acesso ao Supabase Dashboard:
-- 1. Vá em Authentication > Users
-- 2. Encontre o usuário julianodesouzaleite@gmail.com
-- 3. Clique em "Reset Password" ou "Update User"
-- 4. Defina a nova senha: Password90!#%90
--
-- OU use a API do Supabase Admin (via código ou Postman):
-- POST https://[PROJECT-REF].supabase.co/auth/v1/admin/users/[USER-ID]
-- Headers: {
--   "Authorization": "Bearer [SERVICE-ROLE-KEY]",
--   "Content-Type": "application/json"
-- }
-- Body: {
--   "password": "Password90!#%90"
-- }

-- 3. VERIFICAÇÃO FINAL
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  encrypted_password IS NOT NULL as senha_definida,
  updated_at
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- ALTERNATIVA: Usar função do Supabase (se disponível)
-- ============================================
-- Se você tiver permissões de superuser, pode tentar:
--
-- UPDATE auth.users
-- SET 
--   encrypted_password = crypt('Password90!#%90', gen_salt('bf')),
--   updated_at = NOW()
-- WHERE email = 'julianodesouzaleite@gmail.com';
--
-- NOTA: Isso pode não funcionar dependendo das configurações do Supabase.
-- A forma mais segura é usar a API Admin ou o Dashboard.

