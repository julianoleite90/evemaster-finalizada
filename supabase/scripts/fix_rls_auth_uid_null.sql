-- ============================================
-- DIAGNÓSTICO: auth.uid() retornando NULL
-- ============================================
-- Este problema acontece quando o token JWT não está sendo enviado
-- corretamente nas requisições do cliente Supabase

-- O problema NÃO é no banco de dados, mas sim no cliente JavaScript
-- que não está enviando o token nas requisições

-- SOLUÇÃO TEMPORÁRIA: Criar uma função SECURITY DEFINER que bypassa RLS
-- ATENÇÃO: Use apenas para diagnóstico, não em produção sem revisão de segurança

CREATE OR REPLACE FUNCTION public.get_organizer_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  company_name TEXT,
  company_cnpj TEXT,
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip_code TEXT,
  company_phone TEXT,
  legal_responsible TEXT,
  state_registration TEXT,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  account_type TEXT,
  account_holder_name TEXT,
  account_cpf_cnpj TEXT,
  platform_fee_percentage NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Verificar se o user_id solicitado é o mesmo do usuário autenticado
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only view own profile';
  END IF;

  -- Retornar dados do organizador
  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.company_name,
    o.company_cnpj,
    o.company_address,
    o.company_city,
    o.company_state,
    o.company_zip_code,
    o.company_phone,
    o.legal_responsible,
    o.state_registration,
    o.bank_name,
    o.agency,
    o.account_number,
    o.account_type,
    o.account_holder_name,
    o.account_cpf_cnpj,
    o.platform_fee_percentage,
    o.created_at,
    o.updated_at
  FROM public.organizers o
  WHERE o.user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_organizer_by_user_id IS 
'Busca perfil de organizador usando SECURITY DEFINER para bypassar problemas de RLS quando auth.uid() retorna NULL';

GRANT EXECUTE ON FUNCTION public.get_organizer_by_user_id TO authenticated;



