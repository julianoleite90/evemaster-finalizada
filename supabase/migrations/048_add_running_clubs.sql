-- Migração 048: Adicionar sistema de Clube de Corrida
-- Sistema para gerenciar clubes de corrida com ingressos reservados e descontos progressivos

-- Tabela de clubes de corrida
CREATE TABLE IF NOT EXISTS running_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT, -- Nome do clube (preenchido quando aceitar convite)
  tickets_allocated INTEGER NOT NULL DEFAULT 0, -- Quantidade de ingressos alocados
  tickets_used INTEGER DEFAULT 0, -- Quantidade de ingressos já usados
  discount_type TEXT DEFAULT 'percentage', -- 'percentage' ou 'fixed'
  base_discount DECIMAL(5, 2) DEFAULT 0, -- Desconto base
  progressive_discount_threshold INTEGER, -- A partir de quantos ingressos aplicar desconto progressivo
  progressive_discount_value DECIMAL(5, 2), -- Valor do desconto progressivo adicional
  deadline DATE NOT NULL, -- Prazo máximo para usar os ingressos
  extend_on_deadline BOOLEAN DEFAULT false, -- Se deve prorrogar 24h automaticamente
  release_after_deadline BOOLEAN DEFAULT true, -- Se deve liberar ingressos após prazo
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'completed'
  token TEXT UNIQUE NOT NULL, -- Token para aceitar convite
  expires_at TIMESTAMPTZ, -- Data de expiração do token
  accepted_at TIMESTAMPTZ, -- Data de aceitação
  extended_at TIMESTAMPTZ, -- Data em que foi prorrogado
  released_at TIMESTAMPTZ, -- Data em que os ingressos foram liberados
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Usuário que aceitou (se houver)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_running_clubs_event_id ON running_clubs(event_id);
CREATE INDEX IF NOT EXISTS idx_running_clubs_organizer_id ON running_clubs(organizer_id);
CREATE INDEX IF NOT EXISTS idx_running_clubs_email ON running_clubs(email);
CREATE INDEX IF NOT EXISTS idx_running_clubs_token ON running_clubs(token);
CREATE INDEX IF NOT EXISTS idx_running_clubs_status ON running_clubs(status);
CREATE INDEX IF NOT EXISTS idx_running_clubs_deadline ON running_clubs(deadline);

-- Tabela de participantes do clube (inscrições pendentes ou completas)
CREATE TABLE IF NOT EXISTS running_club_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES running_clubs(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT, -- Preenchido se cadastro completo
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL, -- Se já se inscreveu
  status TEXT DEFAULT 'pending', -- 'pending', 'invited', 'registered'
  token TEXT UNIQUE, -- Token para completar inscrição
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_running_club_participants_club_id ON running_club_participants(club_id);
CREATE INDEX IF NOT EXISTS idx_running_club_participants_event_id ON running_club_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_running_club_participants_email ON running_club_participants(email);
CREATE INDEX IF NOT EXISTS idx_running_club_participants_token ON running_club_participants(token);
CREATE INDEX IF NOT EXISTS idx_running_club_participants_status ON running_club_participants(status);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_running_clubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_running_club_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_update_running_clubs_updated_at ON running_clubs;
CREATE TRIGGER trigger_update_running_clubs_updated_at
  BEFORE UPDATE ON running_clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_running_clubs_updated_at();

DROP TRIGGER IF EXISTS trigger_update_running_club_participants_updated_at ON running_club_participants;
CREATE TRIGGER trigger_update_running_club_participants_updated_at
  BEFORE UPDATE ON running_club_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_running_club_participants_updated_at();

-- Adicionar campo quantidade_total na tabela events (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'quantidade_total'
  ) THEN
    ALTER TABLE events
    ADD COLUMN quantidade_total INTEGER;
    
    COMMENT ON COLUMN events.quantidade_total IS 'Quantidade total de ingressos permitidos para o evento (controle)';
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE running_clubs IS 'Clubes de corrida cadastrados para eventos';
COMMENT ON TABLE running_club_participants IS 'Participantes dos clubes de corrida';

COMMENT ON COLUMN running_clubs.tickets_allocated IS 'Quantidade de ingressos alocados para o clube';
COMMENT ON COLUMN running_clubs.tickets_used IS 'Quantidade de ingressos já utilizados';
COMMENT ON COLUMN running_clubs.progressive_discount_threshold IS 'A partir de quantos ingressos aplicar desconto progressivo';
COMMENT ON COLUMN running_clubs.progressive_discount_value IS 'Valor adicional do desconto progressivo';
COMMENT ON COLUMN running_clubs.extend_on_deadline IS 'Se deve prorrogar automaticamente por 24h ao chegar no prazo';
COMMENT ON COLUMN running_clubs.release_after_deadline IS 'Se deve liberar ingressos não usados após prazo final';

-- RLS Policies
ALTER TABLE running_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_club_participants ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para evitar erros em re-execução)
DROP POLICY IF EXISTS "Organizadores podem ver clubes de seus eventos" ON running_clubs;
DROP POLICY IF EXISTS "Organizadores podem criar clubes em seus eventos" ON running_clubs;
DROP POLICY IF EXISTS "Organizadores podem atualizar clubes de seus eventos" ON running_clubs;
DROP POLICY IF EXISTS "Usuários podem ver clubes aceitos" ON running_clubs;
DROP POLICY IF EXISTS "Sistema pode gerenciar clubes" ON running_clubs;
DROP POLICY IF EXISTS "Organizadores podem ver participantes dos clubes" ON running_club_participants;
DROP POLICY IF EXISTS "Usuários do clube podem ver participantes" ON running_club_participants;
DROP POLICY IF EXISTS "Usuários do clube podem criar participantes" ON running_club_participants;
DROP POLICY IF EXISTS "Sistema pode gerenciar participantes" ON running_club_participants;

-- Política: Organizadores podem ver e gerenciar clubes de seus eventos
CREATE POLICY "Organizadores podem ver clubes de seus eventos"
  ON running_clubs FOR SELECT
  USING (
    organizer_id IN (
      SELECT o.id FROM organizers o
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizadores podem criar clubes em seus eventos"
  ON running_clubs FOR INSERT
  WITH CHECK (
    organizer_id IN (
      SELECT o.id FROM organizers o
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizadores podem atualizar clubes de seus eventos"
  ON running_clubs FOR UPDATE
  USING (
    organizer_id IN (
      SELECT o.id FROM organizers o
      WHERE o.user_id = auth.uid()
    )
  );

-- Política: Usuários podem ver clubes que aceitaram
CREATE POLICY "Usuários podem ver clubes aceitos"
  ON running_clubs FOR SELECT
  USING (
    user_id = auth.uid() AND status = 'accepted'
  );

-- Política: Sistema pode inserir/atualizar clubes (para webhooks e processos automáticos)
-- Nota: Esta política permite acesso total, use com cuidado em produção
-- Considere remover ou restringir em ambiente de produção
CREATE POLICY "Sistema pode gerenciar clubes"
  ON running_clubs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Política: Organizadores podem ver participantes dos clubes de seus eventos
CREATE POLICY "Organizadores podem ver participantes dos clubes"
  ON running_club_participants FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

-- Política: Usuários do clube podem ver participantes do seu clube
CREATE POLICY "Usuários do clube podem ver participantes"
  ON running_club_participants FOR SELECT
  USING (
    club_id IN (
      SELECT id FROM running_clubs
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Política: Usuários do clube podem criar participantes
CREATE POLICY "Usuários do clube podem criar participantes"
  ON running_club_participants FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT id FROM running_clubs
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Política: Sistema pode gerenciar participantes
-- Nota: Esta política permite acesso total, use com cuidado em produção
-- Considere remover ou restringir em ambiente de produção
CREATE POLICY "Sistema pode gerenciar participantes"
  ON running_club_participants FOR ALL
  USING (true)
  WITH CHECK (true);

