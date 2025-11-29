-- Criar tabela para armazenar imagens dos eventos
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_order ON event_images(event_id, image_order);

-- Comentários explicativos
COMMENT ON TABLE event_images IS 'Armazena imagens adicionais dos eventos para exibição na landing page';
COMMENT ON COLUMN event_images.event_id IS 'ID do evento ao qual a imagem pertence';
COMMENT ON COLUMN event_images.image_url IS 'URL da imagem armazenada no Supabase Storage';
COMMENT ON COLUMN event_images.image_order IS 'Ordem de exibição das imagens';

-- Habilitar RLS
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- Política: Organizadores podem ver imagens dos seus eventos
CREATE POLICY "Organizers can view their event images"
  ON event_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
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

-- Política: Qualquer um pode ver imagens de eventos públicos
CREATE POLICY "Public can view event images"
  ON event_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
      AND events.status = 'active'
    )
  );

-- Política: Organizadores podem inserir imagens nos seus eventos
CREATE POLICY "Organizers can insert event images"
  ON event_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
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

-- Política: Organizadores podem atualizar imagens dos seus eventos
CREATE POLICY "Organizers can update their event images"
  ON event_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
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

-- Política: Organizadores podem deletar imagens dos seus eventos
CREATE POLICY "Organizers can delete their event images"
  ON event_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_images.event_id
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

