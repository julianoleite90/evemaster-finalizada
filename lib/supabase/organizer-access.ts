import { createClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Verifica se o usuário tem acesso ao dashboard do organizador
 * Retorna o organizer_id (seja do perfil próprio ou da organização)
 */
export async function getOrganizerAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<{ organizerId: string; isPrimary: boolean } | null> {
  // 1. Verificar se é organizador principal
  const { data: organizer, error: organizerError } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (organizerError) {
    console.error("❌ [ORGANIZER ACCESS] Erro ao buscar organizador:", organizerError)
  }

  if (organizer) {
    console.log("✅ [ORGANIZER ACCESS] Usuário é organizador principal:", organizer.id)
    return { organizerId: organizer.id, isPrimary: true }
  }

  // 2. Verificar se é membro de uma organização
  const { data: orgMembership, error: orgError } = await supabase
    .from("organization_users")
    .select("organizer_id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle()

  if (orgError) {
    console.error("❌ [ORGANIZER ACCESS] Erro ao buscar membership:", orgError)
  }

  if (orgMembership) {
    console.log("✅ [ORGANIZER ACCESS] Usuário é membro de organização:", orgMembership.organizer_id)
    return { organizerId: orgMembership.organizer_id, isPrimary: false }
  }

  console.log("❌ [ORGANIZER ACCESS] Usuário não tem acesso ao dashboard")
  return null
}

/**
 * Busca o organizer_id do usuário atual
 */
export async function getCurrentOrganizerId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const access = await getOrganizerAccess(supabase, user.id)
  return access?.organizerId || null
}

