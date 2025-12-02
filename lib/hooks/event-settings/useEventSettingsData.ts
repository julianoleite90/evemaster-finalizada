import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"
import { toast } from "sonner"

interface EventData {
  name: string
  description: string
  category: string
  language: "pt" | "es" | "en"
  event_date: string
  start_time: string
  end_time: string
  location: string
  address: string
  address_number: string
  city: string
  state: string
  zip_code: string
  banner_url: string
  status: string
  difficulty_level: "Fácil" | "Moderado" | "Difícil" | "Muito Difícil" | ""
  major_access: boolean
  major_access_type: string
  race_type: "asfalto" | "trail" | "misto" | ""
  show_in_showcase: boolean
  quantidade_total: number | null
}

interface Pixels {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
}

export function useEventSettingsData(eventId: string) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  const [eventData, setEventData] = useState<EventData>({
    name: "",
    description: "",
    category: "",
    language: "pt",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    address: "",
    address_number: "",
    city: "",
    state: "",
    zip_code: "",
    banner_url: "",
    status: "draft",
    difficulty_level: "",
    major_access: false,
    major_access_type: "",
    race_type: "",
    show_in_showcase: false,
    quantidade_total: null,
  })
  const [batches, setBatches] = useState<any[]>([])
  const [pixels, setPixels] = useState<Pixels>({
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
  })

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Você precisa estar logado")
        return
      }

      // Verificar acesso
      const access = await getOrganizerAccess(supabase, user.id)
      if (!access) {
        console.error("❌ [EVENT SETTINGS] Usuário não tem acesso ao dashboard do organizador")
        toast.error("Você não tem permissão para acessar este dashboard")
        return
      }

      const organizerId = access.organizerId
      setOrganizerId(organizerId)

      // Buscar evento
      const { data: event, error } = await supabase
        .from("events")
        .select(`
          *,
          ticket_batches (
            *,
            tickets (*)
          ),
          event_settings (
            *
          )
        `)
        .eq("id", eventId)
        .eq("organizer_id", organizerId)
        .single()

      if (error || !event) {
        console.error("Erro ao buscar evento:", error)
        toast.error("Erro ao carregar evento")
        return
      }

      // Atualizar estado do evento
      setEventData({
        name: event.name || "",
        description: event.description || "",
        category: event.category || "",
        language: event.language || "pt",
        event_date: event.event_date ? event.event_date.split("T")[0] : "",
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        location: event.location || "",
        address: event.address || "",
        address_number: event.address_number || "",
        city: event.city || "",
        state: event.state || "",
        zip_code: event.zip_code || "",
        banner_url: event.banner_url || "",
        status: event.status || "draft",
        difficulty_level: event.difficulty_level || "",
        major_access: event.major_access || false,
        major_access_type: event.major_access_type || "",
        race_type: event.race_type || "",
        show_in_showcase: event.show_in_showcase || false,
        quantidade_total: event.quantidade_total || null,
      })

      // Atualizar lotes
      setBatches(event.ticket_batches || [])

      // Atualizar pixels
      const settings = event.event_settings?.[0]
      if (settings) {
        setPixels({
          google_analytics_id: settings.analytics_google_analytics_id || "",
          google_tag_manager_id: settings.analytics_gtm_id || "",
          facebook_pixel_id: settings.analytics_facebook_pixel_id || "",
        })
      }
    } catch (error: any) {
      console.error("Erro ao carregar evento:", error)
      toast.error("Erro ao carregar dados do evento")
    } finally {
      setLoading(false)
    }
  }

  const updateEventData = async (updates: Partial<EventData>) => {
    try {
      setSaving(true)
      const supabase = createClient()

      const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", eventId)

      if (error) throw error

      setEventData(prev => ({ ...prev, ...updates }))
      toast.success("Dados atualizados com sucesso!")
    } catch (error: any) {
      console.error("Erro ao atualizar evento:", error)
      toast.error("Erro ao atualizar dados")
    } finally {
      setSaving(false)
    }
  }

  const updatePixels = async (updates: Partial<Pixels>) => {
    try {
      setSaving(true)
      const supabase = createClient()

      // Buscar event_settings atual
      const { data: settings } = await supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle()

      if (settings) {
        // Atualizar
        const { error } = await supabase
          .from("event_settings")
          .update({
            analytics_google_analytics_id: updates.google_analytics_id ?? pixels.google_analytics_id,
            analytics_gtm_id: updates.google_tag_manager_id ?? pixels.google_tag_manager_id,
            analytics_facebook_pixel_id: updates.facebook_pixel_id ?? pixels.facebook_pixel_id,
          })
          .eq("event_id", eventId)

        if (error) throw error
      } else {
        // Criar
        const { error } = await supabase
          .from("event_settings")
          .insert({
            event_id: eventId,
            analytics_google_analytics_id: updates.google_analytics_id ?? pixels.google_analytics_id,
            analytics_gtm_id: updates.google_tag_manager_id ?? pixels.google_tag_manager_id,
            analytics_facebook_pixel_id: updates.facebook_pixel_id ?? pixels.facebook_pixel_id,
          })

        if (error) throw error
      }

      setPixels(prev => ({ ...prev, ...updates }))
      toast.success("Pixels atualizados com sucesso!")
    } catch (error: any) {
      console.error("Erro ao atualizar pixels:", error)
      toast.error("Erro ao atualizar pixels")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  return {
    loading,
    saving,
    organizerId,
    eventData,
    setEventData,
    batches,
    setBatches,
    pixels,
    setPixels,
    updateEventData,
    updatePixels,
    refetch: fetchEvent,
  }
}

