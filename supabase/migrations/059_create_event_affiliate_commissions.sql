-- Migration: Create event_affiliate_commissions table
-- Date: 2025-12-05
-- Description: Tabela para armazenar as comissões configuradas para afiliados em eventos

-- Criar tabela de comissões de afiliados por evento
CREATE TABLE IF NOT EXISTS event_affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value DECIMAL(10, 2) NOT NULL CHECK (commission_value >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Um afiliado só pode ter uma comissão por evento
  UNIQUE(event_id, affiliate_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_event_affiliate_commissions_event_id ON event_affiliate_commissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_commissions_affiliate_id ON event_affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_commissions_created_at ON event_affiliate_commissions(created_at DESC);

-- Habilitar RLS
ALTER TABLE event_affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Política: Afiliados podem ver suas próprias comissões
CREATE POLICY "Afiliados podem ver suas comissões"
ON event_affiliate_commissions
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- Política: Organizadores podem ver comissões dos seus eventos
CREATE POLICY "Organizadores podem ver comissões dos seus eventos"
ON event_affiliate_commissions
FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events 
    WHERE organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
      UNION
      SELECT organizer_id FROM organization_users WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Política: Organizadores podem inserir comissões
CREATE POLICY "Organizadores podem inserir comissões"
ON event_affiliate_commissions
FOR INSERT
TO authenticated
WITH CHECK (
  event_id IN (
    SELECT id FROM events 
    WHERE organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
      UNION
      SELECT organizer_id FROM organization_users WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Política: Organizadores podem atualizar comissões
CREATE POLICY "Organizadores podem atualizar comissões"
ON event_affiliate_commissions
FOR UPDATE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events 
    WHERE organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
      UNION
      SELECT organizer_id FROM organization_users WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Política: Organizadores podem deletar comissões
CREATE POLICY "Organizadores podem deletar comissões"
ON event_affiliate_commissions
FOR DELETE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events 
    WHERE organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
      UNION
      SELECT organizer_id FROM organization_users WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Comentários para documentação
COMMENT ON TABLE event_affiliate_commissions IS 'Comissões configuradas para afiliados em eventos específicos';
COMMENT ON COLUMN event_affiliate_commissions.commission_type IS 'Tipo de comissão: percentage (percentual) ou fixed (valor fixo)';
COMMENT ON COLUMN event_affiliate_commissions.commission_value IS 'Valor da comissão (percentual ou valor fixo)';

