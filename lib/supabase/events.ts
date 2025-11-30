import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { generateSlug } from "@/lib/utils/slug"
import type { PostgrestError } from "@supabase/supabase-js"

// Helper para criar cliente - sempre usa browser client
// Para server-side, use as funções de events-server.ts
function getSupabaseClient() {
  return createBrowserClient()
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
  language?: "pt" | "es" | "en"
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
  difficulty_level?: "Fácil" | "Moderado" | "Difícil" | "Muito Difícil"
  major_access?: boolean
  major_access_type?: string
  race_type?: "asfalto" | "trail" | "misto"
  lotes: Array<{
    name: string
    start_date: string
    start_time: string
    end_date: string
    total_quantity: number | null
    tickets: Array<{
      category: string
      price: number
      is_free: boolean
      quantity: number | null
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
  const insertData: any = {
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
    }

    // Adicionar campos novos apenas se existirem (após migration)
    if (eventData.language) {
      insertData.language = eventData.language
    }
    if (eventData.difficulty_level) {
      insertData.difficulty_level = eventData.difficulty_level
    }
    if (eventData.major_access !== undefined) {
      insertData.major_access = eventData.major_access
    }
    if (eventData.major_access_type) {
      insertData.major_access_type = eventData.major_access_type
    }
    if (eventData.race_type) {
      insertData.race_type = eventData.race_type
    }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert(insertData)
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
        organizer:organizers(id, company_name, full_name, company_cnpj, company_phone, user_id)
      `)
      .eq("id", slug)
      .single()
    
    event = eventById
    error = idError
  } else {
    // Buscar por slug - corrigido para múltiplos resultados
    // Primeiro, tentar busca simples sem joins para testar RLS
    const { data: simpleEvents, error: simpleError } = await supabase
      .from("events")
      .select("id, name, slug, organizer_id, status")
      .eq("slug", slug)
    
    // Se encontrou na busca simples, fazer busca completa (sem joins problemáticos)
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
      .order("created_at", { ascending: false }) // Pegar o mais recente
    
    if (eventsBySlug && eventsBySlug.length > 0) {
      event = eventsBySlug[0] // Pegar o primeiro (mais recente)
      error = null
      
      // Buscar organizador separadamente usando função padronizada
      if (event.organizer_id) {
        
        // Usar a view padronizada para buscar todos os dados
        const { data: organizerData, error: organizerError } = await supabase
          .from("organizer_complete_view")
          .select("*")
          .eq("organizer_id", event.organizer_id)
            .single()
          
        let organizer: any = null
        
        if (organizerData) {
          // Formatar dados para o formato esperado
              organizer = {
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
        
        if (organizer) {
          // Garantir que todos os campos estejam presentes
          event.organizer = {
            ...organizer,
            company_cnpj: organizer.company_cnpj || null,
            company_phone: organizer.company_phone || null,
            events_last_year: (organizer as any).events_last_year ?? 0
          }
        } else {
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
              console.log("✅ Organizador encontrado por busca alternativa, buscando dados completos...")
              // Buscar dados completos do organizador
              let { data: fullOrganizer } = await supabase
                .from("organizers")
                .select("id, company_name, full_name, company_cnpj, company_phone, user_id")
                .eq("id", targetOrg.id)
                .single()
              
              if (fullOrganizer) {
                // Buscar email do usuário relacionado
                if (fullOrganizer.user_id) {
                  console.log("🔍 Buscando email do usuário (busca alternativa), user_id:", fullOrganizer.user_id)
                  const { data: user, error: userError } = await supabase
                    .from("users")
                    .select("email")
                    .eq("id", fullOrganizer.user_id)
                    .single()
                  
                  console.log("📧 Resultado busca email (alternativa):", { user, error: userError?.message })
                  
                  if (user && user.email) {
                    fullOrganizer = {
                      ...fullOrganizer,
                      email: user.email,
                      company_email: user.email
                    } as any
                    console.log("✅ Email adicionado ao organizador (alternativa):", user.email)
                  } else {
                    // Tentar buscar do auth.users se não encontrar em public.users
                    console.log("⚠️ Tentando buscar email do auth.users...")
                    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(fullOrganizer.user_id).catch(() => ({ data: null, error: null }))
                  }
                }
                
                console.log("✅ Organizador encontrado por busca alternativa:", fullOrganizer)
                event.organizer = fullOrganizer
              } else {
                event.organizer = targetOrg
              }
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
    return null
  }

  if (event.ticket_batches && event.ticket_batches.length > 0) {
    event.ticket_batches.forEach((batch: TicketBatch) => {
      if (!batch.tickets || batch.tickets.length === 0) {
        // Verificar se há tickets diretamente na tabela se necessário
      }
    })
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