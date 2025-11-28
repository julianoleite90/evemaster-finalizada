-- ============================================
-- SCRIPT DE CORREÇÃO: elo.gabriela@gmail.com
-- ============================================
-- Este script corrige automaticamente:
-- 1. Cria registro em public.users se não existir
-- 2. Vincula à organização FR RUNNING CLUB
-- 3. Ativa o usuário e permissões
-- ============================================

-- ID do usuário encontrado
DO $$
DECLARE
  v_user_id UUID := 'b206eefd-4051-4788-8fee-04d3e243b92f';
  v_organizer_id UUID;
  v_user_exists BOOLEAN;
  v_org_user_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🔧 Iniciando correção para usuário: elo.gabriela@gmail.com';
  RAISE NOTICE '📋 User ID: %', v_user_id;

  -- 1. Verificar se existe em public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE NOTICE '⚠️ Usuário não existe em public.users. Criando...';
    
    -- Criar registro em public.users
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'elo.gabriela@gmail.com',
      'Elo Gabriela',
      'ORGANIZADOR',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      is_active = true,
      updated_at = NOW();
    
    RAISE NOTICE '✅ Registro criado em public.users';
  ELSE
    RAISE NOTICE '✅ Usuário já existe em public.users';
    
    -- Ativar o usuário se estiver inativo
    UPDATE public.users 
    SET is_active = true, updated_at = NOW()
    WHERE id = v_user_id AND is_active = false;
    
    IF FOUND THEN
      RAISE NOTICE '✅ Usuário ativado';
    END IF;
  END IF;

  -- 2. Buscar ID do organizador FR RUNNING CLUB
  SELECT id INTO v_organizer_id
  FROM public.organizers
  WHERE company_name ILIKE '%FR RUNNING%' 
     OR company_name ILIKE '%RUNNING CLUB%'
     OR company_name ILIKE '%FR RUNNING CLUB%'
  LIMIT 1;

  IF v_organizer_id IS NULL THEN
    RAISE NOTICE '❌ Organizador FR RUNNING CLUB não encontrado!';
    RAISE NOTICE '📋 Listando organizadores disponíveis:';
    
    -- Listar organizadores para referência
    FOR v_organizer_id IN 
      SELECT id FROM public.organizers ORDER BY company_name
    LOOP
      RAISE NOTICE '  - Organizador ID: %', v_organizer_id;
    END LOOP;
    
    RAISE EXCEPTION 'Organizador FR RUNNING CLUB não encontrado. Execute manualmente o INSERT em organization_users com o ID correto.';
  END IF;

  RAISE NOTICE '✅ Organizador encontrado: ID %', v_organizer_id;

  -- 3. Verificar se já está vinculado
  SELECT EXISTS(
    SELECT 1 FROM public.organization_users 
    WHERE user_id = v_user_id 
    AND organizer_id = v_organizer_id
  ) INTO v_org_user_exists;

  IF NOT v_org_user_exists THEN
    RAISE NOTICE '⚠️ Usuário não está vinculado à organização. Criando vínculo...';
    
    -- Criar vínculo em organization_users
    INSERT INTO public.organization_users (
      organizer_id,
      user_id,
      can_view,
      can_edit,
      can_create,
      can_delete,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_organizer_id,
      v_user_id,
      true,   -- can_view: Pode visualizar
      true,   -- can_edit: Pode editar
      false,  -- can_create: Não pode criar (ajuste conforme necessário)
      false,  -- can_delete: Não pode deletar (ajuste conforme necessário)
      true,   -- is_active: Ativo
      NOW(),
      NOW()
    )
    ON CONFLICT (organizer_id, user_id) DO UPDATE
    SET 
      can_view = true,
      is_active = true,
      updated_at = NOW();
    
    RAISE NOTICE '✅ Vínculo criado em organization_users';
  ELSE
    RAISE NOTICE '✅ Usuário já está vinculado à organização';
    
    -- Ativar e garantir permissões se já existir
    UPDATE public.organization_users
    SET 
      can_view = true,
      is_active = true,
      updated_at = NOW()
    WHERE user_id = v_user_id 
    AND organizer_id = v_organizer_id
    AND (is_active = false OR can_view = false);
    
    IF FOUND THEN
      RAISE NOTICE '✅ Vínculo ativado e permissões atualizadas';
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ CORREÇÃO CONCLUÍDA COM SUCESSO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Resumo:';
  RAISE NOTICE '  - Usuário: elo.gabriela@gmail.com';
  RAISE NOTICE '  - User ID: %', v_user_id;
  RAISE NOTICE '  - Organizador ID: %', v_organizer_id;
  RAISE NOTICE '  - Status: ATIVO com permissões de visualização e edição';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Agora o usuário pode fazer login!';

END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  '📊 VERIFICAÇÃO FINAL' as status,
  u.email,
  u.is_active as usuario_ativo,
  o.company_name as organizador,
  ou.can_view,
  ou.can_edit,
  ou.is_active as membro_ativo,
  CASE 
    WHEN u.is_active = true AND ou.is_active = true AND ou.can_view = true 
    THEN '✅ TUDO OK - Pode fazer login!'
    ELSE '❌ Ainda há problemas'
  END as status_final
FROM public.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id
LEFT JOIN public.organizers o ON o.id = ou.organizer_id
WHERE u.email = 'elo.gabriela@gmail.com';

