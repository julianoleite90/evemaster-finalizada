import { createClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/utils/slug"
import type { PostgrestError } from "@supabase/supabase-js"

// Tipos temporários até os tipos do database serem gerados
type Event = any
type TicketBatch = any
type Ticket = any

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
export async function getEventBySlug(slug: string) {
  const supabase = await createClient()
  
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
        event_settings (*),
        event_images:event_images (
          id,
          image_url,
          image_order
        ),
        organizer:organizers(id, company_name, full_name, company_cnpj, company_phone, user_id)
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
        event_settings (*),
        event_images:event_images (
          id,
          image_url,
          image_order
        )
      `)
      .eq("slug", slug)
      .order("created_at", { ascending: false })
    
    if (eventsBySlug && eventsBySlug.length > 0) {
      event = eventsBySlug[0] // Pegar o primeiro (mais recente)
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
          
          console.log("📋 [DEBUG ORGANIZADOR SERVER] Dados do organizador (view padronizada):", {
            organizer_id: event.organizer_id,
            company_name: event.organizer.company_name,
            company_cnpj: event.organizer.company_cnpj,
            company_phone: event.organizer.company_phone,
            email: event.organizer.email,
            events_last_year: event.organizer.events_last_year
          })
        } else {
          console.log("⚠️ [DEBUG ORGANIZADOR SERVER] Organizador não encontrado:", organizerError?.message)
        }
      }
    } else {
      error = slugError
    }
  }

  if (error) {
    console.error("Erro ao buscar evento:", error)
    throw error
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


