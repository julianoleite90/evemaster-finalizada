-- ============================================
-- FUNÇÃO MELHORADA PARA INSERIR USUÁRIO COM WAIT
-- ============================================
-- Esta função aguarda o usuário existir em auth.users antes de inserir
-- Substitui a função anterior (005)

DROP FUNCTION IF EXISTS public.insert_user_after_signup(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

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
DECLARE
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 20; -- 20 tentativas
  v_wait_interval INTERVAL := '100 milliseconds'; -- 100ms entre tentativas
BEGIN
  -- Tentar inserir até o usuário existir em auth.users
  LOOP
    BEGIN
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
      
      -- Se chegou aqui, o INSERT funcionou (ou já existe)
      EXIT;
      
    EXCEPTION
      WHEN foreign_key_violation THEN
        -- Usuário ainda não existe em auth.users, aguardar e tentar novamente
        v_attempts := v_attempts + 1;
        
        IF v_attempts >= v_max_attempts THEN
          RAISE EXCEPTION 'User with id % does not exist in auth.users after % attempts', p_user_id, v_max_attempts;
        END IF;
        
        -- Aguardar antes de tentar novamente
        PERFORM pg_sleep(EXTRACT(EPOCH FROM v_wait_interval));
        
    END;
  END LOOP;
END;
$$;

-- Permitir que usuários autenticados e anônimos executem esta função
GRANT EXECUTE ON FUNCTION public.insert_user_after_signup TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_user_after_signup TO anon;




