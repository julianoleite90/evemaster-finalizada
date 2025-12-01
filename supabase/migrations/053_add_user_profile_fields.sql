-- Adicionar campos de perfil na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Comentários
COMMENT ON COLUMN users.age IS 'Idade do usuário';
COMMENT ON COLUMN users.gender IS 'Gênero do usuário: masculino, feminino, outro, prefiro_nao_informar';

