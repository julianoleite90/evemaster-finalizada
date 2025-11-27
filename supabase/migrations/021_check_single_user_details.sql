-- ============================================
-- DETALHES DO ÚNICO USUÁRIO CADASTRADO
-- ============================================
-- Este script mostra todos os detalhes do usuário existente

-- 1. Detalhes completos do usuário em auth.users
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at as data_criacao,
  updated_at as ultima_atualizacao,
  raw_user_meta_data->>'full_name' as nome_metadata,
  raw_user_meta_data as metadata_completo
FROM auth.users
ORDER BY created_at DESC;

-- 2. Detalhes completos do usuário em public.users
SELECT 
  id,
  email,
  full_name as nome_completo,
  phone as telefone,
  role as perfil,
  cpf,
  created_at as data_criacao,
  updated_at as ultima_atualizacao
FROM public.users
ORDER BY created_at DESC;

-- 3. Verificar se este usuário tem organizador associado
SELECT 
  u.id as user_id,
  u.email,
  u.full_name as nome_usuario,
  o.id as organizer_id,
  o.company_name as nome_empresa,
  o.legal_responsible as responsavel_legal,
  o.company_cnpj as cnpj,
  o.company_phone as telefone_empresa,
  o.user_id as organizer_user_id,
  CASE 
    WHEN u.id = o.user_id THEN '✅ CORRETO'
    ELSE '❌ DESALINHADO'
  END as status_associacao
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
ORDER BY u.email;

-- 4. Listar TODOS os organizadores (mesmo sem user_id)
SELECT 
  id as organizer_id,
  company_name as nome_empresa,
  legal_responsible as responsavel_legal,
  company_cnpj as cnpj,
  company_phone as telefone,
  user_id,
  CASE 
    WHEN user_id IS NULL THEN '⚠️ SEM USER_ID'
    ELSE '✅ COM USER_ID'
  END as status
FROM public.organizers
ORDER BY created_at DESC;

-- 5. Verificar qual email está associado ao organizador do Fabiano
SELECT 
  o.id as organizer_id,
  o.company_name as nome_empresa,
  o.legal_responsible as responsavel_legal,
  o.company_cnpj as cnpj,
  o.user_id as organizer_user_id,
  u.email as email_do_user_id,
  u.full_name as nome_do_user_id
FROM public.organizers o
LEFT JOIN public.users u ON u.id = o.user_id
WHERE o.id = '0530a74c-a807-4d33-be12-95f42f41c76e';
