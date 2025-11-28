-- ============================================
-- CORRIGIR SENHA E STATUS DO ORGANIZADOR
-- ============================================
-- Este script:
-- 1. Atualiza a senha do usuário julianodesouzaleite@gmail.com
-- 2. Garante que o organizador está aprovado e ativo
-- 3. Garante que o usuário está ativo

-- IMPORTANTE: Este script requer a extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. ATUALIZAR SENHA
-- ============================================
DO $$
DECLARE
  v_user_email TEXT := 'julianodesouzaleite@gmail.com';
  v_new_password TEXT := 'Password90!#%90';
  v_user_id UUID;
  v_hashed_password TEXT;
BEGIN
  -- Encontrar o user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', v_user_email;
  END IF;
  
  -- Gerar hash bcrypt da senha
  -- O Supabase usa bcrypt com cost factor 10
  v_hashed_password := crypt(v_new_password, gen_salt('bf', 10));
  
  -- Atualizar a senha
  UPDATE auth.users
  SET 
    encrypted_password = v_hashed_password,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✓ Senha atualizada com sucesso para o usuário: %', v_user_email;
  RAISE NOTICE '  User ID: %', v_user_id;
END $$;

-- ============================================
-- 2. GARANTIR QUE O USUÁRIO ESTÁ ATIVO
-- ============================================
UPDATE public.users
SET 
  is_active = true,
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
  AND (is_active IS NULL OR is_active = false);

-- ============================================
-- 3. GARANTIR QUE O ORGANIZADOR ESTÁ APROVADO E ATIVO
-- ============================================
UPDATE public.organizers
SET 
  status = 'approved',
  is_active = true,
  approved_at = COALESCE(approved_at, NOW()),
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com'
)
AND (status != 'approved' OR is_active != true);

-- ============================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  '=== VERIFICAÇÃO DO USUÁRIO ===' as info;

SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  u.is_active as usuario_ativo,
  au.encrypted_password IS NOT NULL as tem_senha,
  au.updated_at as senha_atualizada_em
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.email = 'julianodesouzaleite@gmail.com';

SELECT 
  '=== VERIFICAÇÃO DO ORGANIZADOR ===' as info;

SELECT 
  o.id as organizer_id,
  o.company_name,
  o.status as status_aprovacao,
  o.is_active as organizador_ativo,
  o.approved_at,
  o.platform_fee_percentage,
  o.payment_term_days,
  o.barte_seller_id,
  u.email as user_email
FROM public.organizers o
JOIN public.users u ON u.id = o.user_id
WHERE u.email = 'julianodesouzaleite@gmail.com';

-- ============================================
-- 5. CRIAR FUNÇÃO DE PROTEÇÃO (OPCIONAL)
-- ============================================
-- Esta função garante que o organizador específico não seja desativado
-- Pode ser removida se não for necessária
CREATE OR REPLACE FUNCTION public.protect_juliano_organizer()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tentar desativar o organizador do Juliano, manter ativo
  IF NEW.user_id IN (
    SELECT id FROM auth.users WHERE email = 'julianodesouzaleite@gmail.com'
  ) THEN
    IF NEW.is_active = false AND OLD.is_active = true THEN
      RAISE WARNING 'Tentativa de desativar organizador do Juliano - mantendo ativo';
      NEW.is_active := true;
    END IF;
    
    IF NEW.status != 'approved' AND OLD.status = 'approved' THEN
      RAISE WARNING 'Tentativa de alterar status do organizador do Juliano - mantendo aprovado';
      NEW.status := 'approved';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para proteger o organizador
DROP TRIGGER IF EXISTS trigger_protect_juliano_organizer ON public.organizers;
CREATE TRIGGER trigger_protect_juliano_organizer
  BEFORE UPDATE ON public.organizers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_juliano_organizer();

-- ============================================
-- RESUMO
-- ============================================
SELECT 
  '=== RESUMO ===' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u
      JOIN auth.users au ON au.id = u.id
      WHERE u.email = 'julianodesouzaleite@gmail.com'
      AND u.is_active = true
      AND au.encrypted_password IS NOT NULL
    ) THEN '✓ Usuário OK'
    ELSE '✗ Usuário com problemas'
  END as status_usuario,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.organizers o
      JOIN public.users u ON u.id = o.user_id
      WHERE u.email = 'julianodesouzaleite@gmail.com'
      AND o.status = 'approved'
      AND o.is_active = true
    ) THEN '✓ Organizador OK'
    ELSE '✗ Organizador com problemas'
  END as status_organizador,
  '✓ Trigger de proteção criado' as protecao;

