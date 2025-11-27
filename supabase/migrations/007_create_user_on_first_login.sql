-- ============================================
-- SOLUÇÃO CORRETA: Criar registro em users no primeiro login
-- ============================================
-- Esta função verifica se o usuário existe em public.users e cria se não existir
-- Deve ser chamada quando o usuário faz login pela primeira vez

CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_metadata JSONB;
  v_role TEXT;
  v_cpf TEXT;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Obter email e metadata do auth.users
  SELECT email, raw_user_meta_data INTO v_user_email, v_user_metadata
  FROM auth.users
  WHERE id = v_user_id;

  -- Extrair role e cpf dos metadados se existirem
  -- O role deve estar em uppercase nos metadados
  v_role := COALESCE(v_user_metadata->>'role', 'ATLETA');
  v_cpf := v_user_metadata->>'cpf';
  
  -- Debug: garantir que o role está em uppercase
  IF v_role IS NOT NULL THEN
    v_role := UPPER(v_role);
  END IF;

  -- Verificar se o usuário já existe em public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    -- Criar registro em public.users com dados do auth.users e metadados
    INSERT INTO public.users (
      id,
      email,
      full_name,
      phone,
      cpf,
      role
    ) VALUES (
      v_user_id,
      v_user_email,
      COALESCE(v_user_metadata->>'full_name', NULL),
      COALESCE(v_user_metadata->>'phone', NULL),
      NULLIF(v_cpf, ''),
      v_role::user_role
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Se já existe, atualizar com dados dos metadados se necessário
    UPDATE public.users
    SET 
      full_name = COALESCE(NULLIF(v_user_metadata->>'full_name', ''), full_name),
      phone = COALESCE(NULLIF(v_user_metadata->>'phone', ''), phone),
      cpf = COALESCE(NULLIF(v_cpf, ''), cpf),
      role = CASE 
        WHEN v_role IS NOT NULL AND v_role != '' THEN v_role::user_role 
        ELSE role 
      END,
      updated_at = NOW()
    WHERE id = v_user_id
    AND (
      full_name IS DISTINCT FROM COALESCE(v_user_metadata->>'full_name', NULL) OR
      phone IS DISTINCT FROM COALESCE(v_user_metadata->>'phone', NULL) OR
      cpf IS DISTINCT FROM NULLIF(v_cpf, '') OR
      role::TEXT IS DISTINCT FROM v_role
    );
  END IF;
END;
$$;

-- Permitir que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION public.ensure_user_exists TO authenticated;

