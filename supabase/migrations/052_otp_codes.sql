-- Migration: Tabela para códigos OTP de login
-- Armazena códigos temporários para login via email

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

-- RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode acessar (via API)
CREATE POLICY "Service role only" ON otp_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Função para limpar códigos expirados (executar via cron ou manualmente)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

