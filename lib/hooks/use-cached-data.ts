"use client"

/**
 * Hooks com cache usando SWR
 * Reduz requisições ao servidor e melhora performance
 */

import useSWR, { SWRConfiguration, mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"

// Fetcher padrão para Supabase
const supabaseFetcher = async <T>(key: string): Promise<T> => {
  const supabase = createClient()
  const [table, ...conditions] = key.split(":")
  
  let query = supabase.from(table).select("*")
  
  // Parse conditions (format: "column=value")
  for (const condition of conditions) {
    if (condition.includes("=")) {
      const [column, value] = condition.split("=")
      query = query.eq(column, value)
    }
  }
  
  const { data, error } = await query
  if (error) throw error
  return data as T
}

// Fetcher para APIs
const apiFetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Erro na requisição" }))
    throw new Error(error.message || "Erro na requisição")
  }
  return res.json()
}

// Configurações de cache padrão
const DEFAULT_SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false, // Não revalidar ao focar na janela
  revalidateOnReconnect: true, // Revalidar ao reconectar
  dedupingInterval: 30000, // 30 segundos entre requests duplicados
  errorRetryCount: 3, // 3 tentativas em caso de erro
  errorRetryInterval: 5000, // 5 segundos entre tentativas
}

// === HOOKS DE EVENTOS ===

interface Event {
  id: string
  name: string
  description: string
  event_date: string
  status: string
  [key: string]: any
}

/**
 * Hook para buscar evento por ID com cache
 */
export function useEvent(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Event>(
    eventId ? `/api/events/${eventId}` : null,
    apiFetcher,
    {
      ...DEFAULT_SWR_CONFIG,
      revalidateOnFocus: false,
    }
  )
  
  return {
    event: data,
    error,
    isLoading,
    refresh: mutate,
  }
}

/**
 * Hook para buscar eventos do organizador com cache
 */
export function useOrganizerEvents(organizerId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Event[]>(
    organizerId ? `events:organizer_id=${organizerId}` : null,
    supabaseFetcher,
    {
      ...DEFAULT_SWR_CONFIG,
      refreshInterval: 60000, // Atualizar a cada 1 minuto
    }
  )
  
  return {
    events: data || [],
    error,
    isLoading,
    refresh: mutate,
  }
}

// === HOOKS DE INSCRIÇÕES ===

interface Registration {
  id: string
  event_id: string
  status: string
  created_at: string
  [key: string]: any
}

/**
 * Hook para buscar inscrições de um evento com cache
 */
export function useEventRegistrations(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Registration[]>(
    eventId ? `registrations:event_id=${eventId}` : null,
    supabaseFetcher,
    {
      ...DEFAULT_SWR_CONFIG,
      refreshInterval: 30000, // Atualizar a cada 30 segundos
    }
  )
  
  return {
    registrations: data || [],
    error,
    isLoading,
    refresh: mutate,
    count: data?.length || 0,
  }
}

/**
 * Hook para buscar inscrições do usuário com cache
 */
export function useUserRegistrations(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Registration[]>(
    userId ? `registrations:user_id=${userId}` : null,
    supabaseFetcher,
    DEFAULT_SWR_CONFIG
  )
  
  return {
    registrations: data || [],
    error,
    isLoading,
    refresh: mutate,
  }
}

// === HOOKS DE CUPONS ===

interface Coupon {
  id: string
  code: string
  discount_percentage: number | null
  discount_amount: number | null
  is_active: boolean
  [key: string]: any
}

/**
 * Hook para buscar cupons de um evento com cache
 */
export function useEventCoupons(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Coupon[]>(
    eventId ? `affiliate_coupons:event_id=${eventId}` : null,
    supabaseFetcher,
    DEFAULT_SWR_CONFIG
  )
  
  return {
    coupons: data || [],
    error,
    isLoading,
    refresh: mutate,
  }
}

// === HOOKS DE AFILIADOS ===

interface Affiliate {
  id: string
  email: string
  status: string
  commission_type: string
  commission_value: number
  [key: string]: any
}

/**
 * Hook para buscar afiliados de um evento com cache
 */
export function useEventAffiliates(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Affiliate[]>(
    eventId ? `event_affiliate_invites:event_id=${eventId}` : null,
    supabaseFetcher,
    DEFAULT_SWR_CONFIG
  )
  
  return {
    affiliates: data || [],
    error,
    isLoading,
    refresh: mutate,
  }
}

// === HOOKS DE ESTATÍSTICAS ===

interface ViewStats {
  totalViews: number
  viewsToday: number
  viewsLast7Days: number
  viewsLast30Days: number
}

/**
 * Hook para buscar estatísticas de visualização com cache
 */
export function useEventViewStats(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ViewStats>(
    eventId ? `/api/events/${eventId}/stats` : null,
    apiFetcher,
    {
      ...DEFAULT_SWR_CONFIG,
      refreshInterval: 60000, // Atualizar a cada 1 minuto
    }
  )
  
  return {
    stats: data || { totalViews: 0, viewsToday: 0, viewsLast7Days: 0, viewsLast30Days: 0 },
    error,
    isLoading,
    refresh: mutate,
  }
}

// === UTILITÁRIOS ===

/**
 * Invalida cache de um recurso específico
 */
export function invalidateCache(key: string) {
  globalMutate(key)
}

/**
 * Invalida todos os caches relacionados a um evento
 */
export function invalidateEventCache(eventId: string) {
  globalMutate(`/api/events/${eventId}`)
  globalMutate(`registrations:event_id=${eventId}`)
  globalMutate(`affiliate_coupons:event_id=${eventId}`)
  globalMutate(`event_affiliate_invites:event_id=${eventId}`)
  globalMutate(`/api/events/${eventId}/stats`)
}

/**
 * Pré-carrega dados em cache
 */
export function prefetchEvent(eventId: string) {
  globalMutate(`/api/events/${eventId}`, apiFetcher(`/api/events/${eventId}`))
}

export default {
  useEvent,
  useOrganizerEvents,
  useEventRegistrations,
  useUserRegistrations,
  useEventCoupons,
  useEventAffiliates,
  useEventViewStats,
  invalidateCache,
  invalidateEventCache,
  prefetchEvent,
}

