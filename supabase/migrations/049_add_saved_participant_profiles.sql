-- Migration: Adicionar tabela para salvar perfis de participantes
-- Permite que usuários salvem perfis de participantes para reutilizar em inscrições futuras

CREATE TABLE IF NOT EXISTS saved_participant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  country TEXT DEFAULT 'brasil',
  zip_code TEXT,
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  shirt_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cpf) -- Um CPF por usuário
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saved_participant_profiles_user_id ON saved_participant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_participant_profiles_cpf ON saved_participant_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_saved_participant_profiles_email ON saved_participant_profiles(email);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_saved_participant_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_update_saved_participant_profiles_updated_at
  BEFORE UPDATE ON saved_participant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_participant_profiles_updated_at();

-- RLS Policies
ALTER TABLE saved_participant_profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios perfis salvos
CREATE POLICY "Usuários podem ver seus próprios perfis salvos"
  ON saved_participant_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios perfis salvos
CREATE POLICY "Usuários podem criar seus próprios perfis salvos"
  ON saved_participant_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios perfis salvos
CREATE POLICY "Usuários podem atualizar seus próprios perfis salvos"
  ON saved_participant_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios perfis salvos
CREATE POLICY "Usuários podem deletar seus próprios perfis salvos"
  ON saved_participant_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tabela para códigos de login rápido
CREATE TABLE IF NOT EXISTS quick_login_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  cpf TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, code)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quick_login_codes_email ON quick_login_codes(email);
CREATE INDEX IF NOT EXISTS idx_quick_login_codes_cpf ON quick_login_codes(cpf);
CREATE INDEX IF NOT EXISTS idx_quick_login_codes_code ON quick_login_codes(code);
CREATE INDEX IF NOT EXISTS idx_quick_login_codes_expires_at ON quick_login_codes(expires_at);

-- Limpar códigos expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_login_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM quick_login_codes
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para códigos de login
ALTER TABLE quick_login_codes ENABLE ROW LEVEL SECURITY;

-- Política permissiva para criação de códigos (via API server-side)
CREATE POLICY "Permitir criação de códigos de login"
  ON quick_login_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política permissiva para leitura de códigos (via API server-side)
CREATE POLICY "Permitir leitura de códigos de login"
  ON quick_login_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para atualizar códigos (marcar como usado)
CREATE POLICY "Permitir atualização de códigos de login"
  ON quick_login_codes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

