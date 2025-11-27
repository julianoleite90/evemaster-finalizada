-- ============================================
-- CORRIGIR USER_ID DO ORGANIZADOR DO FABIANO
-- ============================================
-- Este script corrige o user_id do organizador FABIANO BRAUN DE MORAES
-- que está apontando para o usuário errado (julianodesouzaleite@gmail.com)
-- e deve apontar para o usuário correto (fabianobraun@gmail.com)

-- Primeiro, vamos verificar os dados atuais
DO $$
DECLARE
  v_organizer_id UUID := '0530a74c-a807-4d33-be12-95f42f41c76e';
  v_wrong_user_id UUID;
  v_correct_user_id UUID;
  v_organizer_name TEXT;
BEGIN
  -- Buscar dados do organizador
  SELECT user_id, company_name 
  INTO v_wrong_user_id, v_organizer_name
  FROM public.organizers 
  WHERE id = v_organizer_id;
  
  RAISE NOTICE 'Organizador encontrado: %', v_organizer_name;
  RAISE NOTICE 'User ID atual (ERRADO): %', v_wrong_user_id;
  
  -- Buscar o user_id correto pelo email do Fabiano
  -- Primeiro tentar em auth.users
  SELECT id INTO v_correct_user_id
  FROM auth.users
  WHERE email = 'fabianobraun@gmail.com'
  LIMIT 1;
  
  -- Se não encontrou em auth.users, tentar na tabela public.users
  IF v_correct_user_id IS NULL THEN
    SELECT id INTO v_correct_user_id
    FROM public.users
    WHERE email = 'fabianobraun@gmail.com'
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, buscar pelo nome do organizador
  IF v_correct_user_id IS NULL THEN
    SELECT u.id INTO v_correct_user_id
    FROM public.users u
    WHERE LOWER(u.full_name) LIKE '%fabiano%braun%moraes%'
       OR LOWER(u.full_name) LIKE '%fabiano braun%'
    LIMIT 1;
  END IF;
  
  IF v_correct_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário do Fabiano não encontrado. Verifique se o email está correto ou se o usuário existe no sistema.';
  END IF;
  
  RAISE NOTICE 'User ID correto encontrado: %', v_correct_user_id;
  
  -- Verificar se o user_id já está correto
  IF v_wrong_user_id = v_correct_user_id THEN
    RAISE NOTICE 'User ID já está correto. Nenhuma alteração necessária.';
  ELSE
    -- Atualizar o user_id do organizador
    UPDATE public.organizers
    SET user_id = v_correct_user_id,
        updated_at = NOW()
    WHERE id = v_organizer_id;
    
    RAISE NOTICE 'User ID atualizado com sucesso!';
    RAISE NOTICE 'De: %', v_wrong_user_id;
    RAISE NOTICE 'Para: %', v_correct_user_id;
  END IF;
END $$;

-- Verificar se a atualização foi bem-sucedida
SELECT 
  o.id as organizer_id,
  o.company_name,
  o.user_id,
  u.email as user_email,
  CASE 
    WHEN u.email = 'fabianobraun@gmail.com' THEN '✅ CORRETO'
    WHEN u.email = 'julianodesouzaleite@gmail.com' THEN '❌ ERRADO'
    ELSE '⚠️ OUTRO EMAIL'
  END as status
FROM public.organizers o
LEFT JOIN public.users u ON u.id = o.user_id
WHERE o.id = '0530a74c-a807-4d33-be12-95f42f41c76e';

