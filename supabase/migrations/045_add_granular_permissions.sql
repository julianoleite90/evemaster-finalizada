-- Adicionar permissões granulares na tabela organization_users
-- Permissões por página/funcionalidade para controle completo de acesso

ALTER TABLE organization_users
ADD COLUMN IF NOT EXISTS can_view_dashboard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_events BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_create_events BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_events BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_events BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_registrations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_export_registrations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_registrations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_cancel_registrations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_financial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_financial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_settings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_settings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_affiliates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_affiliates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_export_reports BOOLEAN DEFAULT false;

-- Comentários explicativos
COMMENT ON COLUMN organization_users.can_view_dashboard IS 'Pode visualizar o dashboard principal com estatísticas';
COMMENT ON COLUMN organization_users.can_view_events IS 'Pode visualizar a lista de eventos';
COMMENT ON COLUMN organization_users.can_create_events IS 'Pode criar novos eventos';
COMMENT ON COLUMN organization_users.can_edit_events IS 'Pode editar eventos existentes';
COMMENT ON COLUMN organization_users.can_delete_events IS 'Pode deletar/cancelar eventos';
COMMENT ON COLUMN organization_users.can_view_registrations IS 'Pode visualizar inscrições';
COMMENT ON COLUMN organization_users.can_export_registrations IS 'Pode exportar inscrições';
COMMENT ON COLUMN organization_users.can_edit_registrations IS 'Pode editar dados de inscrições';
COMMENT ON COLUMN organization_users.can_cancel_registrations IS 'Pode cancelar inscrições';
COMMENT ON COLUMN organization_users.can_view_financial IS 'Pode visualizar informações financeiras';
COMMENT ON COLUMN organization_users.can_manage_financial IS 'Pode gerenciar transações financeiras';
COMMENT ON COLUMN organization_users.can_view_settings IS 'Pode visualizar configurações';
COMMENT ON COLUMN organization_users.can_edit_settings IS 'Pode editar configurações';
COMMENT ON COLUMN organization_users.can_manage_users IS 'Pode gerenciar usuários da organização';
COMMENT ON COLUMN organization_users.can_view_affiliates IS 'Pode visualizar afiliados';
COMMENT ON COLUMN organization_users.can_manage_affiliates IS 'Pode criar e gerenciar afiliados';
COMMENT ON COLUMN organization_users.can_view_reports IS 'Pode visualizar relatórios';
COMMENT ON COLUMN organization_users.can_export_reports IS 'Pode exportar relatórios';

-- Atualizar permissões existentes baseado nas permissões antigas
-- Se can_view = true, dar acesso básico de visualização
UPDATE organization_users
SET 
  can_view_dashboard = can_view,
  can_view_events = can_view,
  can_view_registrations = can_view,
  can_view_financial = can_view,
  can_view_settings = can_view,
  can_view_affiliates = can_view,
  can_view_reports = can_view
WHERE can_view = true;

-- Se can_create = true, dar permissão de criar eventos
UPDATE organization_users
SET can_create_events = can_create
WHERE can_create = true;

-- Se can_edit = true, dar permissão de editar eventos e inscrições
UPDATE organization_users
SET 
  can_edit_events = can_edit,
  can_edit_registrations = can_edit,
  can_edit_settings = can_edit
WHERE can_edit = true;

-- Se can_delete = true, dar permissão de deletar eventos e cancelar inscrições
UPDATE organization_users
SET 
  can_delete_events = can_delete,
  can_cancel_registrations = can_delete
WHERE can_delete = true;

