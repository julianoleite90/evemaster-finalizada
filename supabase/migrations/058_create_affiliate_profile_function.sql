-- Migration: Criar função RPC para criar perfil de afiliado
-- Date: 2025-12-03
-- Esta função é necessária para o formulário de registro criar perfis de afiliado

-- Função para criar perfil de afiliado (com SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION create_affiliate_profile(
  p_user_id UUID,
  p_referral_code TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
BEGIN
  -- Verificar se já existe
  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE user_id = p_user_id;
  
  IF v_affiliate_id IS NOT NULL THEN
    RETURN v_affiliate_id;
  END IF;
  
  -- Criar novo perfil de afiliado
  INSERT INTO affiliates (user_id, referral_code)
  VALUES (p_user_id, p_referral_code)
  RETURNING id INTO v_affiliate_id;
  
  -- Atualizar role do usuário para AFILIADO
  UPDATE users
  SET role = 'AFILIADO'
  WHERE id = p_user_id AND role != 'ORGANIZADOR';
  
  RETURN v_affiliate_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha
    RAISE WARNING 'Erro ao criar perfil de afiliado: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Conceder permissão para usuários autenticados executarem
GRANT EXECUTE ON FUNCTION create_affiliate_profile(UUID, TEXT) TO authenticated;

