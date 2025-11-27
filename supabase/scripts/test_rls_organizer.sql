-- ============================================
-- TESTAR RLS PARA ORGANIZADOR
-- ============================================
-- Execute este script como o usuário autenticado para verificar
-- se as políticas RLS estão funcionando corretamente

-- 1. Verificar qual é o auth.uid() atual
SELECT 
  'auth.uid() atual' as info,
  auth.uid() as user_id;

-- 2. Verificar se existe perfil de organizador para este usuário
SELECT 
  'Perfil de organizador' as info,
  o.id,
  o.user_id,
  o.company_name,
  CASE 
    WHEN o.user_id = auth.uid() THEN '✅ user_id bate com auth.uid()'
    ELSE '❌ user_id NÃO bate com auth.uid()'
  END as verificacao
FROM public.organizers o
WHERE o.user_id = auth.uid();

-- 3. Tentar SELECT direto (deve funcionar se RLS estiver OK)
SELECT * FROM public.organizers WHERE user_id = auth.uid();

-- 4. Verificar se o usuário está em public.users
SELECT 
  'Usuário em public.users' as info,
  u.id,
  u.email,
  u.role,
  CASE 
    WHEN u.id = auth.uid() THEN '✅ ID bate com auth.uid()'
    ELSE '❌ ID NÃO bate com auth.uid()'
  END as verificacao
FROM public.users u
WHERE u.id = auth.uid();

-- 5. Verificar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organizers'
ORDER BY policyname;

-- 6. Verificar se RLS está habilitado na tabela
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'organizers';



