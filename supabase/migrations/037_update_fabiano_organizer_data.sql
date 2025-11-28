-- ============================================
-- ATUALIZAR DADOS DO ORGANIZADOR FABIANO
-- ============================================
-- Atualiza o nome da empresa e email do organizador

-- Primeiro, encontrar o organizador pelo nome atual ou email
DO $$
DECLARE
  v_organizer_id UUID;
  v_user_id UUID;
BEGIN
  -- Encontrar o organizador pelo nome atual
  SELECT id, user_id INTO v_organizer_id, v_user_id
  FROM public.organizers
  WHERE company_name ILIKE '%FABIANO BRAUN DE MORAES%'
     OR company_name ILIKE '%FR RUNNING%'
  LIMIT 1;
  
  IF v_organizer_id IS NULL THEN
    RAISE NOTICE '⚠️ Organizador não encontrado. Verificando todos os organizadores...';
    -- Listar todos os organizadores para debug
    FOR v_organizer_id, v_user_id IN 
      SELECT id, user_id FROM public.organizers LIMIT 10
    LOOP
      RAISE NOTICE 'Organizador encontrado: ID=%, User ID=%', v_organizer_id, v_user_id;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ Organizador encontrado: ID=%, User ID=%', v_organizer_id, v_user_id;
    
    -- Atualizar nome da empresa
    UPDATE public.organizers
    SET 
      company_name = 'FR RUNNING CLUB',
      updated_at = NOW()
    WHERE id = v_organizer_id;
    
    RAISE NOTICE '✅ Nome da empresa atualizado para: FR RUNNING CLUB';
    
    -- Atualizar email do usuário relacionado
    IF v_user_id IS NOT NULL THEN
      UPDATE public.users
      SET 
        email = 'floriparunners@gmail.com',
        updated_at = NOW()
      WHERE id = v_user_id;
      
      RAISE NOTICE '✅ Email do usuário atualizado para: floriparunners@gmail.com';
    ELSE
      RAISE NOTICE '⚠️ User ID não encontrado, não foi possível atualizar o email';
    END IF;
  END IF;
END $$;

-- Verificar se a atualização foi bem-sucedida
SELECT 
  o.id as organizer_id,
  o.company_name,
  o.user_id,
  u.email as user_email,
  u.full_name as user_full_name
FROM public.organizers o
LEFT JOIN public.users u ON u.id = o.user_id
WHERE o.company_name ILIKE '%FR RUNNING%'
   OR u.email = 'floriparunners@gmail.com';

