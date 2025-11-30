-- Migração 047: Adicionar sistema de links de afiliados e tracking
-- Tabelas para gerenciar links de divulgação, cliques e relatórios

-- Tabela de links de afiliados
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL, -- Código único para link encurtado
  original_url TEXT NOT NULL, -- URL original do evento
  full_url TEXT NOT NULL, -- URL completa com parâmetros
  title TEXT, -- Título/descrição do link
  utm_source TEXT, -- UTM source
  utm_medium TEXT, -- UTM medium
  utm_campaign TEXT, -- UTM campaign
  utm_term TEXT, -- UTM term
  utm_content TEXT, -- UTM content
  src TEXT, -- Fonte customizada
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- Número de conversões (inscrições)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_event_id ON affiliate_links(event_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_code ON affiliate_links(short_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_created_at ON affiliate_links(created_at DESC);

-- Tabela de cliques nos links
CREATE TABLE IF NOT EXISTS affiliate_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  os TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_link_clicks_link_id ON affiliate_link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_clicks_affiliate_id ON affiliate_link_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_clicks_event_id ON affiliate_link_clicks(event_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_clicks_clicked_at ON affiliate_link_clicks(clicked_at DESC);

-- Tabela de conversões (relacionar cliques com inscrições)
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  click_id UUID REFERENCES affiliate_link_clicks(id) ON DELETE SET NULL,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  conversion_value DECIMAL(10, 2), -- Valor da conversão
  commission_earned DECIMAL(10, 2), -- Comissão ganha
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_link_id ON affiliate_conversions(link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate_id ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_event_id ON affiliate_conversions(event_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_registration_id ON affiliate_conversions(registration_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_converted_at ON affiliate_conversions(converted_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_affiliate_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_affiliate_links_updated_at ON affiliate_links;
CREATE TRIGGER trigger_update_affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_links_updated_at();

-- Função para gerar código curto único
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar contador de cliques
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links
  SET click_count = click_count + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar contador de conversões
CREATE OR REPLACE FUNCTION increment_link_conversions(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links
  SET conversion_count = conversion_count + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE affiliate_links IS 'Links de divulgação criados por afiliados com tracking UTM';
COMMENT ON TABLE affiliate_link_clicks IS 'Registro de cliques nos links de afiliados';
COMMENT ON TABLE affiliate_conversions IS 'Conversões (inscrições) geradas pelos links de afiliados';

COMMENT ON COLUMN affiliate_links.short_code IS 'Código único para link encurtado (ex: /ref/ABC123)';
COMMENT ON COLUMN affiliate_links.click_count IS 'Contador de cliques (atualizado via trigger ou aplicação)';
COMMENT ON COLUMN affiliate_links.conversion_count IS 'Contador de conversões (atualizado via trigger ou aplicação)';

-- RLS Policies (Row Level Security)
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- Política: Afiliados podem ver apenas seus próprios links
CREATE POLICY "Afiliados podem ver seus próprios links"
  ON affiliate_links FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Afiliados podem criar seus próprios links
CREATE POLICY "Afiliados podem criar seus próprios links"
  ON affiliate_links FOR INSERT
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Afiliados podem atualizar seus próprios links
CREATE POLICY "Afiliados podem atualizar seus próprios links"
  ON affiliate_links FOR UPDATE
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Afiliados podem ver cliques de seus links
CREATE POLICY "Afiliados podem ver cliques de seus links"
  ON affiliate_link_clicks FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Sistema pode inserir cliques (via API pública)
CREATE POLICY "Sistema pode inserir cliques"
  ON affiliate_link_clicks FOR INSERT
  WITH CHECK (true);

-- Política: Afiliados podem ver suas conversões
CREATE POLICY "Afiliados podem ver suas conversões"
  ON affiliate_conversions FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Política: Sistema pode inserir conversões
CREATE POLICY "Sistema pode inserir conversões"
  ON affiliate_conversions FOR INSERT
  WITH CHECK (true);

-- Política: Organizadores podem ver links e cliques de seus eventos
CREATE POLICY "Organizadores podem ver links de seus eventos"
  ON affiliate_links FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizadores podem ver cliques de seus eventos"
  ON affiliate_link_clicks FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizadores podem ver conversões de seus eventos"
  ON affiliate_conversions FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

