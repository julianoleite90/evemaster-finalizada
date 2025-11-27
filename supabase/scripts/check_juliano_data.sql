-- ============================================
-- VERIFICAR DADOS DO USUÁRIO JULIANO NO BANCO
-- ============================================

-- 1. Verificar dados em auth.users (metadados do cadastro)
SELECT 
  '=== AUTH.USERS ===' as tabela,
  au.id,
  au.email,
  au.raw_user_meta_data,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. Verificar dados em public.users
SELECT 
  '=== PUBLIC.USERS ===' as tabela,
  u.id,
  u.email,
  u.full_name,
  u.phone,
  u.cpf,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- 3. Verificar dados em public.organizers
SELECT 
  '=== PUBLIC.ORGANIZERS ===' as tabela,
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
  o.created_at,
  o.updated_at
FROM public.organizers o
JOIN auth.users au ON au.id = o.user_id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 4. Verificar se há dados nos metadados que podem ser recuperados
SELECT 
  '=== METADADOS PARA RECUPERAR ===' as info,
  au.raw_user_meta_data->>'full_name' as nome_completo,
  au.raw_user_meta_data->>'phone' as telefone,
  au.raw_user_meta_data->>'cpf' as cpf,
  au.raw_user_meta_data->>'razaoSocial' as razao_social,
  au.raw_user_meta_data->>'cnpj' as cnpj,
  au.raw_user_meta_data->>'endereco' as endereco,
  au.raw_user_meta_data->>'dadosBancarios' as dados_bancarios
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com';



