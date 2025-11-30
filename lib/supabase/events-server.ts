import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { generateSlug } from "@/lib/utils/slug"
import type { PostgrestError } from "@supabase/supabase-js"

// Tipos temporários até os tipos do database serem gerados
type Event = any
type TicketBatch = any
type Ticket = any

// Cliente Supabase SEM cookies - para buscar dados públicos (metadata, etc.)
// Isso é necessário porque o generateMetadata roda sem contexto de request/cookies
function createPublicClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Buscar evento por ID (server-side)
export async function getEventById(eventId: string) {
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      ticket_batches (
        *,
        tickets (*)
      ),
      event_settings (*)
    `)
    .eq("id", eventId)
    .single()

  if (error) throw error
  return event
}

// Buscar evento por slug (server-side)
// Usa cliente público SEM cookies para garantir que funcione no generateMetadata
export async function getEventBySlug(slug: string) {
  // Usar cliente público (sem cookies) para buscar dados públicos
  // Isso é necessário para o generateMetadata funcionar corretamente
  const supabase = createPublicClient()
  
  console.log('[getEventBySlug] Buscando evento com slug:', slug)
  console.log('[getEventBySlug] Usando cliente público (sem cookies)')
  
  // Verificar se é um UUID primeiro
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  let event: Event | null = null
  let error: PostgrestError | null = null
  
  if (uuidRegex.test(slug)) {
    // É um UUID, buscar por ID
    const { data: eventById, error: idError } = await supabase
      .from("events")
      .select(`
        *,
        ticket_batches (
          *,
          tickets (*)
        ),
        event_settings (
          *,
          analytics_google_analytics_id,
          analytics_google_analytics_enabled,
          analytics_gtm_container_id,
          analytics_gtm_enabled,
          analytics_facebook_pixel_id,
          analytics_facebook_pixel_enabled
        ),
        organizer:organizers(id, company_name, full_name, company_cnpj, company_phone, company_email, user_id, average_rating, total_reviews)
      `)
      .eq("id", slug)
      .single()
    
    event = eventById
    error = idError
  } else {
    // Buscar por slug
    const { data: eventsBySlug, error: slugError } = await supabase
      .from("events")
      .select(`
        *,
        ticket_batches (
          *,
          tickets (*)
        ),
        event_settings (
          *,
          analytics_google_analytics_id,
          analytics_google_analytics_enabled,
          analytics_gtm_container_id,
          analytics_gtm_enabled,
          analytics_facebook_pixel_id,
          analytics_facebook_pixel_enabled
        )
      `)
      .eq("slug", slug)
      .order("created_at", { ascending: false })
    
    if (slugError) {
      console.error('[getEventBySlug] Erro ao buscar por slug:', slugError)
      error = slugError
    } else if (eventsBySlug && eventsBySlug.length > 0) {
      event = eventsBySlug[0] // Pegar o primeiro (mais recente)
      console.log('[getEventBySlug] Evento encontrado:', { id: event.id, name: event.name, hasBanner: !!event.banner_url })
      error = null
      
      // Buscar organizador separadamente usando view padronizada
      if (event.organizer_id) {
        const { data: organizerData, error: organizerError } = await supabase
          .from("organizer_complete_view")
          .select("*")
          .eq("organizer_id", event.organizer_id)
          .single()
        
        if (organizerData) {
          // Formatar dados para o formato esperado
          event.organizer = {
            id: organizerData.organizer_id,
            company_name: organizerData.company_name,
            full_name: organizerData.user_full_name, // Nome do usuário como fallback
            company_cnpj: organizerData.company_cnpj,
            company_phone: organizerData.company_phone,
            user_id: organizerData.user_id,
            email: organizerData.user_email,
            company_email: organizerData.user_email,
            events_last_year: organizerData.events_last_year || 0
          }
        }
        // Se não encontrar organizador, não é crítico - apenas não terá dados do organizador
      }
    } else {
      // Nenhum evento encontrado - não é erro, apenas não encontrado
      console.warn('[getEventBySlug] Nenhum evento encontrado para slug:', slug)
      error = null
      event = null
    }
  }

  if (error) {
    // Se o erro for "not found", retornar null ao invés de lançar erro
    if (error.code === 'PGRST116' || error.message?.includes('not found')) {
      console.warn(`[getEventBySlug] Evento não encontrado para slug: ${slug}`)
      return null
    }
    console.error("Erro ao buscar evento:", error)
    throw error
  }

  // Se não encontrou evento, retornar null
  if (!event) {
    return null
  }

  return event
}

// Buscar eventos do organizador (server-side)
export async function getOrganizerEvents(organizerId: string) {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false })

  if (error) throw error
  
  // Verificar se há eventos sem slug e gerar automaticamente
  if (events) {
    for (const event of events) {
      if (!event.slug) {
        const baseSlug = generateSlug(event.name)
        let finalSlug = baseSlug
        let counter = 0
        
        // Verificar se o slug já existe e gerar um único
        while (true) {
          const { data: existingEvent } = await supabase
            .from("events")
            .select("id")
            .eq("slug", finalSlug)
            .neq("id", event.id)
            .single()
          
          if (!existingEvent) {
            break
          }
          
          counter++
          finalSlug = `${baseSlug}-${counter}`
        }
        
        // Atualizar o evento com o slug
        await supabase
          .from("events")
          .update({ slug: finalSlug })
          .eq("id", event.id)
        
        event.slug = finalSlug
      }
    }
  }
  
  return events
}


