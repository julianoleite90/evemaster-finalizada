-- ============================================
-- EVEMASTER - Schema Inicial do Banco de Dados
-- ============================================
-- Este arquivo contém todas as tabelas necessárias para o funcionamento
-- completo da plataforma de ingressos para eventos esportivos

-- ============================================
-- EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto

-- ============================================
-- ENUMS
-- ============================================

-- Tipos de usuário/roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'ORGANIZADOR', 'AFILIADO', 'ATLETA');

-- Status de eventos
CREATE TYPE event_status AS ENUM ('draft', 'active', 'finished', 'cancelled');

-- Status de pagamento
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

-- Métodos de pagamento
CREATE TYPE payment_method AS ENUM ('pix', 'credit_card', 'boleto');

-- Status de inscrição
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'transferred');

-- Gênero
CREATE TYPE gender AS ENUM ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar');

-- Tamanhos de camiseta
CREATE TYPE shirt_size AS ENUM ('PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG');

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Usuários (estendendo auth.users do Supabase)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  cpf TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'ATLETA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfis de Organizadores
CREATE TABLE public.organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_cnpj TEXT UNIQUE,
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip_code TEXT,
  company_phone TEXT,
  legal_responsible TEXT,
  state_registration TEXT,
  bank_name TEXT,
  bank_code TEXT,
  agency TEXT,
  account_number TEXT,
  account_type TEXT, -- 'corrente' ou 'poupanca'
  account_holder_name TEXT,
  account_cpf_cnpj TEXT,
  platform_fee_percentage DECIMAL(5,2) DEFAULT 10.00,
  assume_platform_fee BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT, -- HTML formatado
  category TEXT NOT NULL, -- 'corrida', 'ciclismo', etc.
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  banner_url TEXT, -- URL da imagem do banner
  gpx_file_url TEXT, -- URL do arquivo GPX do Strava
  distances TEXT[], -- Array de distâncias ['5km', '10km', etc.]
  custom_distances TEXT[], -- Array de distâncias customizadas
  status event_status DEFAULT 'draft',
  total_capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lotes de Ingressos
CREATE TABLE public.ticket_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  total_quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingressos/Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES public.ticket_batches(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- '5km', '10km', etc.
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 0,
  has_kit BOOLEAN DEFAULT false,
  kit_items TEXT[], -- ['camiseta', 'medalha', etc.]
  shirt_sizes shirt_size[], -- Tamanhos disponíveis
  shirt_quantities JSONB, -- { "M": 10, "G": 20, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inscrições
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT UNIQUE NOT NULL, -- INS-2024-001
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registration_date DATE NOT NULL,
  registration_time TIME NOT NULL,
  status registration_status DEFAULT 'pending',
  shirt_size shirt_size,
  has_kit BOOLEAN DEFAULT false,
  has_insurance BOOLEAN DEFAULT false,
  liability_waiver_accepted BOOLEAN DEFAULT false,
  liability_waiver_ip TEXT,
  liability_waiver_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados do Atleta (pode ser diferente do usuário principal)
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender gender,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  processing_fee DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  installments INTEGER DEFAULT 1,
  card_last_four_digits TEXT,
  payment_date TIMESTAMPTZ,
  refund_date TIMESTAMPTZ,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de Eventos
CREATE TABLE public.event_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Meios de Pagamento
  payment_pix_enabled BOOLEAN DEFAULT true,
  payment_credit_card_enabled BOOLEAN DEFAULT true,
  payment_boleto_enabled BOOLEAN DEFAULT true,
  payment_max_installments INTEGER DEFAULT 12,
  payment_assume_interest BOOLEAN DEFAULT false,
  
  -- Analytics
  analytics_facebook_pixel_enabled BOOLEAN DEFAULT false,
  analytics_facebook_pixel_id TEXT,
  analytics_google_analytics_enabled BOOLEAN DEFAULT false,
  analytics_google_analytics_id TEXT,
  analytics_gtm_enabled BOOLEAN DEFAULT false,
  analytics_gtm_container_id TEXT,
  
  -- Orderbump
  orderbump_enabled BOOLEAN DEFAULT false,
  orderbump_title TEXT,
  orderbump_description TEXT,
  orderbump_price DECIMAL(10,2),
  orderbump_image_url TEXT,
  
  -- Email Marketing
  email_confirmation_enabled BOOLEAN DEFAULT true,
  email_confirmation_subject TEXT,
  email_confirmation_template TEXT,
  email_reminder_enabled BOOLEAN DEFAULT false,
  email_reminder_days_before INTEGER DEFAULT 7,
  email_reminder_subject TEXT,
  email_reminder_template TEXT,
  email_welcome_enabled BOOLEAN DEFAULT false,
  email_welcome_subject TEXT,
  email_welcome_template TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Transferências de Titularidade
CREATE TABLE public.ownership_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  old_owner_id UUID NOT NULL REFERENCES public.users(id),
  new_owner_email TEXT NOT NULL,
  new_owner_cpf TEXT NOT NULL,
  new_owner_id UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.users(id)
);

-- Afiliados
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Cupons de Afiliados
CREATE TABLE public.affiliate_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitações de Saque
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  bank_account TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para performance
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_ticket_batches_event ON public.ticket_batches(event_id);
CREATE INDEX idx_tickets_batch ON public.tickets(batch_id);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_athlete ON public.registrations(athlete_id);
CREATE INDEX idx_registrations_buyer ON public.registrations(buyer_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_registrations_number ON public.registrations(registration_number);
CREATE INDEX idx_payments_registration ON public.payments(registration_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_athletes_registration ON public.athletes(registration_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_cpf ON public.users(cpf);
CREATE INDEX idx_affiliates_code ON public.affiliates(referral_code);

-- Índices para busca de texto
CREATE INDEX idx_events_name_search ON public.events USING gin(name gin_trgm_ops);
CREATE INDEX idx_events_description_search ON public.events USING gin(description gin_trgm_ops);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON public.organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_batches_updated_at BEFORE UPDATE ON public.ticket_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_settings_updated_at BEFORE UPDATE ON public.event_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de inscrição
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  reg_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Buscar o último número de sequência do ano
  SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.registrations
  WHERE registration_number LIKE 'INS-' || year_part || '-%';
  
  reg_number := 'INS-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN reg_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de inscrição automaticamente
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_registration_number_trigger
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (podem ser ajustadas conforme necessário)

-- Users: usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Events: todos podem ver eventos ativos, organizadores podem gerenciar seus eventos
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (status = 'active');

CREATE POLICY "Organizers can manage own events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organizers
      WHERE organizers.id = events.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Registrations: usuários podem ver suas próprias inscrições
CREATE POLICY "Users can view own registrations" ON public.registrations
  FOR SELECT USING (athlete_id = auth.uid() OR buyer_id = auth.uid());

-- Organizers can view all registrations for their events
CREATE POLICY "Organizers can view event registrations" ON public.registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      JOIN public.organizers ON organizers.id = events.organizer_id
      WHERE events.id = registrations.event_id
      AND organizers.user_id = auth.uid()
    )
  );

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.users IS 'Usuários da plataforma (estende auth.users)';
COMMENT ON TABLE public.organizers IS 'Perfis de organizadores de eventos';
COMMENT ON TABLE public.events IS 'Eventos esportivos criados pelos organizadores';
COMMENT ON TABLE public.ticket_batches IS 'Lotes de venda de ingressos';
COMMENT ON TABLE public.tickets IS 'Ingressos disponíveis em cada lote';
COMMENT ON TABLE public.registrations IS 'Inscrições de atletas nos eventos';
COMMENT ON TABLE public.athletes IS 'Dados dos atletas inscritos (pode ser diferente do comprador)';
COMMENT ON TABLE public.payments IS 'Pagamentos das inscrições';
COMMENT ON TABLE public.event_settings IS 'Configurações avançadas dos eventos';
COMMENT ON TABLE public.ownership_transfers IS 'Solicitações de transferência de titularidade';
COMMENT ON TABLE public.affiliates IS 'Afiliados da plataforma';
COMMENT ON TABLE public.affiliate_coupons IS 'Cupons de desconto dos afiliados';
COMMENT ON TABLE public.withdrawal_requests IS 'Solicitações de saque dos afiliados';



