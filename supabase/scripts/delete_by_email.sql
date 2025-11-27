-- ============================================
-- SCRIPT: Deletar inscrições e usuário por EMAIL
-- ============================================
-- Substitua 'email@exemplo.com' pelo email desejado

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'email@exemplo.com'; -- ALTERE AQUI
  v_registrations_count INTEGER;
  v_athletes_count INTEGER;
  v_payments_count INTEGER;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuário com email % não encontrado', v_email;
    RETURN;
  END IF;

  RAISE NOTICE '✅ Usuário encontrado: % (ID: %)', v_email, v_user_id;

  -- Contar registros antes de deletar
  SELECT COUNT(*) INTO v_registrations_count
  FROM public.registrations
  WHERE user_id = v_user_id;

  SELECT COUNT(*) INTO v_athletes_count
  FROM public.athletes
  WHERE registration_id IN (
    SELECT id FROM public.registrations WHERE user_id = v_user_id
  );

  SELECT COUNT(*) INTO v_payments_count
  FROM public.payments
  WHERE registration_id IN (
    SELECT id FROM public.registrations WHERE user_id = v_user_id
  );

  RAISE NOTICE '📊 Registros encontrados:';
  RAISE NOTICE '   - Inscrições: %', v_registrations_count;
  RAISE NOTICE '   - Atletas: %', v_athletes_count;
  RAISE NOTICE '   - Pagamentos: %', v_payments_count;

  -- Deletar pagamentos
  DELETE FROM public.payments
  WHERE registration_id IN (
    SELECT id FROM public.registrations
    WHERE user_id = v_user_id
  );

  -- Deletar atletas
  DELETE FROM public.athletes
  WHERE registration_id IN (
    SELECT id FROM public.registrations
    WHERE user_id = v_user_id
  );

  -- Deletar inscrições
  DELETE FROM public.registrations
  WHERE user_id = v_user_id;

  -- Deletar usuário
  DELETE FROM public.users
  WHERE id = v_user_id;

  -- Deletar do auth.users (opcional - descomente se necessário)
  /*
  DELETE FROM auth.users
  WHERE id = v_user_id;
  */

  RAISE NOTICE '✅ Usuário e todos os dados relacionados foram deletados com sucesso!';
END $$;

