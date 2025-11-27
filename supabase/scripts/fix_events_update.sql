-- Verificar políticas de RLS na tabela events
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
WHERE tablename = 'events';

-- Verificar se RLS está ativo
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'events';

-- Se RLS estiver ativo e causando problemas, desabilitar
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Verificar novamente
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'events';



