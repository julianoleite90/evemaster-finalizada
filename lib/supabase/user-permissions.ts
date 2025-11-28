import { createClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"

export interface UserPermissions {
  can_view: boolean
  can_edit: boolean
  can_create: boolean
  can_delete: boolean
  is_primary: boolean // Se é organizador principal (tem todas as permissões)
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
    }
  }

  // 2. Verificar permissões como membro de organização
  const { data: orgMembership } = await supabase
    .from("organization_users")
    .select("can_view, can_edit, can_create, can_delete, is_active")
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

