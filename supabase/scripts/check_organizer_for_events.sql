-- ============================================
-- VERIFICAR ORGANIZADOR PARA CRIAÇÃO DE EVENTOS
-- ============================================

-- 1. Verificar se o organizador existe com o user_id correto
SELECT 
  '=== VERIFICAÇÃO DO ORGANIZADOR ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  CASE 
    WHEN o.id IS NULL THEN '❌ Organizador não existe'
    WHEN o.user_id != au.id THEN '❌ user_id incorreto - precisa corrigir'
    ELSE '✅ OK - Organizador configurado corretamente'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. Listar todos os organizadores
SELECT 
  '=== TODOS OS ORGANIZADORES ===' as info,
  o.id,
  o.user_id,
  o.company_name,
  au.email
FROM public.organizers o
LEFT JOIN auth.users au ON au.id = o.user_id;

-- 3. Se precisar corrigir, executar:
-- UPDATE public.organizers
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com')
-- WHERE id = '0530a74c-a807-4d33-be12-95f42f41c76e';



