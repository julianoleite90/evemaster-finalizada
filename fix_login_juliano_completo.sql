-- ============================================
-- CORREÇÃO COMPLETA DE LOGIN: julianodesouzaleite@gmail.com
-- Senha: Password90!#%90
-- ============================================
-- Este script:
-- 1. Diagnostica o problema completo
-- 2. Verifica políticas RLS que podem estar bloqueando
-- 3. Atualiza a senha
-- 4. Confirma o email
-- 5. Verifica e corrige membership em organization_users
-- ============================================

-- ============================================
-- PARTE 1: DIAGNÓSTICO COMPLETO
-- ============================================

-- 1.1. Verificar AUTH.USERS (Autenticação Supabase)
SELECT 
  '=== 1.1. AUTH.USERS ===' as verificacao,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO - BLOQUEIA LOGIN!'
    ELSE '✅ Email confirmado em: ' || email_confirmed_at::text
  END as status_email,
  encrypted_password IS NOT NULL as tem_senha,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data->>'role' as role_metadata,
  banned_until,
  CASE 
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ USUÁRIO BANIDO até: ' || banned_until::text
    WHEN banned_until IS NOT NULL THEN '⚠️ Usuário foi banido anteriormente'
    ELSE '✅ Usuário não está banido'
  END as status_ban
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 1.2. Verificar PUBLIC.USERS
SELECT 
  '=== 1.2. PUBLIC.USERS ===' as verificacao,
  id,
  email,
  full_name,
  role,
  is_active,
  CASE 
    WHEN is_active = false THEN '❌ USUÁRIO INATIVO'
    ELSE '✅ Usuário ativo'
  END as status,
  created_at,
  updated_at
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 1.3. Verificar se é ORGANIZADOR PRINCIPAL
SELECT 
  '=== 1.3. ORGANIZADOR PRINCIPAL ===' as verificacao,
  o.id as organizer_id,
  o.company_name,
  o.status,
  o.is_active,
  o.user_id,
  CASE 
    WHEN o.id IS NULL THEN '❌ NÃO é organizador principal'
    WHEN o.is_active = false THEN '❌ Organizador INATIVO'
    WHEN o.status != 'approved' THEN '❌ Organizador NÃO APROVADO: ' || o.status
    ELSE '✅ É organizador principal e ativo'
  END as status
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- 1.4. Verificar MEMBERSHIP EM ORGANIZATION_USERS (CRÍTICO!)
SELECT 
  '=== 1.4. MEMBERSHIP ORGANIZATION_USERS ===' as verificacao,
  ou.id,
  ou.organizer_id,
  o.company_name as organizador,
  ou.user_id,
  ou.can_view,
  ou.can_edit,
  ou.can_create,
  ou.can_delete,
  ou.is_active,
  ou.created_at,
  ou.updated_at,
  CASE 
    WHEN ou.id IS NULL THEN '❌ NÃO está vinculado a nenhuma organização!'
    WHEN ou.is_active = false THEN '❌ Vínculo INATIVO'
    WHEN ou.can_view = false THEN '❌ SEM PERMISSÃO DE VISUALIZAÇÃO'
    ELSE '✅ É membro ativo com permissões'
  END as status
FROM public.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id
LEFT JOIN public.organizers o ON o.id = ou.organizer_id
WHERE u.email = 'julianodesouzaleite@gmail.com'
ORDER BY ou.is_active DESC, ou.created_at DESC;

-- 1.5. Verificar se há MÚLTIPLAS CONTAS com o mesmo email
SELECT 
  '=== 1.5. MÚLTIPLAS CONTAS? ===' as verificacao,
  'auth.users' as tabela,
  COUNT(*) as total_registros,
  STRING_AGG(id::text, ', ') as ids
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com'
UNION ALL
SELECT 
  '=== 1.5. MÚLTIPLAS CONTAS? ===' as verificacao,
  'public.users' as tabela,
  COUNT(*) as total_registros,
  STRING_AGG(id::text, ', ') as ids
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 1.6. Verificar RLS POLICIES (Políticas que podem estar bloqueando)
SELECT 
  '=== 1.6. RLS POLICIES - ORGANIZATION_USERS ===' as verificacao,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'organization_users'
ORDER BY policyname;

SELECT 
  '=== 1.6. RLS POLICIES - USERS ===' as verificacao,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

SELECT 
  '=== 1.6. RLS POLICIES - ORGANIZERS ===' as verificacao,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'organizers'
ORDER BY policyname;

-- ============================================
-- PARTE 2: CORREÇÕES
-- ============================================

-- 2.1. Garantir que o email está confirmado
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND email_confirmed_at IS NULL;

-- 2.2. Remover ban se houver
UPDATE auth.users
SET 
  banned_until = NULL,
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND banned_until IS NOT NULL;

-- 2.3. Garantir que o usuário está ativo em public.users
UPDATE public.users
SET 
  is_active = true,
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND is_active = false;

-- 2.4. ATUALIZAR SENHA usando função do Supabase
-- IMPORTANTE: No Supabase, a melhor forma é usar a API Admin ou função específica
-- Mas vamos tentar a abordagem direta primeiro

-- Opção 1: Usar crypt (pode não funcionar dependendo das configurações)
-- Primeiro, garantir que a extensão pgcrypto está disponível
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tentar atualizar a senha diretamente
-- NOTA: Isso pode não funcionar se o Supabase usar um sistema de hash diferente
-- Se não funcionar, use a API Admin do Supabase (veja instruções no final)
DO $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO user_id_val
  FROM auth.users
  WHERE email = 'julianodesouzaleite@gmail.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Tentar atualizar usando crypt (formato bcrypt)
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Password90!#%90', gen_salt('bf', 10)),
      updated_at = NOW()
    WHERE id = user_id_val;
    
    RAISE NOTICE 'Senha atualizada para usuário: %', user_id_val;
  ELSE
    RAISE NOTICE 'Usuário não encontrado em auth.users';
  END IF;
END $$;

-- 2.5. Garantir que há membership ativo em organization_users
-- Se o usuário é organizador principal, garantir que há registro em organization_users
DO $$
DECLARE
  user_id_val UUID;
  organizer_id_val UUID;
  membership_exists BOOLEAN;
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO user_id_val
  FROM public.users
  WHERE email = 'julianodesouzaleite@gmail.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Verificar se é organizador principal
    SELECT id INTO organizer_id_val
    FROM public.organizers
    WHERE user_id = user_id_val;
    
    IF organizer_id_val IS NOT NULL THEN
      -- Verificar se já existe membership
      SELECT EXISTS(
        SELECT 1 FROM public.organization_users
        WHERE user_id = user_id_val
        AND organizer_id = organizer_id_val
      ) INTO membership_exists;
      
      -- Se não existe, criar
      IF NOT membership_exists THEN
        INSERT INTO public.organization_users (
          user_id,
          organizer_id,
          is_active,
          can_view,
          can_edit,
          can_create,
          can_delete,
          created_at,
          updated_at
        ) VALUES (
          user_id_val,
          organizer_id_val,
          true,
          true,
          true,
          true,
          true,
          NOW(),
          NOW()
        );
        RAISE NOTICE 'Membership criado para organizador principal: %', organizer_id_val;
      ELSE
        -- Se existe mas está inativo, ativar
        UPDATE public.organization_users
        SET 
          is_active = true,
          can_view = true,
          can_edit = true,
          can_create = true,
          can_delete = true,
          updated_at = NOW()
        WHERE user_id = user_id_val
        AND organizer_id = organizer_id_val
        AND is_active = false;
        RAISE NOTICE 'Membership ativado para organizador principal: %', organizer_id_val;
      END IF;
    END IF;
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
    ELSE '❌ Senha NÃO definida - USE API ADMIN'
  END as status_senha,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status_email,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN '❌ Usuário banido'
    ELSE '✅ Usuário não banido'
  END as status_ban,
  au.updated_at
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com';

SELECT 
  '✅ VERIFICAÇÃO FINAL - PUBLIC.USERS' as status,
  pu.id,
  pu.email,
  pu.full_name,
  pu.role,
  pu.is_active,
  CASE 
    WHEN pu.is_active THEN '✅ Usuário ativo'
    ELSE '❌ Usuário inativo'
  END as status
FROM public.users pu
WHERE pu.email = 'julianodesouzaleite@gmail.com';

SELECT 
  '✅ VERIFICAÇÃO FINAL - MEMBERSHIP' as status,
  ou.id,
  ou.organizer_id,
  o.company_name,
  ou.is_active,
  ou.can_view,
  ou.can_edit,
  CASE 
    WHEN ou.id IS NULL THEN '❌ SEM MEMBERSHIP'
    WHEN ou.is_active = false THEN '❌ Membership inativo'
    WHEN ou.can_view = false THEN '❌ Sem permissão de visualização'
    ELSE '✅ Membership ativo com permissões'
  END as status_membership
FROM public.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id
LEFT JOIN public.organizers o ON o.id = ou.organizer_id
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- INSTRUÇÕES ADICIONAIS
-- ============================================
-- 
-- Se a senha NÃO foi atualizada pelo script acima (status_senha = '❌ Senha NÃO definida'),
-- você precisa usar a API Admin do Supabase:
--
-- 1. Vá para: Supabase Dashboard > Settings > API
-- 2. Copie a "service_role" key (NÃO a anon key!)
-- 3. Use uma das opções abaixo:
--
-- OPÇÃO A: Via Supabase Dashboard
-- - Vá em Authentication > Users
-- - Encontre julianodesouzaleite@gmail.com
-- - Clique em "..." > "Reset Password"
-- - Defina a nova senha: Password90!#%90
--
-- OPÇÃO B: Via API (Postman ou curl)
-- POST https://[PROJECT-REF].supabase.co/auth/v1/admin/users/[USER-ID]
-- Headers:
--   Authorization: Bearer [SERVICE-ROLE-KEY]
--   Content-Type: application/json
-- Body:
--   {
--     "password": "Password90!#%90"
--   }
--
-- OPÇÃO C: Via código (se tiver acesso)
-- Use a função updateUserById do Supabase Admin API
--
-- ============================================
-- TESTE DE LOGIN
-- ============================================
-- Após executar este script, teste o login com:
-- Email: julianodesouzaleite@gmail.com
-- Senha: Password90!#%90
--
-- Se ainda não funcionar, verifique:
-- 1. Se o email está confirmado (deve aparecer ✅)
-- 2. Se a senha foi atualizada (deve aparecer ✅)
-- 3. Se há membership ativo (deve aparecer ✅)
-- 4. Se não há políticas RLS bloqueando (verifique os logs de erro)
-- ============================================

