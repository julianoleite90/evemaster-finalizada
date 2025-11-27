-- ============================================
-- SCRIPT: Restaurar tickets para 25 - Night Run Costão do Santinho
-- ============================================
-- Evento: 1º Entrenamiento Internacional Night Run Costão do Santinho
-- ID: 74c98b92-2847-4aa3-ad8e-a673f9827a9e
-- Quantidade: 25 ingressos em cada categoria

DO $$
DECLARE
  v_event_id_uuid UUID := '74c98b92-2847-4aa3-ad8e-a673f9827a9e'::uuid;
  v_event_name TEXT;
  v_tickets_updated INTEGER;
  v_ticket_category TEXT;
  v_ticket_quantity INTEGER;
  v_total_inscricoes INTEGER;
  v_total_tickets INTEGER;
BEGIN
  -- Buscar nome do evento
  SELECT name INTO v_event_name
  FROM public.events
  WHERE id = v_event_id_uuid;

  IF v_event_name IS NULL THEN
    RAISE EXCEPTION '❌ Evento com ID % não encontrado', v_event_id_uuid;
  END IF;

  RAISE NOTICE '🔄 Restaurando tickets do evento: %', v_event_name;
  RAISE NOTICE '   ID: %', v_event_id_uuid;
  RAISE NOTICE '';

  -- Contar tickets antes
  SELECT COUNT(*) INTO v_total_tickets
  FROM public.tickets t
  INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
  WHERE tb.event_id = v_event_id_uuid;

  RAISE NOTICE '📊 Antes da restauração:';
  RAISE NOTICE '   - Total de categorias de tickets: %', v_total_tickets;

  -- Mostrar quantidades atuais
  RAISE NOTICE '   - Quantidades atuais:';
  FOR v_ticket_category, v_ticket_quantity IN 
    SELECT 
      t.category as categoria,
      t.quantity as quantidade
    FROM public.tickets t
    INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
    WHERE tb.event_id = v_event_id_uuid
    ORDER BY t.category
  LOOP
    RAISE NOTICE '      * %: % ingressos', v_ticket_category, v_ticket_quantity;
  END LOOP;

  -- Restaurar todos os tickets para 25
  UPDATE public.tickets
  SET quantity = 25
  WHERE batch_id IN (
    SELECT id FROM public.ticket_batches WHERE event_id = v_event_id_uuid
  );

  GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Processo concluído!';
  RAISE NOTICE '   % tickets restaurados para quantidade 25', v_tickets_updated;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Após a restauração:';
  
  -- Mostrar quantidades atualizadas
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
  
  -- Estatísticas
  SELECT COUNT(*) INTO v_total_inscricoes
  FROM public.registrations
  WHERE event_id = v_event_id_uuid;
  
  RAISE NOTICE '';
  RAISE NOTICE '📈 Estatísticas do evento:';
  RAISE NOTICE '   - Total de inscrições: %', v_total_inscricoes;
  RAISE NOTICE '   - Total de categorias de tickets: %', v_total_tickets;
END $$;

-- ============================================
-- VERIFICAÇÃO: Ver tickets após restauração
-- ============================================

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
WHERE e.id = '74c98b92-2847-4aa3-ad8e-a673f9827a9e'::uuid
ORDER BY tb.name, t.category;

