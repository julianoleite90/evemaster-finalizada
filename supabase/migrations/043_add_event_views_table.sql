-- Criar tabela para armazenar visualizações de eventos
CREATE TABLE IF NOT EXISTS event_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_event_views_event_id ON event_views(event_id);
CREATE INDEX IF NOT EXISTS idx_event_views_viewed_at ON event_views(viewed_at);

-- Comentários explicativos
COMMENT ON TABLE event_views IS 'Armazena visualizações/cliques na landing page dos eventos';
COMMENT ON COLUMN event_views.event_id IS 'ID do evento visualizado';
COMMENT ON COLUMN event_views.viewed_at IS 'Data e hora da visualização';
COMMENT ON COLUMN event_views.ip_address IS 'Endereço IP do visitante (opcional, para analytics)';
COMMENT ON COLUMN event_views.user_agent IS 'User agent do navegador (opcional)';
COMMENT ON COLUMN event_views.referrer IS 'URL de origem (opcional)';

-- Habilitar RLS
ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;

-- Política: Organizadores podem ver visualizações dos seus eventos
CREATE POLICY "Organizers can view their event views"
  ON event_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_views.event_id
      AND events.organizer_id IN (
        SELECT organizer_id FROM organization_users
        WHERE user_id = auth.uid()
        AND is_active = true
        UNION
        SELECT id FROM organizers
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política: Qualquer um pode inserir visualizações (tracking público)
CREATE POLICY "Anyone can insert event views"
  ON event_views
  FOR INSERT
  WITH CHECK (true);

