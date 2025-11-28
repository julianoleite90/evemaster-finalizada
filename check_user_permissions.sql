-- ============================================
-- SCRIPT DE VERIFICAÇÃO DE USUÁRIOS E PERMISSÕES
-- ============================================
-- Este script verifica:
-- 1. Se o usuário existe em auth.users
-- 2. Se existe em public.users
-- 3. Se está vinculado a organization_users
-- 4. Permissões e status
-- ============================================

-- 1. VERIFICAR USUÁRIO ESPECÍFICO (elo.gabriela@gmail.com)
-- ============================================
SELECT 
  '=== VERIFICAÇÃO DO USUÁRIO elo.gabriela@gmail.com ===' as info;

-- Verificar em auth.users (tabela de autenticação)
SELECT 
  '1. AUTH.USERS' as tabela,
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data->>'role' as role_metadata,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Email confirmado ✅'
    ELSE 'Email NÃO confirmado ❌'
  END as status_email
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- Verificar em public.users
SELECT 
  '2. PUBLIC.USERS' as tabela,
  id,
  email,
  full_name,
  role,
  is_active,
  phone,
  created_at,
  CASE 
    WHEN is_active = true THEN 'Usuário ATIVO ✅'
    ELSE 'Usuário INATIVO ❌'
  END as status_usuario
FROM public.users
WHERE email = 'elo.gabriela@gmail.com';

-- Verificar se é organizador principal
SELECT 
  '3. ORGANIZERS (Organizador Principal)' as tabela,
  o.id as organizer_id,
  o.company_name,
  o.status,
  o.is_active,
  o.user_id,
  CASE 
    WHEN o.is_active = true AND o.status = 'approved' THEN 'Organizador ATIVO e APROVADO ✅'
    WHEN o.is_active = false THEN 'Organizador INATIVO ❌'
    WHEN o.status != 'approved' THEN 'Organizador NÃO APROVADO ❌'
    ELSE 'Status desconhecido'
  END as status_organizador
FROM public.organizers o
JOIN public.users u ON u.id = o.user_id
WHERE u.email = 'elo.gabriela@gmail.com';

-- Verificar membership em organization_users
SELECT 
  '4. ORGANIZATION_USERS (Membro de Organização)' as tabela,
  ou.id,
  ou.organizer_id,
  ou.user_id,
  ou.can_view,
  ou.can_edit,
  ou.can_create,
  ou.can_delete,
  ou.is_active,
  o.company_name as organizador_nome,
  CASE 
    WHEN ou.is_active = true THEN 'Membro ATIVO ✅'
    ELSE 'Membro INATIVO ❌'
  END as status_membro,
  CASE 
    WHEN ou.can_view = true THEN 'Pode VISUALIZAR ✅'
    ELSE 'NÃO pode visualizar ❌'
  END as permissao_view
FROM public.organization_users ou
JOIN public.organizers o ON o.id = ou.organizer_id
JOIN public.users u ON u.id = ou.user_id
WHERE u.email = 'elo.gabriela@gmail.com';

-- ============================================
-- 2. LISTAR TODOS OS USUÁRIOS COM PERMISSÕES
-- ============================================
SELECT 
  '=== TODOS OS USUÁRIOS CADASTRADOS ===' as info;

-- Lista completa de usuários
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active as usuario_ativo,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id) 
    THEN 'SIM ✅' 
    ELSE 'NÃO ❌' 
  END as eh_organizador_principal,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.organization_users ou WHERE ou.user_id = u.id AND ou.is_active = true) 
    THEN 'SIM ✅' 
    ELSE 'NÃO ❌' 
  END as eh_membro_organizacao,
  (
    SELECT COUNT(*) 
    FROM public.organization_users ou2 
    WHERE ou2.user_id = u.id AND ou2.is_active = true
  ) as qtd_organizacoes_vinculadas,
  u.created_at
FROM public.users u
ORDER BY u.created_at DESC;

-- ============================================
-- 3. DETALHES DE MEMBROS DE ORGANIZAÇÃO
-- ============================================
SELECT 
  '=== MEMBROS DE ORGANIZAÇÃO COM PERMISSÕES ===' as info;

SELECT 
  u.email,
  u.full_name,
  o.company_name as organizador,
  ou.can_view,
  ou.can_edit,
  ou.can_create,
  ou.can_delete,
  ou.is_active,
  ou.created_at as vinculado_em
FROM public.organization_users ou
JOIN public.users u ON u.id = ou.user_id
JOIN public.organizers o ON o.id = ou.organizer_id
WHERE ou.is_active = true
ORDER BY o.company_name, u.email;

-- ============================================
-- 4. VERIFICAR PROBLEMAS COMUNS
-- ============================================
SELECT 
  '=== VERIFICAÇÃO DE PROBLEMAS ===' as info;

-- Usuários em public.users mas não em auth.users
SELECT 
  'Usuários em public.users mas NÃO em auth.users' as problema,
  u.id,
  u.email,
  u.full_name
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = u.id
);

-- Usuários em auth.users mas não em public.users
SELECT 
  'Usuários em auth.users mas NÃO em public.users' as problema,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
AND au.email LIKE '%@%'; -- Apenas emails válidos

-- Membros de organização sem usuário ativo
SELECT 
  'Membros de organização com usuário INATIVO' as problema,
  u.email,
  u.full_name,
  o.company_name as organizador,
  ou.is_active as membro_ativo,
  u.is_active as usuario_ativo
FROM public.organization_users ou
JOIN public.users u ON u.id = ou.user_id
JOIN public.organizers o ON o.id = ou.organizer_id
WHERE ou.is_active = true AND u.is_active = false;

-- ============================================
-- 5. SCRIPT PARA CORRIGIR PROBLEMAS (se necessário)
-- ============================================
SELECT 
  '=== SCRIPTS DE CORREÇÃO (Execute apenas se necessário) ===' as info;

-- Para ativar um usuário:
-- UPDATE public.users SET is_active = true WHERE email = 'elo.gabriela@gmail.com';

-- Para criar vínculo com organização (substitua os IDs):
-- INSERT INTO public.organization_users (organizer_id, user_id, can_view, can_edit, can_create, can_delete, is_active)
-- VALUES (
--   (SELECT id FROM public.organizers WHERE company_name = 'FR RUNNING CLUB'),
--   (SELECT id FROM public.users WHERE email = 'elo.gabriela@gmail.com'),
--   true,  -- can_view
--   false, -- can_edit
--   false, -- can_create
--   false, -- can_delete
--   true   -- is_active
-- );

-- Para confirmar email do usuário (via Supabase Dashboard ou Admin API):
-- Não é possível fazer via SQL direto, use o Supabase Dashboard ou Admin API

