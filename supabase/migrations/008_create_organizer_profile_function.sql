-- ============================================
-- FUNÇÃO PARA CRIAR PERFIL DE ORGANIZADOR
-- ============================================
-- Esta função permite criar o perfil de organizador mesmo quando
-- a sessão ainda não está totalmente estabelecida após o signUp

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
  -- Inserir o perfil de organizador
  -- Se o registro em users não existir ainda, a foreign key vai falhar
  -- mas isso será tratado no código JavaScript
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
    account_cpf_cnpj
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
    p_account_cpf_cnpj
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Permitir que usuários autenticados e anônimos executem esta função
GRANT EXECUTE ON FUNCTION public.create_organizer_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organizer_profile TO anon;



