-- ============================================
-- SCRIPT PARA CONFIRMAR EMAIL DE UM USUÁRIO
-- ============================================
-- Execute este script no Supabase SQL Editor para confirmar o email de um usuário
-- Substitua 'usuario@email.com' pelo email do usuário que deseja confirmar

-- Opção 1: Usar a função (recomendado)
SELECT public.confirm_user_email('usuario@email.com');

-- Opção 2: Atualizar diretamente (se a função não funcionar)
-- UPDATE auth.users
-- SET 
--   email_confirmed_at = NOW()
-- WHERE email = 'usuario@email.com';

-- Verificar se foi confirmado
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'usuario@email.com';

