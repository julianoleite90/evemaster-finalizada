-- ============================================
-- CORRIGIR user_id DO ORGANIZADOR JULIANO
-- ============================================
-- O perfil de organizador tem user_id diferente do usuário logado
-- Este script corrige o user_id para o ID correto do usuário

-- 1. Verificar IDs atuais
SELECT 
  '=== ANTES DA CORREÇÃO ===' as info,
  au.id as auth_user_id_correto,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id_atual,
  o.company_name,
  CASE 
    WHEN o.user_id = au.id THEN '✅ IDs já batem'
    ELSE '❌ IDs NÃO batem - precisa corrigir'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. Verificar se há perfil com user_id diferente (outro usuário)
SELECT 
  '=== PERFIL COM USER_ID DIFERENTE ===' as info,
  o.id as organizer_id,
  o.user_id as user_id_atual_no_organizer,
  o.company_name,
  au_correta.id as user_id_que_deveria_ser,
  au_correta.email as email_correto
FROM public.organizers o
CROSS JOIN auth.users au_correta
WHERE au_correta.email = 'julianodesouzaleite@gmail.com'
  AND o.user_id != au_correta.id
  AND o.id = '0530a74c-a807-4d33-be12-95f42f41c76e'; -- ID do organizador que vimos

-- 3. CORRIGIR: Atualizar user_id do organizador para o ID correto
UPDATE public.organizers
SET 
  user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'julianodesouzaleite@gmail.com'
  ),
  updated_at = NOW()
WHERE id = '0530a74c-a807-4d33-be12-95f42f41c76e'
  AND user_id != (
    SELECT id FROM auth.users 
    WHERE email = 'julianodesouzaleite@gmail.com'
  );

-- 4. Verificar resultado
SELECT 
  '=== APÓS CORREÇÃO ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  o.company_cnpj,
  o.bank_name,
  CASE 
    WHEN o.user_id = au.id THEN '✅ CORRIGIDO - IDs agora batem!'
    ELSE '❌ Ainda não corrigido'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



