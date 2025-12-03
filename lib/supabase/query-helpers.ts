/**
 * Helpers para queries do Supabase
 * Centraliza filtros e padrões comuns
 */

import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Adiciona filtro para excluir inscrições canceladas
 * Uso: activeRegistrations(supabase.from("registrations").select("*"))
 */
export function activeRegistrations<T>(query: T): T {
  return (query as any).neq("status", "cancelled") as T
}

/**
 * Status de inscrições que devem ser consideradas "ativas"
 */
export const ACTIVE_REGISTRATION_STATUSES = ["pending", "confirmed", "paid"] as const

/**
 * Status de inscrições que NÃO devem ser contadas nas estatísticas
 */
export const EXCLUDED_REGISTRATION_STATUSES = ["cancelled"] as const

/**
 * Verifica se um status de inscrição é considerado "ativo"
 */
export function isActiveRegistration(status: string): boolean {
  return status !== "cancelled"
}

/**
 * Filtro padrão para queries de inscrições ativas
 * Retorna o filtro para usar em queries
 */
export const REGISTRATION_ACTIVE_FILTER = {
  column: "status",
  operator: "neq" as const,
  value: "cancelled"
}

