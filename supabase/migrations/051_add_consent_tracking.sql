-- Migration: Adicionar rastreamento de consentimento (termo de responsabilidade)
-- Adiciona campos para rastrear aceite do termo com IP, dispositivo e horário

-- Adicionar campos na tabela registrations
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS liability_waiver_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS liability_waiver_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS liability_waiver_ip INET,
ADD COLUMN IF NOT EXISTS liability_waiver_user_agent TEXT,
ADD COLUMN IF NOT EXISTS liability_waiver_device_type TEXT, -- mobile, desktop, tablet
ADD COLUMN IF NOT EXISTS liability_waiver_browser TEXT,
ADD COLUMN IF NOT EXISTS liability_waiver_os TEXT;

-- Comentários para documentação
COMMENT ON COLUMN registrations.liability_waiver_accepted IS 'Indica se o termo de responsabilidade foi aceito';
COMMENT ON COLUMN registrations.liability_waiver_timestamp IS 'Data e hora do aceite do termo';
COMMENT ON COLUMN registrations.liability_waiver_ip IS 'Endereço IP de onde o termo foi aceito';
COMMENT ON COLUMN registrations.liability_waiver_user_agent IS 'User agent completo do navegador';
COMMENT ON COLUMN registrations.liability_waiver_device_type IS 'Tipo de dispositivo (mobile, desktop, tablet)';
COMMENT ON COLUMN registrations.liability_waiver_browser IS 'Navegador utilizado';
COMMENT ON COLUMN registrations.liability_waiver_os IS 'Sistema operacional utilizado';

-- Índice para consultas por aceite
CREATE INDEX IF NOT EXISTS idx_registrations_liability_waiver_accepted ON registrations(liability_waiver_accepted);
CREATE INDEX IF NOT EXISTS idx_registrations_liability_waiver_timestamp ON registrations(liability_waiver_timestamp);

