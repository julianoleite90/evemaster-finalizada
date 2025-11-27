-- ============================================
-- SCRIPT: Deletar eventos específicos
-- ============================================
-- IDs dos eventos a serem deletados:
-- 9f4c8ca2-4683-487d-ae6a-d45398f6310b
-- 5982f458-09c8-4bdd-8374-1bccf33f915f
-- 99d12ad7-589a-485a-a7e4-a7d7b0a27d4a

DO $$
DECLARE
  v_event_ids UUID[] := ARRAY[
    '9f4c8ca2-4683-487d-ae6a-d45398f6310b'::uuid,
    '5982f458-09c8-4bdd-8374-1bccf33f915f'::uuid,
    '99d12ad7-589a-485a-a7e4-a7d7b0a27d4a'::uuid
  ];
  v_event_id UUID;
  v_event_name TEXT;
  v_registrations_count INTEGER;
  v_athletes_count INTEGER;
  v_payments_count INTEGER;
  v_tickets_count INTEGER;
BEGIN
  -- Verificar cada evento antes de deletar
  FOREACH v_event_id IN ARRAY v_event_ids
  LOOP
    -- Buscar nome do evento
    SELECT name INTO v_event_name
    FROM public.events
    WHERE id = v_event_id;

    IF v_event_name IS NULL THEN
      RAISE NOTICE '⚠️  Evento com ID % não encontrado', v_event_id;
      CONTINUE;
    END IF;

    RAISE NOTICE '📋 Processando evento: % (ID: %)', v_event_name, v_event_id;

    -- Contar registros antes de deletar
    SELECT COUNT(*) INTO v_registrations_count
    FROM public.registrations
    WHERE event_id = v_event_id;

    SELECT COUNT(*) INTO v_athletes_count
    FROM public.athletes
    WHERE registration_id IN (
      SELECT id FROM public.registrations WHERE event_id = v_event_id
    );

    SELECT COUNT(*) INTO v_payments_count
    FROM public.payments
    WHERE registration_id IN (
      SELECT id FROM public.registrations WHERE event_id = v_event_id
    );

    SELECT COUNT(*) INTO v_tickets_count
    FROM public.tickets
    WHERE batch_id IN (
      SELECT id FROM public.ticket_batches WHERE event_id = v_event_id
    );

    RAISE NOTICE '   📊 Registros encontrados:';
    RAISE NOTICE '      - Inscrições: %', v_registrations_count;
    RAISE NOTICE '      - Atletas: %', v_athletes_count;
    RAISE NOTICE '      - Pagamentos: %', v_payments_count;
    RAISE NOTICE '      - Ingressos: %', v_tickets_count;

    -- Deletar pagamentos
    DELETE FROM public.payments
    WHERE registration_id IN (
      SELECT id FROM public.registrations WHERE event_id = v_event_id
    );

    -- Deletar atletas
    DELETE FROM public.athletes
    WHERE registration_id IN (
      SELECT id FROM public.registrations WHERE event_id = v_event_id
    );

    -- Deletar inscrições
    DELETE FROM public.registrations
    WHERE event_id = v_event_id;

    -- Deletar tickets (através de ticket_batches)
    DELETE FROM public.tickets
    WHERE batch_id IN (
      SELECT id FROM public.ticket_batches WHERE event_id = v_event_id
    );

    -- Deletar ticket_batches
    DELETE FROM public.ticket_batches
    WHERE event_id = v_event_id;

    -- Deletar event_settings (se existir)
    DELETE FROM public.event_settings
    WHERE event_id = v_event_id;

    -- Deletar o evento
    DELETE FROM public.events
    WHERE id = v_event_id;

    RAISE NOTICE '   ✅ Evento "%" deletado com sucesso!', v_event_name;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Processo concluído!';
END $$;

-- Verificar se foram deletados
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todos os eventos foram deletados'
    ELSE '⚠️  Ainda existem eventos com esses IDs'
  END as resultado,
  COUNT(*) as eventos_restantes
FROM public.events
WHERE id IN (
  '9f4c8ca2-4683-487d-ae6a-d45398f6310b'::uuid,
  '5982f458-09c8-4bdd-8374-1bccf33f915f'::uuid,
  '99d12ad7-589a-485a-a7e4-a7d7b0a27d4a'::uuid
);

