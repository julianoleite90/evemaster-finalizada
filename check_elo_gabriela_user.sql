-- ============================================
-- DIAGNÓSTICO RÁPIDO: elo.gabriela@gmail.com
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar se existe em auth.users (autenticação)
SELECT 
  '🔐 AUTH.USERS' as verificacao,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO - Pode causar erro de login!'
    ELSE '✅ Email confirmado'
  END as status
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- 2. Verificar se existe em public.users
SELECT 
  '👤 PUBLIC.USERS' as verificacao,
  id,
  email,
  full_name,
  role,
  is_active,
  CASE 
    WHEN is_active = false THEN '❌ USUÁRIO INATIVO - Precisa ativar!'
    ELSE '✅ Usuário ativo'
  END as status
FROM public.users
WHERE email = 'elo.gabriela@gmail.com';

-- 3. Verificar se é organizador principal
SELECT 
  '🏢 ORGANIZADOR PRINCIPAL' as verificacao,
  o.id as organizer_id,
  o.company_name,
  o.status,
  o.is_active,
  CASE 
    WHEN o.id IS NULL THEN '❌ NÃO é organizador principal (OK se for membro)'
    WHEN o.is_active = false THEN '❌ Organizador INATIVO'
    WHEN o.status != 'approved' THEN '❌ Organizador NÃO APROVADO'
    ELSE '✅ É organizador principal'
  END as status
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
WHERE u.email = 'elo.gabriela@gmail.com';

-- 4. Verificar membership em organization_users
SELECT 
  '👥 MEMBRO DE ORGANIZAÇÃO' as verificacao,
  ou.id,
  ou.organizer_id,
  o.company_name as organizador,
  ou.can_view,
  ou.can_edit,
  ou.can_create,
  ou.can_delete,
  ou.is_active,
  CASE 
    WHEN ou.id IS NULL THEN '❌ NÃO está vinculado a nenhuma organização!'
    WHEN ou.is_active = false THEN '❌ Vínculo INATIVO'
    WHEN ou.can_view = false THEN '❌ SEM PERMISSÃO DE VISUALIZAÇÃO'
    ELSE '✅ É membro ativo com permissões'
  END as status
FROM public.users u
LEFT JOIN public.organization_users ou ON ou.user_id = u.id AND ou.is_active = true
LEFT JOIN public.organizers o ON o.id = ou.organizer_id
WHERE u.email = 'elo.gabriela@gmail.com';

-- 5. RESUMO COMPLETO
SELECT 
  '📊 RESUMO' as verificacao,
  u.email,
  u.is_active as usuario_ativo,
  CASE WHEN o.id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as eh_organizador_principal,
  CASE WHEN ou.id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as eh_membro_organizacao,
  CASE 
    WHEN u.is_active = false THEN '❌ USUÁRIO INATIVO'
    WHEN ou.id IS NULL AND o.id IS NULL THEN '❌ SEM ACESSO - Não é organizador nem membro'
    WHEN ou.id IS NOT NULL AND ou.is_active = true AND ou.can_view = true THEN '✅ ACESSO OK'
    WHEN o.id IS NOT NULL AND o.is_active = true THEN '✅ ACESSO OK'
    ELSE '⚠️ VERIFICAR PERMISSÕES'
  END as status_final
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
LEFT JOIN public.organization_users ou ON ou.user_id = u.id AND ou.is_active = true
WHERE u.email = 'elo.gabriela@gmail.com';

-- ============================================
-- SCRIPTS DE CORREÇÃO (Execute se necessário)
-- ============================================

-- Se o usuário estiver inativo:
-- UPDATE public.users SET is_active = true WHERE email = 'elo.gabriela@gmail.com';

-- Se não estiver vinculado à organização FR RUNNING CLUB:
-- Primeiro, pegue o ID do organizador:
SELECT id, company_name FROM public.organizers WHERE company_name LIKE '%FR RUNNING%' OR company_name LIKE '%RUNNING CLUB%';

-- Depois, pegue o ID do usuário:
SELECT id, email FROM public.users WHERE email = 'elo.gabriela@gmail.com';

-- Então, insira o vínculo (substitua os IDs pelos valores acima):
-- INSERT INTO public.organization_users (organizer_id, user_id, can_view, can_edit, can_create, can_delete, is_active)
-- VALUES (
--   'ID_DO_ORGANIZADOR_AQUI',  -- Substitua pelo ID do organizador
--   'ID_DO_USUARIO_AQUI',      -- Substitua pelo ID do usuário
--   true,   -- can_view
--   false,  -- can_edit
--   false,  -- can_create
--   false,  -- can_delete
--   true    -- is_active
-- )
-- ON CONFLICT DO NOTHING;

-- Se o email não estiver confirmado, use o Supabase Dashboard:
-- Authentication > Users > Encontre o usuário > Resend confirmation email
-- OU use a Admin API para confirmar

