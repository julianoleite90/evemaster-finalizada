-- ============================================
-- DIAGNÓSTICO COMPLETO DO PROBLEMA DO PERFIL
-- ============================================

-- 1. VERIFICAR TODOS OS USUÁRIOS COM EMAIL julianodesouzaleite@gmail.com
SELECT 
  '=== USUÁRIOS NO AUTH ===' as info,
  id as auth_user_id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as metadata_role,
  created_at
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

-- 2. VERIFICAR TODOS OS ORGANIZADORES E SEUS USER_IDS
SELECT 
  '=== TODOS OS ORGANIZADORES ===' as info,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  o.company_cnpj,
  o.bank_name,
  au.email as user_email,
  au.id as auth_user_id,
  CASE 
    WHEN o.user_id = au.id THEN '✅ IDs batem'
    ELSE '❌ IDs NÃO batem'
  END as status_match
FROM public.organizers o
LEFT JOIN auth.users au ON au.id = o.user_id
ORDER BY o.created_at DESC;

-- 3. VERIFICAR QUAL ORGANIZADOR TEM OS DADOS DO JULIANO
SELECT 
  '=== ORGANIZADOR COM DADOS DO JULIANO ===' as info,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  o.company_cnpj,
  o.company_address,
  o.bank_name,
  o.agency,
  o.account_number,
  au.email as user_email,
  au.id as auth_user_id_correto
FROM public.organizers o
LEFT JOIN auth.users au ON au.email = 'julianodesouzaleite@gmail.com'
WHERE o.id = '0530a74c-a807-4d33-be12-95f42f41c76e';

-- 4. VERIFICAR QUAL É O ID CORRETO DO USUÁRIO LOGADO
SELECT 
  '=== ID CORRETO DO USUÁRIO ===' as info,
  id as auth_user_id_correto,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- 5. COMPARAR: Qual deveria ser o user_id do organizador?
SELECT 
  '=== COMPARAÇÃO FINAL ===' as info,
  au.id as auth_user_id_que_deveria_estar_no_organizer,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id_atual,
  CASE 
    WHEN o.user_id = au.id THEN '✅ CORRETO - Não precisa corrigir'
    ELSE '❌ ERRADO - Precisa atualizar organizer.user_id para ' || au.id::text
  END as acao_necessaria
FROM auth.users au
CROSS JOIN public.organizers o
WHERE au.email = 'julianodesouzaleite@gmail.com'
  AND o.id = '0530a74c-a807-4d33-be12-95f42f41c76e';

-- 6. CORREÇÃO AUTOMÁTICA: Atualizar user_id do organizador
UPDATE public.organizers
SET 
  user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'julianodesouzaleite@gmail.com'
    ORDER BY created_at DESC
    LIMIT 1
  ),
  updated_at = NOW()
WHERE id = '0530a74c-a807-4d33-be12-95f42f41c76e'
RETURNING 
  id,
  user_id,
  company_name,
  company_cnpj,
  bank_name;

-- 7. VERIFICAR RESULTADO FINAL
SELECT 
  '=== RESULTADO APÓS CORREÇÃO ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  o.company_cnpj,
  o.company_address,
  o.bank_name,
  o.agency,
  o.account_number,
  CASE 
    WHEN o.user_id = au.id THEN '✅ CORRIGIDO - Agora deve funcionar!'
    ELSE '❌ Ainda não corrigido'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



