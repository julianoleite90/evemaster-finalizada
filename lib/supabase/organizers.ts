import { createClient } from "@/lib/supabase/server"
import { createClient as createClientBrowser } from "@/lib/supabase/client"

/**
 * Interface padronizada para dados completos do organizador
 */
export interface OrganizerCompleteData {
  // Dados da tabela organizers
  organizer_id: string
  company_name: string
  company_cnpj: string | null
  company_phone: string | null
  company_address: string | null
  company_city: string | null
  company_state: string | null
  company_zip_code: string | null
  legal_responsible: string | null
  state_registration: string | null
  user_id: string
  
  // Dados do usuário relacionado
  user_email: string | null
  user_full_name: string | null
  user_phone: string | null
  
  // Estatísticas
  events_last_year: number
  
  // Status
  status: string | null
  is_active: boolean | null
  platform_fee_percentage: number | null
  payment_term_days: number | null
  barte_seller_id: number | null
}

/**
 * Busca dados completos do organizador usando a view padronizada
 * @param organizerId ID do organizador
 * @returns Dados completos do organizador ou null se não encontrado
 */
export async function getOrganizerCompleteData(organizerId: string): Promise<OrganizerCompleteData | null> {
  const supabase = createClientBrowser()
  
  const { data, error } = await supabase
    .from("organizer_complete_view")
    .select("*")
    .eq("organizer_id", organizerId)
    .single()
  
  if (error) {
    console.error("Erro ao buscar dados completos do organizador:", error)
    return null
  }
  
  if (!data) {
    return null
  }
  
  // Mapear dados da view para a interface
  return {
    organizer_id: data.organizer_id,
    company_name: data.company_name,
    company_cnpj: data.company_cnpj,
    company_phone: data.company_phone,
    company_address: data.company_address,
    company_city: data.company_city,
    company_state: data.company_state,
    company_zip_code: data.company_zip_code,
    legal_responsible: data.legal_responsible,
    state_registration: data.state_registration,
    user_id: data.user_id,
    user_email: data.user_email,
    user_full_name: data.user_full_name,
    user_phone: data.user_phone,
    events_last_year: data.events_last_year || 0,
    status: data.status,
    is_active: data.is_active,
    platform_fee_percentage: data.platform_fee_percentage,
    payment_term_days: data.payment_term_days,
    barte_seller_id: data.barte_seller_id
  }
}

/**
 * Busca dados completos do organizador (server-side)
 */
export async function getOrganizerCompleteDataServer(organizerId: string): Promise<OrganizerCompleteData | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("organizer_complete_view")
    .select("*")
    .eq("organizer_id", organizerId)
    .single()
  
  if (error) {
    console.error("Erro ao buscar dados completos do organizador (server):", error)
    return null
  }
  
  if (!data) {
    return null
  }
  
  // Mapear dados da view para a interface
  return {
    organizer_id: data.organizer_id,
    company_name: data.company_name,
    company_cnpj: data.company_cnpj,
    company_phone: data.company_phone,
    company_address: data.company_address,
    company_city: data.company_city,
    company_state: data.company_state,
    company_zip_code: data.company_zip_code,
    legal_responsible: data.legal_responsible,
    state_registration: data.state_registration,
    user_id: data.user_id,
    user_email: data.user_email,
    user_full_name: data.user_full_name,
    user_phone: data.user_phone,
    events_last_year: data.events_last_year || 0,
    status: data.status,
    is_active: data.is_active,
    platform_fee_percentage: data.platform_fee_percentage,
    payment_term_days: data.payment_term_days,
    barte_seller_id: data.barte_seller_id
  }
}

/**
 * Converte dados completos do organizador para o formato usado na exibição
 */
export function formatOrganizerForDisplay(organizer: OrganizerCompleteData) {
  return {
    id: organizer.organizer_id,
    company_name: organizer.company_name,
    full_name: organizer.user_full_name, // Nome do usuário como fallback
    company_cnpj: organizer.company_cnpj,
    company_phone: organizer.company_phone,
    company_email: organizer.user_email, // Email do usuário
    email: organizer.user_email,
    user_id: organizer.user_id,
    events_last_year: organizer.events_last_year,
    // Campos adicionais
    company_address: organizer.company_address,
    company_city: organizer.company_city,
    company_state: organizer.company_state,
    company_zip_code: organizer.company_zip_code,
    legal_responsible: organizer.legal_responsible,
    state_registration: organizer.state_registration,
    status: organizer.status,
    is_active: organizer.is_active,
    platform_fee_percentage: organizer.platform_fee_percentage,
    payment_term_days: organizer.payment_term_days,
    barte_seller_id: organizer.barte_seller_id
  }
}

