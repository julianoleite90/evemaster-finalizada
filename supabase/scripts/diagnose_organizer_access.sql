-- ============================================
-- DIAGNÓSTICO COMPLETO: Por que dados não exibem
-- ============================================
-- Execute este script no Supabase SQL Editor
-- IMPORTANTE: Substitua 'SEU_EMAIL_AQUI' pelo email do usuário logado

-- 1. Verificar se RLS está habilitado
SELECT 
  'RLS Status' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'organizers';

-- 2. Verificar políticas RLS ativas
SELECT 
  'Políticas RLS' as info,
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organizers'
ORDER BY policyname;

-- 3. Verificar dados do usuário específico
SELECT 
  '=== DADOS DO USUÁRIO ===' as info,
  au.id as auth_user_id,
  au.email,
  au.email_confirmed_at,
  u.id as public_user_id,
  u.role,
  u.full_name,
  CASE 
    WHEN u.id = au.id THEN '✅ IDs batem'
    ELSE '❌ IDs NÃO batem'
  END as verificacao_id
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 4. Verificar perfil de organizador
SELECT 
  '=== PERFIL DE ORGANIZADOR ===' as info,
  o.id as organizer_id,
  o.user_id,
  o.company_name,
  o.company_cnpj,
  o.company_address,
  o.company_phone,
  au.id as auth_user_id,
  au.email,
  CASE 
    WHEN o.user_id = au.id THEN '✅ user_id bate com auth.users.id'
    ELSE '❌ user_id NÃO bate'
  END as verificacao_user_id
FROM public.organizers o
JOIN auth.users au ON au.id = o.user_id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 5. TESTE DE RLS - Simular query como se fosse o usuário autenticado
-- IMPORTANTE: Para testar RLS, você precisa estar autenticado na aplicação
-- Este teste mostra o que a query deveria retornar

-- Primeiro, vamos ver qual seria o resultado SEM RLS (desabilitando temporariamente)
-- NOTA: Não execute isso em produção, apenas para diagnóstico

-- 6. Verificar se há dados mas RLS está bloqueando
-- Execute esta query LOGADO na aplicação para ver se retorna dados:
-- SELECT * FROM public.organizers WHERE user_id = (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com');

-- 7. Verificar se o problema é com auth.uid() em contexto de função
SELECT 
  '=== TESTE AUTH.UID() ===' as info,
  auth.uid() as current_auth_uid,
  (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com') as expected_user_id,
  CASE 
    WHEN auth.uid() = (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com') THEN '✅ auth.uid() está correto'
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() está NULL (não autenticado no contexto SQL)'
    ELSE '⚠️ auth.uid() é diferente do esperado'
  END as status_auth_uid;

-- 8. Verificar se a política RLS permitiria acesso
SELECT 
  '=== TESTE DE POLÍTICA RLS ===' as info,
  o.id,
  o.user_id,
  o.company_name,
  auth.uid() as current_auth_uid,
  (o.user_id = auth.uid()) as policy_would_allow,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() é NULL - RLS vai bloquear'
    WHEN o.user_id = auth.uid() THEN '✅ Política permitiria acesso'
    ELSE '❌ user_id não bate com auth.uid() - RLS vai bloquear'
  END as resultado_esperado
FROM public.organizers o
WHERE o.user_id = (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com');



