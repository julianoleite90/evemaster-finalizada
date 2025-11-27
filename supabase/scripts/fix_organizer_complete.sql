-- ============================================
-- CORREÇÃO COMPLETA DO ORGANIZADOR
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar estado atual
SELECT 
  '=== ESTADO ATUAL ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  CASE 
    WHEN o.user_id = au.id THEN '✅ IDs batem'
    ELSE '❌ IDs NÃO batem'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. Verificar se existe organizador com user_id diferente
SELECT 
  '=== ORGANIZADOR COM USER_ID DIFERENTE ===' as info,
  o.id,
  o.user_id,
  o.company_name,
  (SELECT email FROM auth.users WHERE id = o.user_id) as email_atual,
  (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com') as user_id_correto
FROM public.organizers o
WHERE o.id = '0530a74c-a807-4d33-be12-95f42f41c76e';

-- 3. CORREÇÃO: Atualizar user_id do organizador
UPDATE public.organizers
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com'),
  updated_at = NOW()
WHERE id = '0530a74c-a807-4d33-be12-95f42f41c76e';

-- 4. Verificar resultado
SELECT 
  '=== APÓS CORREÇÃO ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  CASE 
    WHEN o.user_id = au.id THEN '✅ CORRIGIDO!'
    ELSE '❌ Ainda incorreto'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



