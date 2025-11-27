-- ============================================
-- LIMPAR TODOS OS DADOS DE TESTE
-- ============================================
-- ATENÇÃO: Este script deleta TODOS os usuários e dados relacionados
-- Use apenas em ambiente de desenvolvimento/teste

-- 1. Deletar perfis de organizadores
DELETE FROM public.organizers;

-- 2. Deletar perfis de afiliados
DELETE FROM public.affiliates;

-- 3. Deletar registros em public.users
DELETE FROM public.users;

-- 4. Deletar usuários do auth (isso também deleta automaticamente os registros relacionados)
-- Nota: Isso vai deletar TODOS os usuários, incluindo admins se houver
DELETE FROM auth.users;

-- 5. Verificar se tudo foi deletado
SELECT 
  'Usuários em auth.users' as tabela,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'Usuários em public.users' as tabela,
  COUNT(*) as total
FROM public.users
UNION ALL
SELECT 
  'Organizadores' as tabela,
  COUNT(*) as total
FROM public.organizers
UNION ALL
SELECT 
  'Afiliados' as tabela,
  COUNT(*) as total
FROM public.affiliates;

-- Resultado esperado: todos devem retornar 0



