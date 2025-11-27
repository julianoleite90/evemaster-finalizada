-- ============================================
-- SCRIPT: Restaurar tickets para quantidade 50
-- ============================================
-- Este script restaura TODOS os tickets de um evento para quantidade 50
-- 
-- INSTRUÇÕES:
-- 1. Execute primeiro: SELECT id, name, slug FROM public.events WHERE status = 'active';
-- 2. Copie o ID do evento desejado
-- 3. Substitua 'COLE_O_ID_AQUI' abaixo pelo ID copiado
-- 4. Execute este script

DO $$
DECLARE
  v_event_id TEXT := 'COLE_O_ID_AQUI'; -- ⚠️ COLE O ID DO EVENTO AQUI
  v_event_id_uuid UUID;
  v_tickets_updated INTEGER;
  v_event_name TEXT;
  v_ticket_category TEXT;
  v_ticket_quantity INTEGER;
BEGIN
  -- Verificar se o ID foi alterado
  IF v_event_id = 'COLE_O_ID_AQUI' THEN
    RAISE EXCEPTION '❌ ERRO: Você precisa colar o ID do evento no lugar de "COLE_O_ID_AQUI"!';
  END IF;

  -- Converter para UUID
  BEGIN
    v_event_id_uuid := v_event_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '❌ ERRO: ID inválido. Certifique-se de copiar o ID completo do evento.';
  END;

  -- Buscar nome do evento
  SELECT name INTO v_event_name
  FROM public.events
  WHERE id = v_event_id_uuid;

  IF v_event_name IS NULL THEN
    RAISE EXCEPTION '❌ Evento com ID % não encontrado', v_event_id_uuid;
  END IF;

  RAISE NOTICE '🔄 Restaurando tickets do evento: % (ID: %)', v_event_name, v_event_id_uuid;

  -- Restaurar todos os tickets para 50
  UPDATE public.tickets
  SET quantity = 50
  WHERE batch_id IN (
    SELECT id FROM public.ticket_batches WHERE event_id = v_event_id_uuid
  );

  GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Processo concluído!';
  RAISE NOTICE '   % tickets restaurados para quantidade 50', v_tickets_updated;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verificação - Tickets atualizados:';
  
  -- Mostrar resultado detalhado
  FOR v_ticket_category, v_ticket_quantity IN 
    SELECT 
      t.category as categoria,
      t.quantity as quantidade
    FROM public.tickets t
    INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
    WHERE tb.event_id = v_event_id_uuid
    ORDER BY t.category
  LOOP
    RAISE NOTICE '   - %: % ingressos disponíveis', v_ticket_category, v_ticket_quantity;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '📈 Estatísticas do evento:';
  
  -- Mostrar estatísticas
  DECLARE
    v_total_inscricoes INTEGER;
    v_total_tickets INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_inscricoes
    FROM public.registrations
    WHERE event_id = v_event_id_uuid;
    
    SELECT COUNT(*) INTO v_total_tickets
    FROM public.tickets t
    INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
    WHERE tb.event_id = v_event_id_uuid;
    
    RAISE NOTICE '   - Total de inscrições: %', v_total_inscricoes;
    RAISE NOTICE '   - Total de categorias de tickets: %', v_total_tickets;
  END;
END $$;

-- ============================================
-- VERIFICAÇÃO: Ver tickets após restauração
-- ============================================

/*
SELECT 
  e.name as "Evento",
  tb.name as "Lote",
  t.category as "Categoria",
  t.quantity as "Quantidade",
  (SELECT COUNT(*) FROM public.registrations WHERE ticket_id = t.id) as "Inscrições",
  (t.quantity - (SELECT COUNT(*) FROM public.registrations WHERE ticket_id = t.id)) as "Disponíveis"
FROM public.tickets t
INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
INNER JOIN public.events e ON tb.event_id = e.id
WHERE e.id = 'COLE_O_ID_AQUI'::uuid
ORDER BY tb.name, t.category;
*/

