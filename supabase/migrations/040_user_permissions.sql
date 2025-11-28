-- ============================================
-- SISTEMA DE PERMISSÕES DE USUÁRIOS
-- ============================================
-- Permite adicionar usuários à conta do organizador com permissões específicas

-- Tabela de usuários da organização (team members)
CREATE TABLE IF NOT EXISTS public.organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true NOT NULL,
  can_edit BOOLEAN DEFAULT false NOT NULL,
  can_create BOOLEAN DEFAULT false NOT NULL,
  can_delete BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizer_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_organization_users_organizer_id ON public.organization_users(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_is_active ON public.organization_users(is_active);

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(
  p_organizer_id UUID,
  p_user_id UUID,
  p_permission TEXT -- 'view', 'edit', 'create', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  -- Verificar se é o dono da organização
  SELECT EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = p_organizer_id AND user_id = p_user_id
  ) INTO v_is_owner;
  
  IF v_is_owner THEN
    RETURN TRUE; -- Dono tem todas as permissões
  END IF;
  
  -- Verificar permissão específica
  SELECT CASE p_permission
    WHEN 'view' THEN can_view
    WHEN 'edit' THEN can_edit
    WHEN 'create' THEN can_create
    WHEN 'delete' THEN can_delete
    ELSE FALSE
  END INTO v_has_permission
  FROM public.organization_users
  WHERE organizer_id = p_organizer_id 
    AND user_id = p_user_id 
    AND is_active = true;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE public.organization_users IS 'Usuários adicionados à organização com permissões específicas';
COMMENT ON COLUMN public.organization_users.can_view IS 'Pode visualizar dados da organização';
COMMENT ON COLUMN public.organization_users.can_edit IS 'Pode editar dados da organização';
COMMENT ON COLUMN public.organization_users.can_create IS 'Pode criar novos registros (eventos, etc)';
COMMENT ON COLUMN public.organization_users.can_delete IS 'Pode deletar registros';

-- RLS Policies
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Organizadores podem ver usuários de sua organização
CREATE POLICY "Organizers can view their organization users"
  ON public.organization_users FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
    OR
    user_id = auth.uid() -- Usuário pode ver se está na organização
  );

-- Apenas o dono da organização pode adicionar/editar usuários
CREATE POLICY "Organization owners can manage users"
  ON public.organization_users FOR ALL
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

-- Admin pode ver tudo
CREATE POLICY "Admins can view all organization users"
  ON public.organization_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

