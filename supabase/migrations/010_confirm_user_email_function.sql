-- ============================================
-- FUNÇÃO PARA CONFIRMAR EMAIL DO USUÁRIO MANUALMENTE
-- ============================================
-- Esta função permite confirmar o email de um usuário manualmente
-- Útil quando o serviço de email não está configurado

CREATE OR REPLACE FUNCTION public.confirm_user_email(p_user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', p_user_email;
  END IF;
  
  -- Atualizar o usuário para confirmar o email
  -- Nota: confirmed_at não pode ser atualizado diretamente, apenas email_confirmed_at
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;
END;
$$;

-- Permitir que usuários autenticados executem esta função
-- Em produção, você pode querer restringir isso apenas para admins
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email TO anon;

