-- Migration: Fix RLS policies for event_affiliate_invites table
-- Date: 2025-12-03
-- IMPORTANTE: Execute este SQL no Supabase Dashboard > SQL Editor

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE event_affiliate_invites ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Organizadores podem criar convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Organizadores podem ver convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Organizadores podem atualizar convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Organizadores podem deletar convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Afiliados podem ver seus convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "Afiliados podem atualizar seus convites" ON event_affiliate_invites;
DROP POLICY IF EXISTS "allow_insert_for_organizers" ON event_affiliate_invites;
DROP POLICY IF EXISTS "allow_select_for_organizers" ON event_affiliate_invites;
DROP POLICY IF EXISTS "allow_update_for_organizers" ON event_affiliate_invites;
DROP POLICY IF EXISTS "allow_delete_for_organizers" ON event_affiliate_invites;

-- Política SIMPLIFICADA para INSERT: Qualquer usuário autenticado pode criar
-- (a validação de permissão é feita na API)
CREATE POLICY "allow_insert_for_authenticated"
ON event_affiliate_invites
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT: Organizadores e afiliados podem ver
CREATE POLICY "allow_select_for_authenticated"
ON event_affiliate_invites
FOR SELECT
TO authenticated
USING (
  -- Organizador direto
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  OR
  -- Membro de organização
  organizer_id IN (SELECT organizer_id FROM organization_users WHERE user_id = auth.uid())
  OR
  -- Qualquer usuário pode ver convites do seu email
  email = auth.jwt()->>'email'
);

-- Política para UPDATE
CREATE POLICY "allow_update_for_authenticated"
ON event_affiliate_invites
FOR UPDATE
TO authenticated
USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  OR
  organizer_id IN (SELECT organizer_id FROM organization_users WHERE user_id = auth.uid())
  OR
  email = auth.jwt()->>'email'
);

-- Política para DELETE
CREATE POLICY "allow_delete_for_authenticated"
ON event_affiliate_invites
FOR DELETE
TO authenticated
USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
  OR
  organizer_id IN (SELECT organizer_id FROM organization_users WHERE user_id = auth.uid())
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_organizer_id ON event_affiliate_invites(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_email ON event_affiliate_invites(email);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_event_id ON event_affiliate_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_affiliate_invites_token ON event_affiliate_invites(token);

