-- ============================================
-- SCRIPT RÁPIDO: Deletar TODOS os dados de teste
-- ============================================
-- Use este script para limpar tudo rapidamente
-- ATENÇÃO: Deleta permanentemente!

BEGIN;

-- 1. Deletar pagamentos
DELETE FROM public.payments;

-- 2. Deletar atletas
DELETE FROM public.athletes;

-- 3. Deletar inscrições
DELETE FROM public.registrations;

-- 4. Deletar usuários ATLETA (mantém organizadores e afiliados)
DELETE FROM public.users
WHERE role = 'ATLETA';

-- 5. Deletar do auth.users (usuários de autenticação)
-- ATENÇÃO: Descomente apenas se tiver certeza
-- Isso deleta permanentemente do Supabase Auth
/*
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.users WHERE role = 'ATLETA'
);
*/

COMMIT;

-- Verificar se deletou tudo
SELECT 
  'Registrations restantes' as info,
  COUNT(*) as total
FROM public.registrations
UNION ALL
SELECT 
  'Athletes restantes' as info,
  COUNT(*) as total
FROM public.athletes
UNION ALL
SELECT 
  'Payments restantes' as info,
  COUNT(*) as total
FROM public.payments
UNION ALL
SELECT 
  'Users ATLETA restantes' as info,
  COUNT(*) as total
FROM public.users
WHERE role = 'ATLETA';

