-- ============================================
-- SCRIPT SIMPLES: Restaurar tickets para 25 (versão fácil)
-- ============================================
-- Este script restaura TODOS os tickets de um evento para quantidade 25
-- 
-- INSTRUÇÕES:
-- 1. Execute primeiro: SELECT id, name FROM public.events WHERE status = 'active';
-- 2. Copie o ID do evento desejado
-- 3. Substitua 'COLE_O_ID_AQUI' abaixo pelo ID copiado
-- 4. Execute este script

DO $$
DECLARE
  v_event_id TEXT := 'COLE_O_ID_AQUI'; -- ⚠️ COLE O ID DO EVENTO AQUI
  v_event_id_uuid UUID;
  v_tickets_updated INTEGER;
  v_event_name TEXT;
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
  RAISE NOTICE '📊 Verificação:';
  
  -- Mostrar resultado
  FOR v_tickets_updated IN 
    SELECT 
      t.category as categoria,
      t.quantity as quantidade
    FROM public.tickets t
    INNER JOIN public.ticket_batches tb ON t.batch_id = tb.id
    WHERE tb.event_id = v_event_id_uuid
    ORDER BY t.category
  LOOP
    RAISE NOTICE '   - %: %', v_tickets_updated.categoria, v_tickets_updated.quantidade;
  END LOOP;
END $$;

