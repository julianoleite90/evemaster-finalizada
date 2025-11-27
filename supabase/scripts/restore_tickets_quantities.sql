-- ============================================
-- SCRIPT: Restaurar quantidades dos tickets após deletar inscrições
-- ============================================
-- Este script restaura as quantidades dos tickets para o valor original
-- quando as inscrições foram deletadas

-- IMPORTANTE: Antes de executar, substitua 'SEU_EVENT_ID_AQUI' pelo ID real do evento
-- Você pode encontrar o ID executando: SELECT id, name, slug FROM public.events WHERE status = 'active';

-- Para um evento específico (substitua o ID)
DO $$
DECLARE
  v_event_id UUID; -- Será definido abaixo
  v_ticket_id UUID;
  v_registrations_count INTEGER;
  v_current_quantity INTEGER;
  v_original_quantity INTEGER := 25; -- Quantidade original de cada ticket
  v_tickets_updated INTEGER := 0;
BEGIN
  -- ⚠️ ALTERE AQUI: Coloque o ID do evento entre as aspas
  v_event_id := 'SEU_EVENT_ID_AQUI'::uuid;
  
  -- Verificar se o ID foi alterado
  IF v_event_id = 'SEU_EVENT_ID_AQUI'::uuid THEN
    RAISE EXCEPTION '❌ ERRO: Você precisa substituir "SEU_EVENT_ID_AQUI" pelo ID real do evento!';
  END IF;
  
  -- Verificar se o evento existe
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = v_event_id) THEN
    RAISE EXCEPTION '❌ Evento com ID % não encontrado. Verifique se o ID está correto.', v_event_id;
  END IF;

  RAISE NOTICE '🔄 Restaurando quantidades dos tickets para o evento: %', v_event_id;

  -- Para cada ticket do evento, restaurar a quantidade
  FOR v_ticket_id IN 
    SELECT t.id 
    FROM public.tickets t
    INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
    WHERE tb.event_id = v_event_id
  LOOP
    -- Contar quantas inscrições existem para este ticket
    SELECT COUNT(*) INTO v_registrations_count
    FROM public.registrations
    WHERE ticket_id = v_ticket_id;

    -- Buscar quantidade atual
    SELECT quantity INTO v_current_quantity
    FROM public.tickets
    WHERE id = v_ticket_id;

    -- Calcular nova quantidade: original - inscrições atuais
    -- Se não houver inscrições, restaurar para o valor original
    IF v_registrations_count = 0 THEN
      UPDATE public.tickets
      SET quantity = v_original_quantity
      WHERE id = v_ticket_id;

      RAISE NOTICE '✅ Ticket %: Restaurado para % (sem inscrições)', v_ticket_id, v_original_quantity;
      v_tickets_updated := v_tickets_updated + 1;
    ELSE
      -- Se ainda há inscrições, calcular: original - inscrições atuais
      UPDATE public.tickets
      SET quantity = GREATEST(0, v_original_quantity - v_registrations_count)
      WHERE id = v_ticket_id;

      RAISE NOTICE '⚠️  Ticket %: Ajustado para % (tinha % inscrições)', 
        v_ticket_id, 
        GREATEST(0, v_original_quantity - v_registrations_count),
        v_registrations_count;
      v_tickets_updated := v_tickets_updated + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Processo concluído! % tickets atualizados', v_tickets_updated;
END $$;

-- ============================================
-- VERSÃO ALTERNATIVA: Restaurar todos os tickets para 25
-- ============================================
-- Use esta versão se quiser simplesmente resetar todos para 25

/*
DO $$
DECLARE
  v_event_id UUID := 'EVENT_ID_AQUI'::uuid; -- ALTERE AQUI
  v_tickets_updated INTEGER;
BEGIN
  UPDATE public.tickets
  SET quantity = 25
  WHERE batch_id IN (
    SELECT id FROM public.ticket_batches WHERE event_id = v_event_id
  );

  GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;
  
  RAISE NOTICE '✅ % tickets restaurados para 25', v_tickets_updated;
END $$;
*/

-- ============================================
-- VERIFICAÇÃO: Ver quantidades atuais dos tickets
-- ============================================

/*
SELECT 
  e.name as "Evento",
  tb.name as "Lote",
  t.category as "Categoria",
  t.quantity as "Quantidade Atual",
  (SELECT COUNT(*) FROM public.registrations WHERE ticket_id = t.id) as "Inscrições",
  (t.quantity + (SELECT COUNT(*) FROM public.registrations WHERE ticket_id = t.id)) as "Quantidade Original Estimada"
FROM public.tickets t
INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
INNER JOIN public.events e ON tb.event_id = e.id
WHERE e.id = 'EVENT_ID_AQUI'::uuid
ORDER BY tb.name, t.category;
*/

