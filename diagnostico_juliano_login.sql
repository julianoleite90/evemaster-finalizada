-- ============================================
-- DIAGNÓSTICO COMPLETO: julianodesouzaleite@gmail.com
-- Problema: Não consegue fazer login no dashboard organizador
-- Mas outros usuários da mesma organização conseguem
-- ============================================

-- 1. VERIFICAR AUTH.USERS (Autenticação Supabase)
SELECT 
  '=== 1. AUTH.USERS ===' as verificacao,
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
  raw_user_meta_data->>'role' as role_metadata
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 2. VERIFICAR PUBLIC.USERS
SELECT 
  '=== 2. PUBLIC.USERS ===' as verificacao,
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

-- 3. VERIFICAR SE É ORGANIZADOR PRINCIPAL
SELECT 
  '=== 3. ORGANIZADOR PRINCIPAL ===' as verificacao,
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

-- 4. VERIFICAR MEMBERSHIP EM ORGANIZATION_USERS (CRÍTICO!)
SELECT 
  '=== 4. MEMBERSHIP ORGANIZATION_USERS ===' as verificacao,
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

-- 5. COMPARAR COM OUTROS USUÁRIOS DA MESMA ORGANIZAÇÃO
-- (Substitua ORGANIZER_ID pelo ID real da organização)
SELECT 
  '=== 5. COMPARAÇÃO COM OUTROS USUÁRIOS ===' as verificacao,
  u.email,
  u.full_name,
  u.role,
  ou.is_active as membership_ativo,
  ou.can_view,
  ou.can_edit,
  CASE 
    WHEN ou.id IS NULL THEN '❌ Sem membership'
    WHEN ou.is_active = false THEN '❌ Membership inativo'
    ELSE '✅ Membership ativo'
  END as status_membership
FROM public.organization_users ou
JOIN public.users u ON u.id = ou.user_id
WHERE ou.organizer_id IN (
  SELECT organizer_id 
  FROM public.organization_users ou2
  JOIN public.users u2 ON u2.id = ou2.user_id
  WHERE u2.email = 'julianodesouzaleite@gmail.com'
)
ORDER BY u.email;

-- 6. VERIFICAR SE HÁ MÚLTIPLAS CONTAS COM O MESMO EMAIL
SELECT 
  '=== 6. MÚLTIPLAS CONTAS? ===' as verificacao,
  'auth.users' as tabela,
  COUNT(*) as total_registros,
  STRING_AGG(id::text, ', ') as ids
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com'
UNION ALL
SELECT 
  '=== 6. MÚLTIPLAS CONTAS? ===' as verificacao,
  'public.users' as tabela,
  COUNT(*) as total_registros,
  STRING_AGG(id::text, ', ') as ids
FROM public.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 7. VERIFICAR RLS POLICIES (se possível)
-- Nota: Isso pode não funcionar dependendo das permissões
SELECT 
  '=== 7. RLS POLICIES ===' as verificacao,
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

-- ============================================
-- POSSÍVEIS CORREÇÕES BASEADAS NO DIAGNÓSTICO:
-- ============================================
-- 
-- Se email não confirmado:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'julianodesouzaleite@gmail.com';
--
-- Se não tem membership:
-- INSERT INTO public.organization_users (user_id, organizer_id, is_active, can_view, can_edit, can_create, can_delete)
-- SELECT u.id, o.id, true, true, true, true, true
-- FROM public.users u, public.organizers o
-- WHERE u.email = 'julianodesouzaleite@gmail.com'
-- AND o.id = '[ORGANIZER_ID]';
--
-- Se membership está inativo:
-- UPDATE public.organization_users 
-- SET is_active = true, can_view = true, can_edit = true
-- WHERE user_id = (SELECT id FROM public.users WHERE email = 'julianodesouzaleite@gmail.com');

