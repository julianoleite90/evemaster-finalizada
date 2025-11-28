-- ============================================
-- MIGRATION: Atualizar funções de criação de perfil para status pending
-- ============================================
-- Atualiza as funções RPC para criar organizadores e afiliados com status 'pending'

-- Atualizar função create_organizer_profile
CREATE OR REPLACE FUNCTION public.create_organizer_profile(
  p_user_id UUID,
  p_company_name TEXT,
  p_company_cnpj TEXT,
  p_company_address TEXT,
  p_company_city TEXT,
  p_company_state TEXT,
  p_company_zip_code TEXT,
  p_company_phone TEXT,
  p_legal_responsible TEXT,
  p_state_registration TEXT,
  p_bank_name TEXT,
  p_agency TEXT,
  p_account_number TEXT,
  p_account_type TEXT,
  p_account_holder_name TEXT,
  p_account_cpf_cnpj TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir o perfil de organizador com status 'pending'
  INSERT INTO public.organizers (
    user_id,
    company_name,
    company_cnpj,
    company_address,
    company_city,
    company_state,
    company_zip_code,
    company_phone,
    legal_responsible,
    state_registration,
    bank_name,
    agency,
    account_number,
    account_type,
    account_holder_name,
    account_cpf_cnpj,
    status,
    is_active
  ) VALUES (
    p_user_id,
    p_company_name,
    NULLIF(p_company_cnpj, ''),
    p_company_address,
    p_company_city,
    p_company_state,
    p_company_zip_code,
    p_company_phone,
    p_legal_responsible,
    p_state_registration,
    p_bank_name,
    p_agency,
    p_account_number,
    p_account_type,
    p_account_holder_name,
    p_account_cpf_cnpj,
    'pending',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Atualizar função create_affiliate_profile
CREATE OR REPLACE FUNCTION public.create_affiliate_profile(
  p_user_id UUID,
  p_referral_code TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir o perfil de afiliado com status 'pending'
  INSERT INTO public.affiliates (
    user_id,
    referral_code,
    status,
    is_active
  ) VALUES (
    p_user_id,
    p_referral_code,
    'pending',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Atualizar função ensure_user_exists para também criar com status pending
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
  v_user_exists BOOLEAN;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Verificar se o usuário já existe em public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_user_id) INTO v_user_exists;
  
  -- Se já existe, não precisa fazer nada
  IF v_user_exists THEN
    RETURN;
  END IF;

  -- Obter email e metadata do auth.users
  SELECT email, raw_user_meta_data INTO v_user_email, v_user_metadata
  FROM auth.users
  WHERE id = v_user_id;

  -- Extrair role e cpf dos metadados se existirem
  v_role := COALESCE(v_user_metadata->>'role', 'ATLETA');
  v_cpf := v_user_metadata->>'cpf';
  
  -- Garantir que o role está em uppercase
  IF v_role IS NOT NULL THEN
    v_role := UPPER(v_role);
  END IF;

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

  -- Se o role é ORGANIZADOR, criar perfil de organizador com status 'pending'
  IF v_role = 'ORGANIZADOR' THEN
    INSERT INTO public.organizers (
      user_id,
      company_name,
      company_cnpj,
      company_address,
      company_city,
      company_state,
      company_zip_code,
      company_phone,
      legal_responsible,
      state_registration,
      bank_name,
      agency,
      account_number,
      account_type,
      account_holder_name,
      account_cpf_cnpj,
      status,
      is_active
    )
    SELECT 
      v_user_id,
      COALESCE(
        v_user_metadata->'organizer_data'->>'company_name',
        v_user_metadata->>'full_name',
        'Organizador'
      ),
      NULLIF(v_user_metadata->'organizer_data'->>'company_cnpj', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'company_address', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'company_city', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'company_state', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'company_zip_code', ''),
      COALESCE(
        NULLIF(v_user_metadata->'organizer_data'->>'company_phone', ''),
        v_user_metadata->>'phone',
        NULL
      ),
      COALESCE(
        v_user_metadata->'organizer_data'->>'legal_responsible',
        v_user_metadata->>'full_name',
        'Organizador'
      ),
      NULLIF(v_user_metadata->'organizer_data'->>'state_registration', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'bank_name', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'agency', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'account_number', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'account_type', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'account_holder_name', ''),
      NULLIF(v_user_metadata->'organizer_data'->>'account_cpf_cnpj', ''),
      'pending',
      false
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organizers WHERE user_id = v_user_id
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Se o role é AFILIADO, criar perfil de afiliado com status 'pending'
  IF v_role = 'AFILIADO' THEN
    INSERT INTO public.affiliates (
      user_id,
      referral_code,
      status,
      is_active
    )
    SELECT 
      v_user_id,
      COALESCE(
        v_user_metadata->>'referral_code',
        'AFF-' || UPPER(SUBSTRING(v_user_id::TEXT, 1, 8)) || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')
      ),
      'pending',
      false
    WHERE NOT EXISTS (
      SELECT 1 FROM public.affiliates WHERE user_id = v_user_id
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

