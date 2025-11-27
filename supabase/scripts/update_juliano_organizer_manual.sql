-- ============================================
-- ATUALIZAR DADOS DO ORGANIZADOR JULIANO MANUALMENTE
-- ============================================
-- Execute este script e preencha os dados que você lembra do cadastro
-- Substitua os valores abaixo pelos dados reais que você usou no cadastro

-- 1. Verificar dados atuais
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
  o.account_cpf_cnpj
FROM public.organizers o
JOIN auth.users au ON au.id = o.user_id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. ATUALIZAR COM OS DADOS DO SEU CADASTRO
-- Preencha os valores abaixo com os dados que você usou no cadastro
UPDATE public.organizers
SET
  -- Dados da Empresa (preencha com seus dados reais)
  company_name = 'SEU_NOME_DA_EMPRESA_AQUI',  -- Exemplo: "Corridas e Eventos LTDA"
  company_cnpj = 'SEU_CNPJ_AQUI',  -- Exemplo: "12345678000190" (apenas números)
  company_address = 'SEU_ENDERECO_AQUI',  -- Exemplo: "Av. Paulista, 1000"
  company_city = 'SUA_CIDADE_AQUI',  -- Exemplo: "São Paulo"
  company_state = 'SEU_ESTADO_AQUI',  -- Exemplo: "SP"
  company_zip_code = 'SEU_CEP_AQUI',  -- Exemplo: "01310100" (apenas números)
  company_phone = 'SEU_TELEFONE_AQUI',  -- Exemplo: "11987654321" (apenas números)
  legal_responsible = 'SEU_NOME_AQUI',  -- Exemplo: "João Silva"
  state_registration = 'SUA_INSCRICAO_ESTADUAL_AQUI',  -- Se tiver
  
  -- Dados Bancários (preencha com seus dados reais)
  bank_name = 'SEU_BANCO_AQUI',  -- Exemplo: "001 - Banco do Brasil"
  agency = 'SUA_AGENCIA_AQUI',  -- Exemplo: "1234-5"
  account_number = 'SUA_CONTA_AQUI',  -- Exemplo: "12345-6"
  account_type = 'SEU_TIPO_CONTA_AQUI',  -- "corrente" ou "poupanca"
  account_holder_name = 'NOME_DO_TITULAR_AQUI',  -- Exemplo: "Corridas e Eventos LTDA"
  account_cpf_cnpj = 'CPF_OU_CNPJ_TITULAR_AQUI',  -- Exemplo: "12345678000190" (apenas números)
  
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com'
);

-- 3. Verificar dados atualizados
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
  o.updated_at
FROM public.organizers o
JOIN auth.users au ON au.id = o.user_id
WHERE au.email = 'julianodesouzaleite@gmail.com';



