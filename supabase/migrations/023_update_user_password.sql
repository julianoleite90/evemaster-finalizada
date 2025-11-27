-- ============================================
-- ATUALIZAR SENHA DO USUÁRIO
-- ============================================
-- Este script atualiza a senha do usuário julianodesouzaleite@gmail.com
-- Senha nova: Password90!#%90

-- IMPORTANTE: Este script requer a extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Atualizar a senha do usuário
-- O Supabase usa bcrypt para hash de senhas
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
  -- Formato: $2a$10$salt + hash (60 caracteres no total)
  v_hashed_password := crypt(v_new_password, gen_salt('bf', 10));
  
  -- Atualizar a senha
  UPDATE auth.users
  SET 
    encrypted_password = v_hashed_password,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Senha atualizada com sucesso para o usuário: %', v_user_email;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- Verificar se a atualização foi bem-sucedida
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha,
  updated_at as ultima_atualizacao
FROM auth.users
WHERE email = 'julianodesouzaleite@gmail.com';

