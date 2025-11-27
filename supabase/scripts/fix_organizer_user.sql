-- ============================================
-- SCRIPT PARA CORRIGIR USUÁRIO ORGANIZADOR
-- ============================================
-- Este script corrige o usuário julianodesouzaleite@gmail.com
-- que foi cadastrado como organizador mas não tem registro em users

-- 1. Verificar metadados completos do auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 2. Criar registro em public.users com role ORGANIZADOR
-- (Execute apenas se o registro não existir)
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
  au.raw_user_meta_data->>'phone',
  NULLIF(au.raw_user_meta_data->>'cpf', ''),
  'ORGANIZADOR'::user_role
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET 
  role = 'ORGANIZADOR'::user_role,
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  phone = COALESCE(EXCLUDED.phone, users.phone);

-- 3. Atualizar metadados do auth.users para incluir role
-- (Isso garante que o role esteja nos metadados também)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', 'ORGANIZADOR',
    'full_name', COALESCE(raw_user_meta_data->>'full_name', 'Organizador'),
    'phone', raw_user_meta_data->>'phone',
    'cpf', raw_user_meta_data->>'cpf'
  )
WHERE email = 'julianodesouzaleite@gmail.com'
  AND (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'ORGANIZADOR');

-- 4. Criar perfil de organizador básico
-- (Execute apenas se o perfil não existir)
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
  u.id,
  COALESCE(u.full_name, 'Organizador'),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  u.phone,
  COALESCE(u.full_name, 'Organizador'),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM public.users u
WHERE u.email = 'julianodesouzaleite@gmail.com'
  AND u.role = 'ORGANIZADOR'
  AND NOT EXISTS (
    SELECT 1 FROM public.organizers o WHERE o.user_id = u.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- 5. Verificar resultado final
SELECT 
  au.id as auth_id,
  au.email,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.email_confirmed_at,
  u.id as user_id,
  u.role as db_role,
  u.full_name,
  o.id as organizer_id,
  o.company_name
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



