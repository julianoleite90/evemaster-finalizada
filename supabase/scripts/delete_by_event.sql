-- ============================================
-- SCRIPT: Deletar todas as inscrições de um EVENTO
-- ============================================
-- Substitua 'EVENT_ID_AQUI' pelo ID do evento

DO $$
DECLARE
  v_event_id UUID := 'EVENT_ID_AQUI'::uuid; -- ALTERE AQUI
  v_event_name TEXT;
  v_registrations_count INTEGER;
  v_athletes_count INTEGER;
  v_payments_count INTEGER;
BEGIN
  -- Buscar nome do evento
  SELECT name INTO v_event_name
  FROM public.events
  WHERE id = v_event_id;

  IF v_event_name IS NULL THEN
    RAISE NOTICE '❌ Evento com ID % não encontrado', v_event_id;
    RETURN;
  END IF;

  RAISE NOTICE '✅ Evento encontrado: % (ID: %)', v_event_name, v_event_id;

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

  RAISE NOTICE '📊 Registros encontrados:';
  RAISE NOTICE '   - Inscrições: %', v_registrations_count;
  RAISE NOTICE '   - Atletas: %', v_athletes_count;
  RAISE NOTICE '   - Pagamentos: %', v_payments_count;

  -- Deletar pagamentos
  DELETE FROM public.payments
  WHERE registration_id IN (
    SELECT id FROM public.registrations
    WHERE event_id = v_event_id
  );

  -- Deletar atletas
  DELETE FROM public.athletes
  WHERE registration_id IN (
    SELECT id FROM public.registrations
    WHERE event_id = v_event_id
  );

  -- Deletar inscrições
  DELETE FROM public.registrations
  WHERE event_id = v_event_id;

  RAISE NOTICE '✅ Todas as inscrições do evento foram deletadas com sucesso!';
  RAISE NOTICE '⚠️  NOTA: Os usuários foram mantidos. Use delete_by_email.sql para deletar usuários específicos.';
END $$;

