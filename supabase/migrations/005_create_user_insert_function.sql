-- ============================================
-- FUNÇÃO PARA INSERIR USUÁRIO APÓS SIGNUP
-- ============================================
-- Esta função permite inserir um usuário na tabela users
-- mesmo quando a sessão ainda não está totalmente estabelecida
-- Ela é executada com privilégios de segurança definidor (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.insert_user_after_signup(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_cpf TEXT,
  p_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir o usuário. Se o usuário não existir em auth.users ainda,
  -- a foreign key constraint vai falhar e o erro será tratado no código JavaScript
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    cpf,
    role
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_phone,
    NULLIF(p_cpf, ''),
    p_role::user_role
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Permitir que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION public.insert_user_after_signup TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_user_after_signup TO anon;

