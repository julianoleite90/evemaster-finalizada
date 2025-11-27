import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/utils/slug"
import type { PostgrestError } from "@supabase/supabase-js"

// Helper para criar cliente apropriado baseado no ambiente
async function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Servidor: usa server client
    return await createServerClient()
  } else {
    // Browser: usa browser client
    return createBrowserClient()
  }
}

// Tipos temporários até os tipos do database serem gerados
type Event = any
type TicketBatch = any
type Ticket = any

// Criar evento completo (com lotes e ingressos)
export async function createEvent(eventData: {
  organizer_id: string
  name: string
  description: string
  category: string
  event_date: string
  start_time: string
  end_time?: string
  location?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  banner_url?: string
  gpx_file_url?: string
  distances?: string[]
  custom_distances?: string[]
  total_capacity?: number
  lotes: Array<{
    name: string
    start_date: string
    start_time: string
    end_date: string
    total_quantity: number
    tickets: Array<{
      category: string
      price: number
      is_free: boolean
      quantity: number
      has_kit: boolean
      kit_items?: string[]
      shirt_sizes?: string[]
      shirt_quantities?: Record<string, number>
    }>
  }>
  settings?: {
    payment_pix_enabled?: boolean
    payment_credit_card_enabled?: boolean
    payment_boleto_enabled?: boolean
    payment_max_installments?: number
    payment_assume_interest?: boolean
  }
}) {
  const supabase = await getSupabaseClient()

  // 1. Gerar slug único
  const baseSlug = generateSlug(eventData.name)
  let finalSlug = baseSlug
  let counter = 0
  
  // Verificar se o slug já existe e gerar um único
  while (true) {
    const { data: existingEvent } = await supabase
      .from("events")
      .select("id")
      .eq("slug", finalSlug)
      .single()
    
    if (!existingEvent) {
      break // Slug é único
    }
    
    counter++
    finalSlug = `${baseSlug}-${counter}`
  }
  
  // 2. Criar o evento com slug único
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      organizer_id: eventData.organizer_id,
      name: eventData.name,
      slug: finalSlug,
      description: eventData.description,
      category: eventData.category,
      event_date: eventData.event_date,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      location: eventData.location,
      address: eventData.address,
      city: eventData.city,
      state: eventData.state,
      zip_code: eventData.zip_code,
      banner_url: eventData.banner_url,
      gpx_file_url: eventData.gpx_file_url,
      distances: eventData.distances,
      custom_distances: eventData.custom_distances,
      total_capacity: eventData.total_capacity,
      status: "draft",
    })
    .select()
    .single()

  if (eventError) throw eventError
  if (!event) throw new Error("Falha ao criar evento")

  // 3. Criar configurações do evento
  if (eventData.settings) {
    await supabase.from("event_settings").insert({
      event_id: event.id,
      payment_pix_enabled: eventData.settings.payment_pix_enabled ?? true,
      payment_credit_card_enabled: eventData.settings.payment_credit_card_enabled ?? true,
      payment_boleto_enabled: eventData.settings.payment_boleto_enabled ?? true,
      payment_max_installments: eventData.settings.payment_max_installments ?? 12,
      payment_assume_interest: eventData.settings.payment_assume_interest ?? false,
    })
  }

  // 4. Criar lotes e ingressos
  for (const lote of eventData.lotes) {
    const { data: batch, error: batchError } = await supabase
      .from("ticket_batches")
      .insert({
        event_id: event.id,
        name: lote.name,
        start_date: lote.start_date,
        start_time: lote.start_time,
        end_date: lote.end_date,
        total_quantity: lote.total_quantity,
        is_active: true,
      })
      .select()
      .single()

    if (batchError) throw batchError
    if (!batch) continue

    // Criar ingressos do lote
    const tickets = lote.tickets.map((ticket) => ({
      batch_id: batch.id,
      category: ticket.category,
      price: ticket.price,
      is_free: ticket.is_free,
      quantity: ticket.quantity,
      has_kit: ticket.has_kit,
      kit_items: ticket.kit_items || [],
      shirt_sizes: ticket.shirt_sizes || [],
      shirt_quantities: ticket.shirt_quantities || {},
    }))

    const { error: ticketsError } = await supabase.from("tickets").insert(tickets)
    if (ticketsError) throw ticketsError
  }

  return event
}

// Buscar evento por ID
export async function getEventById(eventId: string) {
  const supabase = await getSupabaseClient()

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

export async function getEventBySlug(slug: string) {
  const supabase = await getSupabaseClient()
  
  console.log("🔍 getEventBySlug chamado com:", slug)
  console.log("🔧 Versão atualizada dos logs")
  
  // Verificar se é um UUID primeiro
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  let event: Event | null = null
  let error: PostgrestError | null = null
  
  if (uuidRegex.test(slug)) {
    console.log("📋 Detectado UUID, buscando por ID...")
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
        organizer:organizers(id, company_name, full_name)
      `)
      .eq("id", slug)
      .single()
    
    event = eventById
    error = idError
    console.log("📊 Resultado busca por ID:", { event: !!event, error })
  } else {
    console.log("🏷️ Buscando por slug...")
    // Buscar por slug - corrigido para múltiplos resultados
    console.log("🔍 Buscando eventos com slug (pode haver duplicatas)...")
    console.log("🔐 Verificando se há problema de RLS (Row Level Security)...")
    
    // Primeiro, tentar busca simples sem joins para testar RLS
    const { data: simpleEvents, error: simpleError } = await supabase
      .from("events")
      .select("id, name, slug, organizer_id, status")
      .eq("slug", slug)
    
    console.log("🔍 Busca simples - Encontrados:", simpleEvents?.length || 0)
    console.log("🔍 Busca simples - Eventos:", simpleEvents)
    console.log("🔍 Busca simples - Erro:", simpleError?.message || "Nenhum erro")
    if (simpleError) {
      console.log("🔍 Detalhes do erro:", simpleError)
    }
    
    // Se encontrou na busca simples, fazer busca completa (sem joins problemáticos)
    console.log("✅ Evento encontrado na busca simples, fazendo busca completa...")
    const { data: eventsBySlug, error: slugError } = await supabase
      .from("events")
      .select(`
        *,
        ticket_batches (
          *,
          tickets (*)
        ),
        event_settings (*)
      `)
      .eq("slug", slug)
      .order("created_at", { ascending: false }) // Pegar o mais recente
    
    console.log("📊 Busca completa - Encontrados:", eventsBySlug?.length || 0)
    if (slugError) {
      console.log("📊 Erro na busca completa:", slugError.message)
    }
    
    console.log(`📊 Encontrados ${eventsBySlug?.length || 0} eventos com slug "${slug}"`)
    
    if (eventsBySlug && eventsBySlug.length > 0) {
      console.log("📋 Eventos encontrados:", eventsBySlug.map(e => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        organizer_id: e.organizer_id
      })))
    }
    
    if (eventsBySlug && eventsBySlug.length > 0) {
      event = eventsBySlug[0] // Pegar o primeiro (mais recente)
      error = null
      if (eventsBySlug.length > 1) {
        console.log(`⚠️ ATENÇÃO: ${eventsBySlug.length} eventos com mesmo slug! Usando o mais recente.`)
      }
      
      // Buscar organizador separadamente para evitar problemas de JOIN
      if (event.organizer_id) {
        console.log("🔍 Buscando organizador separadamente...")
        const { data: organizer } = await supabase
          .from("organizers")
          .select("id, company_name")
          .eq("id", event.organizer_id)
          .maybeSingle()
        
        if (organizer) {
          event.organizer = organizer
          console.log("✅ Organizador encontrado:", organizer.company_name)
        } else {
          console.log("⚠️ Organizador não encontrado para organizer_id:", event.organizer_id)
          // Vamos verificar se existe algum organizador na tabela
          const { data: allOrganizers, error: orgError } = await supabase
            .from("organizers")
            .select("id, company_name, user_id")
            .limit(10)
          
          console.log("🔍 Organizadores existentes na tabela:", allOrganizers)
          console.log("🔍 Erro ao buscar organizadores:", orgError?.message || "Nenhum erro")
          
          if (allOrganizers && allOrganizers.length > 0) {
            console.log("📊 Total de organizadores encontrados:", allOrganizers.length)
            allOrganizers.forEach((org, index) => {
              console.log(`  ${index + 1}. ID: ${org.id} | User ID: ${org.user_id} | Nome: ${org.company_name}`)
            })
            
            // Verificar se o organizador procurado existe em alguma variação
            const targetOrg = allOrganizers.find(org => 
              org.id === event.organizer_id || 
              org.user_id === event.organizer_id
            )
            
            if (targetOrg) {
              console.log("✅ Organizador encontrado por busca alternativa:", targetOrg)
              event.organizer = targetOrg
            } else {
              console.log("❌ Organizador não encontrado nem por busca alternativa")
            }
          } else {
            console.log("❌ Nenhum organizador encontrado na tabela!")
          }
        }
      }
    } else {
      event = null
      error = slugError
    }
  }

  if (error) {
    console.error("❌ Erro na busca:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return null
  }

  if (!event) {
    console.log("❌ Nenhum evento encontrado")
    return null
  }

  console.log("✅ Evento encontrado:", event.name)
  console.log("📊 Dados do evento:")
  console.log("- ID:", event.id)
  console.log("- Nome:", event.name)
  console.log("- Organizador ID:", event.organizer_id)
  console.log("- Ticket Batches:", event.ticket_batches?.length || 0)
  if (event.ticket_batches && event.ticket_batches.length > 0) {
    event.ticket_batches.forEach((batch: TicketBatch, index: number) => {
      console.log(`- Lote ${index + 1}:`, {
        id: batch.id,
        name: batch.name,
        total_quantity: batch.total_quantity,
        is_active: batch.is_active,
        start_date: batch.start_date,
        end_date: batch.end_date,
        tickets: batch.tickets?.length || 0
      })
      
      if (batch.tickets && batch.tickets.length > 0) {
        console.log(`  - Ingressos do lote ${batch.name}:`)
        batch.tickets.forEach((ticket: Ticket, ticketIndex: number) => {
          console.log(`    ${ticketIndex + 1}. ${ticket.name} - R$ ${ticket.price} (${ticket.category})`)
        })
      } else {
        console.log(`  ⚠️ Lote ${batch.name} não tem ingressos!`)
        // Vamos verificar se há tickets diretamente na tabela
        console.log(`  🔍 Verificando tickets diretamente na tabela para batch_id: ${batch.id}`)
      }
    })
  } else {
    console.log("⚠️ Nenhum lote de ingresso encontrado!")
  }
  return event
}

// Buscar eventos do organizador
export async function getOrganizerEvents(organizerId: string) {
  const supabase = await getSupabaseClient()

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
        console.log(`🔧 Gerando slug para evento: ${event.name}`)
        const baseSlug = generateSlug(event.name)
        let finalSlug = baseSlug
        let counter = 0
        
        // Verificar se o slug já existe e gerar um único
        while (true) {
          const { data: existingEvent } = await supabase
            .from("events")
            .select("id")
            .eq("slug", finalSlug)
            .neq("id", event.id) // Excluir o próprio evento
            .single()
          
          if (!existingEvent) {
            break // Slug é único
          }
          
          counter++
          finalSlug = `${baseSlug}-${counter}`
        }
        
        // Atualizar o evento com o slug
        await supabase
          .from("events")
          .update({ slug: finalSlug })
          .eq("id", event.id)
        
        // Atualizar o objeto local
        event.slug = finalSlug
        console.log(`✅ Slug gerado: ${finalSlug}`)
      }
    }
  }
  
  return events
}

// Atualizar evento
export async function updateEvent(eventId: string, updates: Partial<Event>) {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single()

  if (error) throw error
  return data
}