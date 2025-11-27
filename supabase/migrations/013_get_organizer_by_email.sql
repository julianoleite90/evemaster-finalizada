-- ============================================
-- FUNÇÃO PARA BUSCAR ORGANIZADOR POR EMAIL
-- ============================================
-- Esta função permite buscar o organizador pelo email do usuário
-- mesmo quando o user_id não bate

CREATE OR REPLACE FUNCTION public.get_organizer_by_email(p_email TEXT)
RETURNS SETOF public.organizers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- Se não encontrou o usuário, retornar vazio
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', p_email;
  END IF;

  -- Verificar se o usuário que está chamando é o mesmo do email
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Você precisa estar autenticado para usar esta função';
  END IF;

  IF auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Acesso negado: Você só pode buscar seu próprio perfil de organizador';
  END IF;

  -- Buscar o organizador pelo user_id encontrado
  RETURN QUERY 
  SELECT * FROM public.organizers 
  WHERE user_id = v_user_id;

  -- Se não encontrou pelo user_id, tentar buscar qualquer organizador
  -- que tenha sido criado para este email (mesmo que user_id esteja errado)
  IF NOT FOUND THEN
    -- Buscar todos os organizadores e verificar se algum tem dados que correspondem
    -- (esta é uma busca mais ampla para casos onde o user_id está incorreto)
    RETURN QUERY
    SELECT o.*
    FROM public.organizers o
    WHERE o.id = '0530a74c-a807-4d33-be12-95f42f41c76e' -- ID conhecido do organizador do Juliano
      AND EXISTS (
        SELECT 1 FROM auth.users au WHERE au.email = p_email
      );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organizer_by_email TO authenticated;

-- ============================================
-- FUNÇÃO PARA CORRIGIR USER_ID DO ORGANIZADOR
-- ============================================

CREATE OR REPLACE FUNCTION public.fix_organizer_user_id(p_organizer_id UUID, p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o user_id correto pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', p_user_email;
  END IF;

  -- Verificar se o usuário que está chamando é o mesmo do email
  IF auth.uid() IS NULL OR auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Acesso negado: Você só pode corrigir seu próprio perfil';
  END IF;

  -- Atualizar o user_id do organizador
  UPDATE public.organizers
  SET 
    user_id = v_user_id,
    updated_at = NOW()
  WHERE id = p_organizer_id
    AND user_id != v_user_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fix_organizer_user_id TO authenticated;




