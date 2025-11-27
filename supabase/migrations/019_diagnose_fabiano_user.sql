-- ============================================
-- DIAGNÓSTICO: BUSCAR USUÁRIO DO FABIANO
-- ============================================
-- Este script ajuda a encontrar o user_id correto do Fabiano

-- 1. Buscar em auth.users por email similar
SELECT 
  'auth.users' as tabela,
  id,
  email,
  raw_user_meta_data->>'full_name' as nome_metadata
FROM auth.users
WHERE email ILIKE '%fabiano%'
   OR email ILIKE '%braun%'
   OR raw_user_meta_data->>'full_name' ILIKE '%fabiano%'
   OR raw_user_meta_data->>'full_name' ILIKE '%braun%';

-- 2. Buscar em public.users por email ou nome
SELECT 
  'public.users' as tabela,
  id,
  email,
  full_name
FROM public.users
WHERE email ILIKE '%fabiano%'
   OR email ILIKE '%braun%'
   OR full_name ILIKE '%fabiano%'
   OR full_name ILIKE '%braun%';

-- 3. Verificar o organizador atual
SELECT 
  o.id as organizer_id,
  o.company_name,
  o.user_id as current_user_id,
  u.email as current_user_email,
  u.full_name as current_user_name,
  au.email as auth_user_email
FROM public.organizers o
LEFT JOIN public.users u ON u.id = o.user_id
LEFT JOIN auth.users au ON au.id = o.user_id
WHERE o.id = '0530a74c-a807-4d33-be12-95f42f41c76e';

-- 4. Listar todos os usuários com email contendo "fabiano" ou "braun"
SELECT 
  'TODOS' as origem,
  COALESCE(au.id, u.id) as user_id,
  COALESCE(au.email, u.email) as email,
  COALESCE(au.raw_user_meta_data->>'full_name', u.full_name) as nome
FROM auth.users au
FULL OUTER JOIN public.users u ON u.id = au.id
WHERE COALESCE(au.email, u.email) ILIKE '%fabiano%'
   OR COALESCE(au.email, u.email) ILIKE '%braun%'
   OR COALESCE(au.raw_user_meta_data->>'full_name', u.full_name) ILIKE '%fabiano%'
   OR COALESCE(au.raw_user_meta_data->>'full_name', u.full_name) ILIKE '%braun%';

