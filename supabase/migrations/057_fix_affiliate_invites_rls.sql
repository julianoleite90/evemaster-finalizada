-- Migration: Fix RLS policies for event_affiliate_invites table
-- Date: 2025-12-03

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE event_affiliate_invites ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Organizadores podem criar convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Organizadores podem ver convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Organizadores podem atualizar convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Organizadores podem deletar convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Afiliados podem ver seus convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Afiliados podem atualizar seus convites" ON event_affiliate_invites;

-- Política para INSERT: Organizadores e membros de organizações podem criar convites
CREATE POLICY "Organizadores podem criar convites"
ON event_affiliate_invites
FOR INSERT
WITH CHECK (
  -- Organizador direto
  organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
  OR
  -- Membro de organização
  organizer_id IN (
    SELECT organizer_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Política para SELECT: Organizadores podem ver convites dos seus eventos
CREATE POLICY "Organizadores podem ver convites"
ON event_affiliate_invites
FOR SELECT
USING (
  -- Organizador direto
  organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
  OR
  -- Membro de organização
  organizer_id IN (
    SELECT organizer_id FROM organization_users WHERE user_id = auth.uid()
  )
  OR
  -- Afiliado pode ver seus próprios convites (pelo email)
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Política para UPDATE: Organizadores podem atualizar seus convites
CREATE POLICY "Organizadores podem atualizar convites"
ON event_affiliate_invites
FOR UPDATE
USING (
  -- Organizador direto
  organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
  OR
  -- Membro de organização
  organizer_id IN (
    SELECT organizer_id FROM organization_users WHERE user_id = auth.uid()
  )
  OR
  -- Afiliado pode atualizar seus convites (para aceitar)
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Política para DELETE: Organizadores podem deletar convites
CREATE POLICY "Organizadores podem deletar convites"
ON event_affiliate_invites
FOR DELETE
USING (
  -- Organizador direto
  organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
  OR
  -- Membro de organização
  organizer_id IN (
    SELECT organizer_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Criar índices para performance das políticas RLS
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_organizer_id ON event_affiliate_invites(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_email ON event_affiliate_invites(email);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_event_id ON event_affiliate_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_token ON event_affiliate_invites(token);

