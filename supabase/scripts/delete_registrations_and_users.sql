-- ============================================
-- SCRIPT PARA DELETAR INSCRIÇÕES E USUÁRIOS
-- ============================================
-- ATENÇÃO: Este script deleta dados permanentemente!
-- Use com cuidado e sempre faça backup antes.

-- ============================================
-- OPÇÃO 1: Deletar TODAS as inscrições e usuários relacionados
-- ============================================

-- 1. Deletar pagamentos vinculados às inscrições
DELETE FROM public.payments
WHERE registration_id IN (
  SELECT id FROM public.registrations
);

-- 2. Deletar atletas vinculados às inscrições
DELETE FROM public.athletes
WHERE registration_id IN (
  SELECT id FROM public.registrations
);

-- 3. Deletar todas as inscrições
DELETE FROM public.registrations;

-- 4. Deletar usuários que foram criados automaticamente (role ATLETA)
-- ATENÇÃO: Isso não deleta organizadores ou afiliados
DELETE FROM public.users
WHERE role = 'ATLETA';

-- 5. Deletar do auth.users (usuários de autenticação)
-- ATENÇÃO: Isso deleta permanentemente do Supabase Auth
-- Descomente apenas se tiver certeza:
/*
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.users WHERE role = 'ATLETA'
);
*/

-- ============================================
-- OPÇÃO 2: Deletar inscrições de um EVENTO específico
-- ============================================
-- Substitua 'EVENT_ID_AQUI' pelo ID do evento

/*
-- 1. Deletar pagamentos
DELETE FROM public.payments
WHERE registration_id IN (
  SELECT id FROM public.registrations
  WHERE event_id = 'EVENT_ID_AQUI'::uuid
);

-- 2. Deletar atletas
DELETE FROM public.athletes
WHERE registration_id IN (
  SELECT id FROM public.registrations
  WHERE event_id = 'EVENT_ID_AQUI'::uuid
);

-- 3. Deletar inscrições do evento
DELETE FROM public.registrations
WHERE event_id = 'EVENT_ID_AQUI'::uuid;
*/

-- ============================================
-- OPÇÃO 3: Deletar inscrições de um USUÁRIO específico
-- ============================================
-- Substitua 'USER_ID_AQUI' pelo ID do usuário

/*
-- 1. Deletar pagamentos
DELETE FROM public.payments
WHERE registration_id IN (
  SELECT id FROM public.registrations
  WHERE user_id = 'USER_ID_AQUI'::uuid
);

-- 2. Deletar atletas
DELETE FROM public.athletes
WHERE registration_id IN (
  SELECT id FROM public.registrations
  WHERE user_id = 'USER_ID_AQUI'::uuid
);

-- 3. Deletar inscrições do usuário
DELETE FROM public.registrations
WHERE user_id = 'USER_ID_AQUI'::uuid;

-- 4. Deletar o usuário (opcional)
DELETE FROM public.users
WHERE id = 'USER_ID_AQUI'::uuid;
*/

-- ============================================
-- OPÇÃO 4: Deletar apenas inscrições (manter usuários)
-- ============================================

/*
-- 1. Deletar pagamentos
DELETE FROM public.payments
WHERE registration_id IN (
  SELECT id FROM public.registrations
);

-- 2. Deletar atletas
DELETE FROM public.athletes
WHERE registration_id IN (
  SELECT id FROM public.registrations
);

-- 3. Deletar todas as inscrições
DELETE FROM public.registrations;

-- NOTA: Os usuários em public.users e auth.users serão mantidos
*/

-- ============================================
-- OPÇÃO 5: Deletar por EMAIL do usuário
-- ============================================
-- Substitua 'email@exemplo.com' pelo email do usuário

/*
-- 1. Buscar user_id pelo email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = 'email@exemplo.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário não encontrado';
    RETURN;
  END IF;

  -- Deletar pagamentos
  DELETE FROM public.payments
  WHERE registration_id IN (
    SELECT id FROM public.registrations
    WHERE user_id = v_user_id
  );

  -- Deletar atletas
  DELETE FROM public.athletes
  WHERE registration_id IN (
    SELECT id FROM public.registrations
    WHERE user_id = v_user_id
  );

  -- Deletar inscrições
  DELETE FROM public.registrations
  WHERE user_id = v_user_id;

  -- Deletar usuário (opcional)
  DELETE FROM public.users
  WHERE id = v_user_id;

  RAISE NOTICE 'Usuário e inscrições deletados com sucesso';
END $$;
*/

-- ============================================
-- VERIFICAÇÃO: Ver quantos registros serão deletados
-- ============================================
-- Execute antes de deletar para ver o impacto:

/*
SELECT 
  'Registrations' as tabela,
  COUNT(*) as total
FROM public.registrations
UNION ALL
SELECT 
  'Athletes' as tabela,
  COUNT(*) as total
FROM public.athletes
UNION ALL
SELECT 
  'Payments' as tabela,
  COUNT(*) as total
FROM public.payments
UNION ALL
SELECT 
  'Users (ATLETA)' as tabela,
  COUNT(*) as total
FROM public.users
WHERE role = 'ATLETA';
*/

-- ============================================
-- BACKUP ANTES DE DELETAR (Recomendado)
-- ============================================
-- Execute para criar backup antes de deletar:

/*
-- Backup de registrations
CREATE TABLE public.registrations_backup AS 
SELECT * FROM public.registrations;

-- Backup de athletes
CREATE TABLE public.athletes_backup AS 
SELECT * FROM public.athletes;

-- Backup de payments
CREATE TABLE public.payments_backup AS 
SELECT * FROM public.payments;

-- Backup de users
CREATE TABLE public.users_backup AS 
SELECT * FROM public.users WHERE role = 'ATLETA';
*/

-- ============================================
-- RESTAURAR DO BACKUP (se necessário)
-- ============================================

/*
-- Restaurar registrations
INSERT INTO public.registrations
SELECT * FROM public.registrations_backup;

-- Restaurar athletes
INSERT INTO public.athletes
SELECT * FROM public.athletes_backup;

-- Restaurar payments
INSERT INTO public.payments
SELECT * FROM public.payments_backup;

-- Restaurar users
INSERT INTO public.users
SELECT * FROM public.users_backup;
*/

