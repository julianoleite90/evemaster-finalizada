-- Migration: Sistema de Avaliação de Organizadores
-- Permite que participantes avaliem organizadores após participar de eventos

-- 1. Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS organizer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Categorias de avaliação (1-5 estrelas cada)
  rating_organization INTEGER CHECK (rating_organization >= 1 AND rating_organization <= 5), -- Organização do evento
  rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5), -- Comunicação
  rating_structure INTEGER CHECK (rating_structure >= 1 AND rating_structure <= 5), -- Estrutura/Infraestrutura
  rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5), -- Custo-benefício
  
  -- Flags
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT TRUE, -- Se o usuário realmente participou do evento
  is_visible BOOLEAN DEFAULT TRUE, -- Se a avaliação está visível publicamente
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cada usuário só pode avaliar um organizador uma vez por evento
  UNIQUE(user_id, organizer_id, event_id)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_organizer_reviews_organizer_id ON organizer_reviews(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_reviews_user_id ON organizer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_reviews_event_id ON organizer_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_organizer_reviews_rating ON organizer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_organizer_reviews_created_at ON organizer_reviews(created_at DESC);

-- 3. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_organizer_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_organizer_reviews_updated_at ON organizer_reviews;
CREATE TRIGGER trigger_update_organizer_reviews_updated_at
  BEFORE UPDATE ON organizer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_organizer_reviews_updated_at();

-- 4. Adicionar colunas de estatísticas na tabela organizers
ALTER TABLE organizers 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 5. Função para recalcular estatísticas do organizador
CREATE OR REPLACE FUNCTION recalculate_organizer_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_organizer_id UUID;
  v_avg_rating DECIMAL(3,2);
  v_total_reviews INTEGER;
BEGIN
  -- Pegar o organizer_id (pode ser do NEW ou OLD dependendo da operação)
  IF TG_OP = 'DELETE' THEN
    v_organizer_id := OLD.organizer_id;
  ELSE
    v_organizer_id := NEW.organizer_id;
  END IF;
  
  -- Calcular média e total
  SELECT 
    COALESCE(AVG(rating)::DECIMAL(3,2), 0),
    COUNT(*)::INTEGER
  INTO v_avg_rating, v_total_reviews
  FROM organizer_reviews
  WHERE organizer_id = v_organizer_id
    AND is_visible = TRUE;
  
  -- Atualizar organizador
  UPDATE organizers
  SET 
    average_rating = v_avg_rating,
    total_reviews = v_total_reviews,
    updated_at = NOW()
  WHERE id = v_organizer_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular estatísticas quando avaliação é inserida/atualizada/deletada
DROP TRIGGER IF EXISTS trigger_recalculate_organizer_rating ON organizer_reviews;
CREATE TRIGGER trigger_recalculate_organizer_rating
  AFTER INSERT OR UPDATE OR DELETE ON organizer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_organizer_rating();

-- 6. RLS Policies
ALTER TABLE organizer_reviews ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver avaliações visíveis
CREATE POLICY "Avaliações visíveis são públicas"
  ON organizer_reviews
  FOR SELECT
  TO authenticated, anon
  USING (is_visible = TRUE);

-- Usuários podem ver suas próprias avaliações (mesmo não visíveis)
CREATE POLICY "Usuários podem ver suas próprias avaliações"
  ON organizer_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuários autenticados podem criar avaliações
CREATE POLICY "Usuários podem criar avaliações"
  ON organizer_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias avaliações
CREATE POLICY "Usuários podem atualizar suas avaliações"
  ON organizer_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias avaliações
CREATE POLICY "Usuários podem deletar suas avaliações"
  ON organizer_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Atualizar a view organizer_complete_view para incluir avaliações
DROP VIEW IF EXISTS organizer_complete_view;

CREATE VIEW organizer_complete_view AS
SELECT 
  o.id as organizer_id,
  o.company_name,
  o.company_cnpj,
  o.company_phone,
  o.company_email,
  o.company_address,
  o.company_city,
  o.company_state,
  o.company_zip_code,
  o.legal_responsible,
  o.state_registration,
  o.user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  u.phone as user_phone,
  o.status,
  o.is_active,
  o.platform_fee_percentage,
  o.payment_term_days,
  o.barte_seller_id,
  o.average_rating,
  o.total_reviews,
  (
    SELECT COUNT(*) 
    FROM events e 
    WHERE e.organizer_id = o.id 
    AND e.event_date >= NOW() - INTERVAL '1 year'
  ) as events_last_year
FROM organizers o
LEFT JOIN users u ON u.id = o.user_id;

-- 8. Comentários para documentação
COMMENT ON TABLE organizer_reviews IS 'Avaliações de organizadores feitas por participantes de eventos';
COMMENT ON COLUMN organizer_reviews.rating IS 'Avaliação geral de 1 a 5 estrelas';
COMMENT ON COLUMN organizer_reviews.rating_organization IS 'Avaliação da organização do evento (1-5)';
COMMENT ON COLUMN organizer_reviews.rating_communication IS 'Avaliação da comunicação (1-5)';
COMMENT ON COLUMN organizer_reviews.rating_structure IS 'Avaliação da estrutura/infraestrutura (1-5)';
COMMENT ON COLUMN organizer_reviews.rating_value IS 'Avaliação do custo-benefício (1-5)';
COMMENT ON COLUMN organizer_reviews.is_anonymous IS 'Se a avaliação é anônima';
COMMENT ON COLUMN organizer_reviews.is_verified IS 'Se o usuário realmente participou do evento';

