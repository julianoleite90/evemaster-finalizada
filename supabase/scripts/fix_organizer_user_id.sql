-- ============================================
-- CORRIGIR user_id DO ORGANIZADOR
-- ============================================
-- O perfil de organizador tem user_id diferente do usuário logado
-- Este script corrige o user_id para o ID correto do usuário

-- 1. Verificar qual é o user_id atual e qual deveria ser
SELECT 
  '=== VERIFICAÇÃO DE IDs ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id_atual,
  CASE 
    WHEN o.user_id = au.id THEN '✅ IDs batem'
    ELSE '❌ IDs NÃO batem - precisa corrigir'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. Verificar se há perfil com user_id diferente
SELECT 
  '=== PERFIL COM USER_ID DIFERENTE ===' as info,
  o.id as organizer_id,
  o.user_id as user_id_atual,
  o.company_name,
  au_correta.id as user_id_correto,
  au_correta.email as email_correto,
  au_errada.id as user_id_errado,
  au_errada.email as email_errado
FROM public.organizers o
JOIN auth.users au_correta ON au_correta.email = 'julianodesouzaleite@gmail.com'
LEFT JOIN auth.users au_errada ON au_errada.id = o.user_id
WHERE o.user_id != au_correta.id
  AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.email = 'julianodesouzaleite@gmail.com'
  );

-- 3. CORRIGIR: Atualizar user_id do organizador para o ID correto do usuário
UPDATE public.organizers
SET 
  user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'julianodesouzaleite@gmail.com'
  ),
  updated_at = NOW()
WHERE id = (
  SELECT o.id 
  FROM public.organizers o
  JOIN auth.users au ON au.email = 'julianodesouzaleite@gmail.com'
  WHERE o.user_id != au.id
  LIMIT 1
);

-- 4. Verificar resultado
SELECT 
  '=== RESULTADO APÓS CORREÇÃO ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  CASE 
    WHEN o.user_id = au.id THEN '✅ CORRIGIDO - IDs agora batem'
    ELSE '❌ Ainda não corrigido'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



