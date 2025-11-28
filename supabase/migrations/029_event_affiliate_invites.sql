-- ============================================
-- MIGRATION: Convites de Afiliados por Evento
-- ============================================
-- Esta migration cria a tabela para gerenciar convites de afiliados
-- vinculados a eventos específicos com comissões personalizadas

-- Tabela de convites de afiliados por evento
CREATE TABLE IF NOT EXISTS public.event_affiliate_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_event ON public.event_affiliate_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_email ON public.event_affiliate_invites(email);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_token ON public.event_affiliate_invites(token);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_status ON public.event_affiliate_invites(status);

-- Tabela de comissões de afiliados por evento (após aceitar convite)
CREATE TABLE IF NOT EXISTS public.event_affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value DECIMAL(10,2) NOT NULL,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_registrations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, affiliate_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_affiliate_commissions_event ON public.event_affiliate_commissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_commissions_affiliate ON public.event_affiliate_commissions(affiliate_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_event_affiliate_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_affiliate_invites_updated_at
  BEFORE UPDATE ON public.event_affiliate_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_event_affiliate_invites_updated_at();

-- Habilitar RLS
ALTER TABLE public.event_affiliate_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para event_affiliate_invites
-- Organizadores podem ver convites de seus eventos
CREATE POLICY "Organizers can view own event affiliate invites" ON public.event_affiliate_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = event_affiliate_invites.organizer_id
      AND o.user_id = auth.uid()
    )
  );

-- Organizadores podem criar convites para seus eventos
CREATE POLICY "Organizers can create event affiliate invites" ON public.event_affiliate_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = event_affiliate_invites.organizer_id
      AND o.user_id = auth.uid()
    )
  );

-- Organizadores podem atualizar convites de seus eventos
CREATE POLICY "Organizers can update own event affiliate invites" ON public.event_affiliate_invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizers o
      WHERE o.id = event_affiliate_invites.organizer_id
      AND o.user_id = auth.uid()
    )
  );

-- Usuários podem ver seus próprios convites (pelo email)
CREATE POLICY "Users can view own affiliate invites" ON public.event_affiliate_invites
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
    OR affiliate_id = (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- Políticas RLS para event_affiliate_commissions
-- Organizadores podem ver comissões de seus eventos
CREATE POLICY "Organizers can view event affiliate commissions" ON public.event_affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE e.id = event_affiliate_commissions.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Afiliados podem ver suas próprias comissões
CREATE POLICY "Affiliates can view own commissions" ON public.event_affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id = (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- Comentários
COMMENT ON TABLE public.event_affiliate_invites IS 'Convites de afiliados para eventos específicos';
COMMENT ON TABLE public.event_affiliate_commissions IS 'Comissões de afiliados por evento';

