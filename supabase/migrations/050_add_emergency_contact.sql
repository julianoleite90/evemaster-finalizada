-- Migration: Adicionar contato de emergência
-- Adiciona campos de contato de emergência nas tabelas users, athletes e saved_participant_profiles

-- 1. Adicionar campos na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 2. Adicionar campos na tabela athletes
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 3. Adicionar campos na tabela saved_participant_profiles
ALTER TABLE saved_participant_profiles 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Comentários para documentação
COMMENT ON COLUMN users.emergency_contact_name IS 'Nome do contato de emergência do usuário';
COMMENT ON COLUMN users.emergency_contact_phone IS 'Telefone do contato de emergência do usuário';
COMMENT ON COLUMN athletes.emergency_contact_name IS 'Nome do contato de emergência do atleta';
COMMENT ON COLUMN athletes.emergency_contact_phone IS 'Telefone do contato de emergência do atleta';
COMMENT ON COLUMN saved_participant_profiles.emergency_contact_name IS 'Nome do contato de emergência do perfil salvo';
COMMENT ON COLUMN saved_participant_profiles.emergency_contact_phone IS 'Telefone do contato de emergência do perfil salvo';

