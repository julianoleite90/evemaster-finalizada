-- ============================================
-- FUNÇÃO PARA CRIAR PERFIL DE AFILIADO
-- ============================================
-- Esta função permite criar o perfil de afiliado mesmo quando
-- a sessão ainda não está totalmente estabelecida após o signUp

CREATE OR REPLACE FUNCTION public.create_affiliate_profile(
  p_user_id UUID,
  p_referral_code TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir o perfil de afiliado
  -- Se o registro em users não existir ainda, a foreign key vai falhar
  -- mas isso será tratado no código JavaScript
  INSERT INTO public.affiliates (
    user_id,
    referral_code
  ) VALUES (
    p_user_id,
    p_referral_code
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Permitir que usuários autenticados e anônimos executem esta função
GRANT EXECUTE ON FUNCTION public.create_affiliate_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_affiliate_profile TO anon;




