-- ============================================
-- CONFIRMAR EMAIL E CONFIGURAR PERFIL JULIANO
-- ============================================

-- 1. Confirmar email do usuário
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND email_confirmed_at IS NULL;

-- 2. Verificar se o usuário existe e ver metadados
SELECT 
  '=== DADOS DO AUTH.USERS ===' as info,
  au.id,
  au.email,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'full_name' as nome,
  au.raw_user_meta_data->>'role' as role,
  au.raw_user_meta_data->'organizer_data' as dados_organizador,
  jsonb_pretty(au.raw_user_meta_data->'organizer_data') as dados_organizador_formatado
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 3. Garantir que o registro em public.users existe
INSERT INTO public.users (
  id,
  email,
  full_name,
  phone,
  cpf,
  role
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Organizador'),
  COALESCE(au.raw_user_meta_data->>'phone', NULL),
  NULLIF(au.raw_user_meta_data->>'cpf', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'ORGANIZADOR')::user_role
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  phone = COALESCE(EXCLUDED.phone, users.phone),
  cpf = COALESCE(EXCLUDED.cpf, users.cpf),
  role = COALESCE(EXCLUDED.role::user_role, users.role),
  updated_at = NOW();

-- 4. Criar ou atualizar perfil de organizador com dados dos metadados
-- Primeiro, vamos verificar se há dados nos metadados
DO $$
DECLARE
  v_user_id UUID;
  v_metadata JSONB;
  v_organizer_data JSONB;
BEGIN
  -- Buscar ID do usuário e metadados
  SELECT id, raw_user_meta_data INTO v_user_id, v_metadata
  FROM auth.users
  WHERE email = 'julianodesouzaleite@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Extrair dados do organizador dos metadados
  v_organizer_data := v_metadata->'organizer_data';

  -- Criar ou atualizar perfil de organizador
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
  )
  SELECT 
    v_user_id,
    -- Se tiver dados nos metadados, usar eles. Senão, usar dados básicos
    COALESCE(
      NULLIF(v_organizer_data->>'company_name', ''),
      v_metadata->>'full_name',
      'Organizador'
    ),
    NULLIF(v_organizer_data->>'company_cnpj', ''),
    NULLIF(v_organizer_data->>'company_address', ''),
    NULLIF(v_organizer_data->>'company_city', ''),
    NULLIF(v_organizer_data->>'company_state', ''),
    NULLIF(v_organizer_data->>'company_zip_code', ''),
    COALESCE(
      NULLIF(v_organizer_data->>'company_phone', ''),
      v_metadata->>'phone',
      NULL
    ),
    COALESCE(
      NULLIF(v_organizer_data->>'legal_responsible', ''),
      v_metadata->>'full_name',
      'Organizador'
    ),
    NULLIF(v_organizer_data->>'state_registration', ''),
    NULLIF(v_organizer_data->>'bank_name', ''),
    NULLIF(v_organizer_data->>'agency', ''),
    NULLIF(v_organizer_data->>'account_number', ''),
    NULLIF(v_organizer_data->>'account_type', ''),
    NULLIF(v_organizer_data->>'account_holder_name', ''),
    NULLIF(v_organizer_data->>'account_cpf_cnpj', '')
  ON CONFLICT (user_id) DO UPDATE
  SET
    -- Atualizar apenas campos que estão vazios ou são diferentes
    company_name = COALESCE(
      NULLIF(EXCLUDED.company_name, ''),
      NULLIF(EXCLUDED.company_name, 'Organizador'),
      organizers.company_name
    ),
    company_cnpj = COALESCE(
      NULLIF(EXCLUDED.company_cnpj, ''),
      organizers.company_cnpj
    ),
    company_address = COALESCE(
      NULLIF(EXCLUDED.company_address, ''),
      organizers.company_address
    ),
    company_city = COALESCE(
      NULLIF(EXCLUDED.company_city, ''),
      organizers.company_city
    ),
    company_state = COALESCE(
      NULLIF(EXCLUDED.company_state, ''),
      organizers.company_state
    ),
    company_zip_code = COALESCE(
      NULLIF(EXCLUDED.company_zip_code, ''),
      organizers.company_zip_code
    ),
    company_phone = COALESCE(
      NULLIF(EXCLUDED.company_phone, ''),
      organizers.company_phone
    ),
    legal_responsible = COALESCE(
      NULLIF(EXCLUDED.legal_responsible, ''),
      NULLIF(EXCLUDED.legal_responsible, 'Organizador'),
      organizers.legal_responsible
    ),
    state_registration = COALESCE(
      NULLIF(EXCLUDED.state_registration, ''),
      organizers.state_registration
    ),
    bank_name = COALESCE(
      NULLIF(EXCLUDED.bank_name, ''),
      organizers.bank_name
    ),
    agency = COALESCE(
      NULLIF(EXCLUDED.agency, ''),
      organizers.agency
    ),
    account_number = COALESCE(
      NULLIF(EXCLUDED.account_number, ''),
      organizers.account_number
    ),
    account_type = COALESCE(
      NULLIF(EXCLUDED.account_type, ''),
      organizers.account_type
    ),
    account_holder_name = COALESCE(
      NULLIF(EXCLUDED.account_holder_name, ''),
      organizers.account_holder_name
    ),
    account_cpf_cnpj = COALESCE(
      NULLIF(EXCLUDED.account_cpf_cnpj, ''),
      organizers.account_cpf_cnpj
    ),
    updated_at = NOW();
END $$;

-- 5. Verificar resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmado,
  u.id as user_id,
  u.role as user_role,
  u.full_name,
  o.id as organizer_id,
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
  CASE 
    WHEN o.id IS NOT NULL AND o.company_name IS NOT NULL AND o.company_name != 'Organizador' THEN '✅ PERFIL COMPLETO'
    WHEN o.id IS NOT NULL THEN '⚠️ PERFIL BÁSICO (faltam dados)'
    ELSE '❌ PERFIL NÃO CRIADO'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



