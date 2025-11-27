-- ============================================
-- SCRIPT: Limpar TODOS os inscritos e usuários (compradores)
-- ============================================
-- Este script deleta:
-- - Todas as inscrições (registrations)
-- - Todos os atletas (athletes)
-- - Todos os pagamentos (payments)
-- - Todos os usuários com role ATLETA (compradores)
-- 
-- ⚠️ ATENÇÃO: Este script deleta dados permanentemente!
-- ⚠️ Organizadores e Afiliados são MANTIDOS
-- 
-- Use com cuidado e sempre faça backup antes!

BEGIN;

-- 1. Deletar todos os pagamentos
DELETE FROM public.payments;

-- 2. Deletar todos os atletas
DELETE FROM public.athletes;

-- 3. Deletar todas as inscrições
DELETE FROM public.registrations;

-- 4. Deletar todos os usuários com role ATLETA (compradores)
-- Mantém organizadores, afiliados e admins
DELETE FROM public.users
WHERE role = 'ATLETA';

-- 5. (Opcional) Deletar do auth.users também
-- Descomente apenas se quiser deletar completamente do Supabase Auth
/*
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.users WHERE role = 'ATLETA'
);
*/

COMMIT;

-- ============================================
-- VERIFICAÇÃO: Ver o que foi deletado
-- ============================================

SELECT 
  'Registrations restantes' as tabela,
  COUNT(*) as total
FROM public.registrations
UNION ALL
SELECT 
  'Athletes restantes' as tabela,
  COUNT(*) as total
FROM public.athletes
UNION ALL
SELECT 
  'Payments restantes' as tabela,
  COUNT(*) as total
FROM public.payments
UNION ALL
SELECT 
  'Users ATLETA restantes' as tabela,
  COUNT(*) as total
FROM public.users
WHERE role = 'ATLETA'
UNION ALL
SELECT 
  'Organizadores (mantidos)' as tabela,
  COUNT(*) as total
FROM public.users
WHERE role = 'ORGANIZADOR'
UNION ALL
SELECT 
  'Afiliados (mantidos)' as tabela,
  COUNT(*) as total
FROM public.users
WHERE role = 'AFILIADO'
UNION ALL
SELECT 
  'Admins (mantidos)' as tabela,
  COUNT(*) as total
FROM public.users
WHERE role = 'ADMIN';

-- ============================================
-- BACKUP ANTES DE DELETAR (Recomendado)
-- ============================================
-- Execute antes de deletar para criar backup:

/*
-- Backup de registrations
CREATE TABLE public.registrations_backup_$(date +%Y%m%d) AS 
SELECT * FROM public.registrations;

-- Backup de athletes
CREATE TABLE public.athletes_backup_$(date +%Y%m%d) AS 
SELECT * FROM public.athletes;

-- Backup de payments
CREATE TABLE public.payments_backup_$(date +%Y%m%d) AS 
SELECT * FROM public.payments;

-- Backup de users ATLETA
CREATE TABLE public.users_atleta_backup_$(date +%Y%m%d) AS 
SELECT * FROM public.users WHERE role = 'ATLETA';
*/

