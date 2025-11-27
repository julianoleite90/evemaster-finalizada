-- ============================================
-- LISTAR TODOS OS USUÁRIOS CADASTRADOS
-- ============================================
-- Este script lista todos os usuários do sistema
-- NOTA: Senhas são armazenadas como hash e não podem ser visualizadas por segurança

-- 1. Usuários em auth.users (tabela de autenticação do Supabase)
SELECT 
  'auth.users' as origem,
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at as data_criacao,
  updated_at as ultima_atualizacao,
  raw_user_meta_data->>'full_name' as nome_metadata,
  raw_user_meta_data as metadata_completo
FROM auth.users
ORDER BY created_at DESC;

-- 2. Usuários em public.users (tabela pública)
SELECT 
  'public.users' as origem,
  id,
  email,
  full_name as nome_completo,
  phone as telefone,
  created_at as data_criacao,
  updated_at as ultima_atualizacao
FROM public.users
ORDER BY created_at DESC;

-- 3. Comparação entre auth.users e public.users
SELECT 
  COALESCE(au.id, pu.id) as user_id,
  COALESCE(au.email, pu.email) as email,
  au.email IS NOT NULL as existe_em_auth,
  pu.id IS NOT NULL as existe_em_public,
  au.encrypted_password IS NOT NULL as tem_senha_auth,
  au.email_confirmed_at IS NOT NULL as email_confirmado,
  COALESCE(au.raw_user_meta_data->>'full_name', pu.full_name) as nome,
  pu.phone as telefone,
  COALESCE(au.created_at, pu.created_at) as data_criacao
FROM auth.users au
FULL OUTER JOIN public.users pu ON pu.id = au.id
ORDER BY COALESCE(au.created_at, pu.created_at) DESC;

-- 4. Usuários com organizador associado
SELECT 
  u.id as user_id,
  u.email,
  u.full_name as nome_usuario,
  o.id as organizer_id,
  o.company_name as nome_empresa,
  o.user_id as organizer_user_id,
  CASE 
    WHEN u.id = o.user_id THEN '✅ CORRETO'
    ELSE '❌ DESALINHADO'
  END as status_associacao
FROM public.users u
LEFT JOIN public.organizers o ON o.user_id = u.id
WHERE o.id IS NOT NULL
ORDER BY u.email;

-- 5. Usuários com afiliado associado
SELECT 
  u.id as user_id,
  u.email,
  u.full_name as nome_usuario,
  a.id as affiliate_id,
  a.referral_code as codigo_referencia,
  a.wallet_balance as saldo_carteira,
  a.total_earnings as ganhos_totais,
  a.user_id as affiliate_user_id,
  CASE 
    WHEN u.id = a.user_id THEN '✅ CORRETO'
    ELSE '❌ DESALINHADO'
  END as status_associacao
FROM public.users u
LEFT JOIN public.affiliates a ON a.user_id = u.id
WHERE a.id IS NOT NULL
ORDER BY u.email;

-- 6. Resumo: Total de usuários
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users WHERE encrypted_password IS NOT NULL) as usuarios_com_senha,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as emails_confirmados;

