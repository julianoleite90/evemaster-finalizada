-- ============================================
-- QUERIES PARA VERIFICAR USUÁRIOS ORGANIZADORES
-- ============================================

-- 1. Verificar todos os usuários com role ORGANIZADOR na tabela users
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  CASE 
    WHEN o.id IS NOT NULL THEN 'SIM'
    ELSE 'NÃO'
  END as tem_perfil_organizador
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
WHERE u.role = 'ORGANIZADOR'
ORDER BY u.created_at DESC;

-- 2. Verificar todos os perfis de organizadores
SELECT 
  o.id as organizer_id,
  o.user_id,
  u.email,
  u.full_name,
  u.role as user_role,
  o.company_name,
  o.company_cnpj,
  o.created_at
FROM public.organizers o
LEFT JOIN public.users u ON u.id = o.user_id
ORDER BY o.created_at DESC;

-- 3. Verificar usuários que têm role ORGANIZADOR mas NÃO têm perfil
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  au.raw_user_meta_data->>'role' as role_metadata
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.role = 'ORGANIZADOR' 
  AND o.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Verificar usuários que têm perfil de organizador mas role diferente
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role as user_role,
  o.id as organizer_id,
  o.company_name,
  u.created_at
FROM public.organizers o
JOIN public.users u ON u.id = o.user_id
WHERE u.role != 'ORGANIZADOR'
ORDER BY u.created_at DESC;

-- 5. Verificar metadados do auth.users para usuários organizadores
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.raw_user_meta_data->>'full_name' as metadata_full_name,
  au.email_confirmed_at,
  u.role as db_role,
  CASE 
    WHEN o.id IS NOT NULL THEN 'SIM'
    ELSE 'NÃO'
  END as tem_perfil_organizador
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.raw_user_meta_data->>'role' = 'ORGANIZADOR'
   OR u.role = 'ORGANIZADOR'
   OR o.id IS NOT NULL
ORDER BY au.created_at DESC;

-- 6. Verificar usuário específico por email
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



