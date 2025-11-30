import { createClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"

export interface UserPermissions {
  // Permissões básicas (mantidas para compatibilidade)
  can_view: boolean
  can_edit: boolean
  can_create: boolean
  can_delete: boolean
  is_primary: boolean // Se é organizador principal (tem todas as permissões)
  
  // Permissões granulares por página/funcionalidade
  can_view_dashboard?: boolean
  can_view_events?: boolean
  can_create_events?: boolean
  can_edit_events?: boolean
  can_delete_events?: boolean
  can_view_registrations?: boolean
  can_export_registrations?: boolean
  can_edit_registrations?: boolean
  can_cancel_registrations?: boolean
  can_view_financial?: boolean
  can_manage_financial?: boolean
  can_view_settings?: boolean
  can_edit_settings?: boolean
  can_manage_users?: boolean
  can_view_affiliates?: boolean
  can_manage_affiliates?: boolean
  can_view_reports?: boolean
  can_export_reports?: boolean
}

/**
 * Busca as permissões do usuário atual
 */
export async function getUserPermissions(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPermissions | null> {
  // 1. Verificar se é organizador principal (tem todas as permissões)
  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (organizer) {
    // Organizador principal tem todas as permissões
    return {
      can_view: true,
      can_edit: true,
      can_create: true,
      can_delete: true,
      is_primary: true,
      // Todas as permissões granulares para organizador principal
      can_view_dashboard: true,
      can_view_events: true,
      can_create_events: true,
      can_edit_events: true,
      can_delete_events: true,
      can_view_registrations: true,
      can_export_registrations: true,
      can_edit_registrations: true,
      can_cancel_registrations: true,
      can_view_financial: true,
      can_manage_financial: true,
      can_view_settings: true,
      can_edit_settings: true,
      can_manage_users: true,
      can_view_affiliates: true,
      can_manage_affiliates: true,
      can_view_reports: true,
      can_export_reports: true,
    }
  }

  // 2. Verificar permissões como membro de organização
  const { data: orgMembership } = await supabase
    .from("organization_users")
    .select(`
      can_view, 
      can_edit, 
      can_create, 
      can_delete, 
      is_active,
      can_view_dashboard,
      can_view_events,
      can_create_events,
      can_edit_events,
      can_delete_events,
      can_view_registrations,
      can_export_registrations,
      can_edit_registrations,
      can_cancel_registrations,
      can_view_financial,
      can_manage_financial,
      can_view_settings,
      can_edit_settings,
      can_manage_users,
      can_view_affiliates,
      can_manage_affiliates,
      can_view_reports,
      can_export_reports
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle()

  if (orgMembership) {
    return {
      can_view: orgMembership.can_view || false,
      can_edit: orgMembership.can_edit || false,
      can_create: orgMembership.can_create || false,
      can_delete: orgMembership.can_delete || false,
      is_primary: false,
      // Permissões granulares
      can_view_dashboard: orgMembership.can_view_dashboard || false,
      can_view_events: orgMembership.can_view_events || false,
      can_create_events: orgMembership.can_create_events || false,
      can_edit_events: orgMembership.can_edit_events || false,
      can_delete_events: orgMembership.can_delete_events || false,
      can_view_registrations: orgMembership.can_view_registrations || false,
      can_export_registrations: orgMembership.can_export_registrations || false,
      can_edit_registrations: orgMembership.can_edit_registrations || false,
      can_cancel_registrations: orgMembership.can_cancel_registrations || false,
      can_view_financial: orgMembership.can_view_financial || false,
      can_manage_financial: orgMembership.can_manage_financial || false,
      can_view_settings: orgMembership.can_view_settings || false,
      can_edit_settings: orgMembership.can_edit_settings || false,
      can_manage_users: orgMembership.can_manage_users || false,
      can_view_affiliates: orgMembership.can_view_affiliates || false,
      can_manage_affiliates: orgMembership.can_manage_affiliates || false,
      can_view_reports: orgMembership.can_view_reports || false,
      can_export_reports: orgMembership.can_export_reports || false,
    }
  }

  // Sem permissões
  return null
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export async function hasPermission(
  permission: 'view' | 'edit' | 'create' | 'delete',
  userId?: string
): Promise<boolean> {
  const supabase = createClient()
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    userId = user.id
  }

  const permissions = await getUserPermissions(supabase, userId)
  if (!permissions) return false

  switch (permission) {
    case 'view':
      return permissions.can_view
    case 'edit':
      return permissions.can_edit
    case 'create':
      return permissions.can_create
    case 'delete':
      return permissions.can_delete
    default:
      return false
  }
}

