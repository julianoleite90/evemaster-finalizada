-- ============================================
-- SCRIPT: Deletar usuários, contas e inscrições e restaurar ingressos
-- ============================================
-- Este script:
-- 1. Deleta todas as inscrições, atletas e pagamentos de usuários ATLETAS
-- 2. Deleta todos os usuários ATLETAS da tabela public.users
-- 3. Restaura as quantidades dos tickets para o valor original (25 por padrão)
--
-- ⚠️ ATENÇÃO: Este script é destrutivo e não pode ser revertido!
-- Execute apenas se tiver certeza de que deseja limpar todos os dados de compradores.

DO $$
DECLARE
  v_user_id UUID;
  v_users_to_delete CURSOR FOR
    SELECT id FROM public.users WHERE role = 'ATLETA';
  v_deleted_users_count INTEGER := 0;
  v_deleted_registrations_count INTEGER := 0;
  v_deleted_athletes_count INTEGER := 0;
  v_deleted_payments_count INTEGER := 0;
  v_tickets_restored_count INTEGER := 0;
  v_ticket_id UUID;
  v_original_quantity INTEGER := 25; -- Quantidade padrão para restaurar
  v_current_quantity INTEGER;
  v_registrations_count INTEGER;
BEGIN
  RAISE NOTICE '🚨 Iniciando limpeza de usuários, inscrições e restauração de ingressos...';
  RAISE NOTICE '';

  -- ============================================
  -- 1. DELETAR PAGAMENTOS, ATLETAS E INSCRIÇÕES
  -- ============================================
  RAISE NOTICE '📋 Passo 1: Deletando pagamentos, atletas e inscrições...';

  -- Deletar pagamentos vinculados a inscrições de usuários ATLETAS
  DELETE FROM public.payments
  WHERE registration_id IN (
    SELECT r.id FROM public.registrations r
    JOIN public.users u ON r.user_id = u.id
    WHERE u.role = 'ATLETA'
  );
  GET DIAGNOSTICS v_deleted_payments_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % pagamentos deletados.', v_deleted_payments_count;

  -- Deletar atletas vinculados a inscrições de usuários ATLETAS
  DELETE FROM public.athletes
  WHERE registration_id IN (
    SELECT r.id FROM public.registrations r
    JOIN public.users u ON r.user_id = u.id
    WHERE u.role = 'ATLETA'
  );
  GET DIAGNOSTICS v_deleted_athletes_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % atletas deletados.', v_deleted_athletes_count;

  -- Deletar inscrições de usuários ATLETAS
  DELETE FROM public.registrations
  WHERE user_id IN (
    SELECT id FROM public.users WHERE role = 'ATLETA'
  );
  GET DIAGNOSTICS v_deleted_registrations_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % inscrições deletadas.', v_deleted_registrations_count;

  RAISE NOTICE '';

  -- ============================================
  -- 2. DELETAR USUÁRIOS ATLETAS
  -- ============================================
  RAISE NOTICE '👥 Passo 2: Deletando usuários ATLETAS...';

  OPEN v_users_to_delete;
  LOOP
    FETCH v_users_to_delete INTO v_user_id;
    EXIT WHEN NOT FOUND;

    -- Deletar de public.users
    DELETE FROM public.users WHERE id = v_user_id;
    v_deleted_users_count := v_deleted_users_count + 1;

    -- Deletar de auth.users (Supabase Auth)
    -- ATENÇÃO: Esta operação requer privilégios de superusuário ou a chave service_role
    -- Se não tiver permissão, esta parte falhará silenciosamente
    BEGIN
      PERFORM auth.admin_delete_user(v_user_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  ⚠️  Não foi possível deletar usuário % de auth.users (pode precisar de service_role)', v_user_id;
    END;
  END LOOP;
  CLOSE v_users_to_delete;

  RAISE NOTICE '  ✅ % usuários ATLETAS deletados de public.users.', v_deleted_users_count;
  RAISE NOTICE '';

  -- ============================================
  -- 3. RESTAURAR QUANTIDADES DOS INGRESSOS
  -- ============================================
  RAISE NOTICE '🎫 Passo 3: Restaurando quantidades dos ingressos...';

  -- Para cada ticket, restaurar a quantidade original
  -- A quantidade será restaurada para 25 (ou você pode ajustar o valor)
  FOR v_ticket_id IN
    SELECT id FROM public.tickets
  LOOP
    -- Contar quantas inscrições existem para este ticket (deve ser 0 após a limpeza)
    SELECT COUNT(*) INTO v_registrations_count
    FROM public.registrations
    WHERE ticket_id = v_ticket_id;

    -- Buscar quantidade atual
    SELECT quantity INTO v_current_quantity
    FROM public.tickets
    WHERE id = v_ticket_id;

    -- Restaurar para quantidade original (25 por padrão)
    -- Se ainda houver inscrições (não deveria), calcular: original - inscrições
    IF v_registrations_count = 0 THEN
      UPDATE public.tickets
      SET quantity = v_original_quantity
      WHERE id = v_ticket_id;

      v_tickets_restored_count := v_tickets_restored_count + 1;
    ELSE
      -- Se ainda há inscrições, calcular: original - inscrições
      UPDATE public.tickets
      SET quantity = GREATEST(0, v_original_quantity - v_registrations_count)
      WHERE id = v_ticket_id;

      RAISE NOTICE '  ⚠️  Ticket %: Ajustado para % (tinha % inscrições restantes)',
        v_ticket_id,
        GREATEST(0, v_original_quantity - v_registrations_count),
        v_registrations_count;
      v_tickets_restored_count := v_tickets_restored_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '  ✅ % tickets restaurados para quantidade %', v_tickets_restored_count, v_original_quantity;
  RAISE NOTICE '';

  -- ============================================
  -- RESUMO FINAL
  -- ============================================
  RAISE NOTICE '🎉 Limpeza concluída!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo:';
  RAISE NOTICE '  - Pagamentos deletados: %', v_deleted_payments_count;
  RAISE NOTICE '  - Atletas deletados: %', v_deleted_athletes_count;
  RAISE NOTICE '  - Inscrições deletadas: %', v_deleted_registrations_count;
  RAISE NOTICE '  - Usuários ATLETAS deletados: %', v_deleted_users_count;
  RAISE NOTICE '  - Tickets restaurados: %', v_tickets_restored_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Organizadores e Afiliados foram mantidos.';
  RAISE NOTICE '⚠️  Todos os ingressos foram restaurados para quantidade %.', v_original_quantity;

END $$;

-- ============================================
-- VERIFICAÇÃO: Verificar estado após limpeza
-- ============================================

-- Contar usuários restantes
SELECT 
  role as "Role",
  COUNT(*) as "Quantidade"
FROM public.users
GROUP BY role
ORDER BY role;

-- Contar inscrições restantes
SELECT 
  COUNT(*) as "Total de Inscrições Restantes"
FROM public.registrations;

-- Verificar tickets restaurados
SELECT 
  e.name as "Evento",
  tb.name as "Lote",
  t.category as "Categoria",
  t.quantity as "Quantidade Disponível",
  (SELECT COUNT(*) FROM public.registrations WHERE ticket_id = t.id) as "Inscrições",
  (t.quantity - (SELECT COUNT(*) FROM public.registrations WHERE ticket_id = t.id)) as "Disponíveis"
FROM public.tickets t
INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
INNER JOIN public.events e ON tb.event_id = e.id
ORDER BY e.name, tb.name, t.category;

