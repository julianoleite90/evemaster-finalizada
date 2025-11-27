-- ============================================
-- ATUALIZAR PERFIS DE ORGANIZADOR COM DADOS DOS METADADOS
-- ============================================
-- Esta migração cria uma função para atualizar perfis de organizador
-- existentes com dados que possam estar nos metadados do auth.users

CREATE OR REPLACE FUNCTION public.update_organizer_from_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_metadata JSONB;
  v_organizer_data JSONB;
BEGIN
  -- Obter o ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Obter metadados do auth.users
  SELECT raw_user_meta_data INTO v_user_metadata
  FROM auth.users
  WHERE id = v_user_id;

  -- Verificar se há dados de organizador nos metadados
  v_organizer_data := v_user_metadata->'organizer_data';

  -- Se não há dados de organizador nos metadados, não fazer nada
  IF v_organizer_data IS NULL THEN
    RETURN;
  END IF;

  -- Atualizar perfil de organizador com dados dos metadados
  -- Apenas atualiza campos que estão vazios (NULL ou string vazia)
  UPDATE public.organizers
  SET
    company_name = COALESCE(
      NULLIF(company_name, ''),
      NULLIF(company_name, 'Organizador'),
      v_organizer_data->>'company_name',
      company_name
    ),
    company_cnpj = COALESCE(
      NULLIF(company_cnpj, ''),
      v_organizer_data->>'company_cnpj',
      company_cnpj
    ),
    company_address = COALESCE(
      NULLIF(company_address, ''),
      v_organizer_data->>'company_address',
      company_address
    ),
    company_city = COALESCE(
      NULLIF(company_city, ''),
      v_organizer_data->>'company_city',
      company_city
    ),
    company_state = COALESCE(
      NULLIF(company_state, ''),
      v_organizer_data->>'company_state',
      company_state
    ),
    company_zip_code = COALESCE(
      NULLIF(company_zip_code, ''),
      v_organizer_data->>'company_zip_code',
      company_zip_code
    ),
    company_phone = COALESCE(
      NULLIF(company_phone, ''),
      v_organizer_data->>'company_phone',
      company_phone
    ),
    legal_responsible = COALESCE(
      NULLIF(legal_responsible, ''),
      NULLIF(legal_responsible, 'Organizador'),
      v_organizer_data->>'legal_responsible',
      legal_responsible
    ),
    state_registration = COALESCE(
      NULLIF(state_registration, ''),
      v_organizer_data->>'state_registration',
      state_registration
    ),
    bank_name = COALESCE(
      NULLIF(bank_name, ''),
      v_organizer_data->>'bank_name',
      bank_name
    ),
    agency = COALESCE(
      NULLIF(agency, ''),
      v_organizer_data->>'agency',
      agency
    ),
    account_number = COALESCE(
      NULLIF(account_number, ''),
      v_organizer_data->>'account_number',
      account_number
    ),
    account_type = COALESCE(
      NULLIF(account_type, ''),
      v_organizer_data->>'account_type',
      account_type
    ),
    account_holder_name = COALESCE(
      NULLIF(account_holder_name, ''),
      v_organizer_data->>'account_holder_name',
      account_holder_name
    ),
    account_cpf_cnpj = COALESCE(
      NULLIF(account_cpf_cnpj, ''),
      v_organizer_data->>'account_cpf_cnpj',
      account_cpf_cnpj
    ),
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = v_user_id 
      AND au.raw_user_meta_data->'organizer_data' IS NOT NULL
    );
END;
$$;

COMMENT ON FUNCTION public.update_organizer_from_metadata IS 
'Atualiza perfil de organizador com dados que possam estar nos metadados do auth.users';

-- Permitir que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION public.update_organizer_from_metadata TO authenticated;




