-- ============================================
-- VERIFICAÇÃO E CORREÇÃO DE AUTENTICAÇÃO
-- Usuário: julianodesouzaleite@gmail.com
-- Senha: Password90!#%90
-- ============================================
-- Este script verifica os problemas de autenticação
-- e prepara as correções necessárias
-- ============================================

-- ============================================
-- PARTE 1: DIAGNÓSTICO DE AUTENTICAÇÃO
-- ============================================

-- 1.1. Verificar AUTH.USERS (CRÍTICO - Aqui está o problema!)
SELECT 
  '=== 1.1. AUTH.USERS (AUTENTICAÇÃO) ===' as verificacao,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO - BLOQUEIA LOGIN!'
    ELSE '✅ Email confirmado em: ' || email_confirmed_at::text
  END as status_email,
  encrypted_password IS NOT NULL as tem_senha,
  CASE 
    WHEN encrypted_password IS NULL THEN '❌ SEM SENHA - BLOQUEIA LOGIN!'
    ELSE '✅ Senha definida'
  END as status_senha,
  created_at,
  updated_at,
  last_sign_in_at,
  banned_until,
  CASE 
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ USUÁRIO BANIDO até: ' || banned_until::text
    WHEN banned_until IS NOT NULL THEN '⚠️ Usuário foi banido anteriormente'
    ELSE '✅ Usuário não está banido'
  END as status_ban,
  raw_user_meta_data->>'role' as role_metadata
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 1.2. Verificar se há múltiplas contas
SELECT 
  '=== 1.2. MÚLTIPLAS CONTAS? ===' as verificacao,
  COUNT(*) as total_contas,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(email_confirmed_at::text, ', ') as confirmacoes
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 1.3. Verificar PUBLIC.USERS (já sabemos que está OK, mas vamos confirmar)
SELECT 
  '=== 1.3. PUBLIC.USERS ===' as verificacao,
  id,
  email,
  full_name,
  role,
  is_active,
  CASE 
    WHEN is_active = false THEN '❌ USUÁRIO INATIVO'
    ELSE '✅ Usuário ativo'
  END as status
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- PARTE 2: CORREÇÕES AUTOMÁTICAS
-- ============================================

-- 2.1. CONFIRMAR EMAIL (se não estiver confirmado)
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND email_confirmed_at IS NULL;

-- 2.2. REMOVER BAN (se houver)
UPDATE auth.users
SET 
  banned_until = NULL,
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND banned_until IS NOT NULL;

-- 2.3. GARANTIR USUÁRIO ATIVO em public.users
UPDATE public.users
SET 
  is_active = true,
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND is_active = false;

-- 2.4. TENTAR ATUALIZAR SENHA VIA SQL
-- NOTA: Isso pode não funcionar. Se não funcionar, use a API (veja PARTE 3)
DO $$
DECLARE
  user_id_val UUID;
  senha_atualizada BOOLEAN := false;
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO user_id_val
  FROM auth.users
  WHERE email = 'julianodesouzaleite@gmail.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Tentar atualizar usando crypt (bcrypt)
    BEGIN
      UPDATE auth.users
      SET 
        encrypted_password = crypt('Password90!#%90', gen_salt('bf', 10)),
        updated_at = NOW()
      WHERE id = user_id_val;
      
      senha_atualizada := true;
      RAISE NOTICE '✅ Senha atualizada via SQL para usuário: %', user_id_val;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Não foi possível atualizar senha via SQL. Use a API (veja PARTE 3). Erro: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '❌ Usuário não encontrado em auth.users';
  END IF;
END $$;

-- ============================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  '✅ VERIFICAÇÃO FINAL - AUTH.USERS' as status,
  au.id,
  au.email,
  au.email_confirmed_at,
  CASE 
    WHEN au.encrypted_password IS NOT NULL THEN '✅ Senha definida'
    ELSE '❌ Senha NÃO definida - USE API (veja instruções abaixo)'
  END as status_senha,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status_email,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN '❌ Usuário banido'
    ELSE '✅ Usuário não banido'
  END as status_ban,
  au.updated_at,
  au.last_sign_in_at
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- PARTE 4: INSTRUÇÕES PARA ATUALIZAR SENHA
-- ============================================
-- 
-- Se a senha NÃO foi atualizada (status_senha = '❌ Senha NÃO definida'),
-- use uma das opções abaixo:
--
-- ============================================
-- OPÇÃO 1: VIA API DO PROJETO (RECOMENDADO)
-- ============================================
-- Use a API route já existente: /api/admin/update-user-password
--
-- Exemplo via curl:
-- curl -X POST http://localhost:3000/api/admin/update-user-password \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "julianodesouzaleite@gmail.com",
--     "password": "Password90!#%90"
--   }'
--
-- Ou via Postman/Insomnia:
-- POST http://localhost:3000/api/admin/update-user-password
-- Body (JSON):
-- {
--   "email": "julianodesouzaleite@gmail.com",
--   "password": "Password90!#%90"
-- }
--
-- ============================================
-- OPÇÃO 2: VIA SUPABASE DASHBOARD (MAIS FÁCIL)
-- ============================================
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em Authentication > Users
-- 4. Procure por: julianodesouzaleite@gmail.com
-- 5. Clique no usuário
-- 6. Clique em "Reset Password" ou "Update User"
-- 7. Defina a nova senha: Password90!#%90
-- 8. Salve
--
-- ============================================
-- OPÇÃO 3: VIA API ADMIN DO SUPABASE
-- ============================================
-- 1. Obtenha o SERVICE_ROLE_KEY do Supabase (Settings > API)
-- 2. Use o código abaixo ou faça uma requisição HTTP:
--
-- const { createClient } = require('@supabase/supabase-js')
-- const supabaseAdmin = createClient(
--   'https://[PROJECT-REF].supabase.co',
--   '[SERVICE-ROLE-KEY]',
--   { auth: { autoRefreshToken: false, persistSession: false } }
-- )
--
-- const { data: users } = await supabaseAdmin.auth.admin.listUsers()
-- const user = users.users.find(u => u.email === 'julianodesouzaleite@gmail.com')
--
-- await supabaseAdmin.auth.admin.updateUserById(user.id, {
--   password: 'Password90!#%90'
-- })
--
-- ============================================
-- RESUMO DO PROBLEMA
-- ============================================
-- O erro "usuário e senha inválido" geralmente acontece por:
-- 1. ❌ Email não confirmado (email_confirmed_at IS NULL)
-- 2. ❌ Senha não definida ou incorreta (encrypted_password IS NULL ou hash incorreto)
-- 3. ❌ Usuário banido (banned_until > NOW())
-- 4. ❌ Usuário inativo em public.users (is_active = false)
--
-- Este script corrige os itens 1, 3 e 4 automaticamente.
-- Para o item 2 (senha), use uma das opções acima.
-- ============================================

