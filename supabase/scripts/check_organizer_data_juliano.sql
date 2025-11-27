-- ============================================
-- VERIFICAR DADOS DO ORGANIZADOR JULIANO
-- ============================================

-- Verificar TODOS os campos do perfil de organizador
SELECT 
  '=== DADOS COMPLETOS DO ORGANIZADOR ===' as info,
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
  o.updated_at,
  -- Verificar quais campos estão NULL ou vazios
  CASE 
    WHEN o.company_cnpj IS NULL OR o.company_cnpj = '' THEN '❌ CNPJ vazio'
    ELSE '✅ CNPJ preenchido'
  END as status_cnpj,
  CASE 
    WHEN o.company_address IS NULL OR o.company_address = '' THEN '❌ Endereço vazio'
    ELSE '✅ Endereço preenchido'
  END as status_endereco,
  CASE 
    WHEN o.bank_name IS NULL OR o.bank_name = '' THEN '❌ Banco vazio'
    ELSE '✅ Banco preenchido'
  END as status_banco,
  CASE 
    WHEN o.agency IS NULL OR o.agency = '' THEN '❌ Agência vazia'
    ELSE '✅ Agência preenchida'
  END as status_agencia,
  CASE 
    WHEN o.account_number IS NULL OR o.account_number = '' THEN '❌ Conta vazia'
    ELSE '✅ Conta preenchida'
  END as status_conta
FROM public.organizers o
JOIN auth.users au ON au.id = o.user_id
WHERE au.email = 'julianodesouzaleite@gmail.com';



