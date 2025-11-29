"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  CreditCard,
  BarChart3,
  Mail,
  ShoppingCart,
  Save,
  ArrowLeft,
  Info,
  Facebook,
  Search,
  Code,
  FileText,
  Loader2,
  Upload,
  MapPin,
  Calendar,
  Clock,
  Trophy,
  Package,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Route,
  Mountain,
  Edit3,
  Tag,
  UserPlus,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getEventById } from "@/lib/supabase/events"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { uploadEventBanner, uploadTicketGPX } from "@/lib/supabase/storage"
import dynamic from "next/dynamic"
import Image from "next/image"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"

// Modalidades esportivas
const MODALIDADES_ESPORTIVAS = [
  { value: "corrida", label: "Corrida" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "triatlo", label: "Triatlo" },
  { value: "natacao", label: "Natação" },
  { value: "caminhada", label: "Caminhada" },
  { value: "trail-running", label: "Trail Running" },
  { value: "mountain-bike", label: "Mountain Bike" },
  { value: "duatlo", label: "Duatlo" },
  { value: "aquatlo", label: "Aquatlo" },
  { value: "ciclismo-estrada", label: "Ciclismo de Estrada" },
  { value: "ciclismo-mtb", label: "Ciclismo MTB" },
  { value: "outro", label: "Outro" },
]

// Tamanhos de camiseta
const TAMANHOS_CAMISETA = [
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XG", label: "XG" },
  { value: "XXG", label: "XXG" },
]

// Itens do kit
const ITENS_KIT = [
  { value: "camiseta", label: "Camiseta" },
  { value: "medalha", label: "Medalha" },
  { value: "numero", label: "Número de Peito" },
  { value: "chip", label: "Chip de Cronometragem" },
  { value: "sacola", label: "Sacola" },
  { value: "outros", label: "Outros" },
]

export default function EventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { canView, canEdit, canCreate, canDelete, isPrimary, loading: permissionsLoading } = useUserPermissions()
  const fieldDisabled = !canEdit && !isPrimary
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newBanner, setNewBanner] = useState<File | null>(null)
  const [expandedBatches, setExpandedBatches] = useState<{ [key: string]: boolean }>({})
  const [mainMenu, setMainMenu] = useState<"edicao" | "configuracao" | "relatorios">("edicao")
  const [subMenu, setSubMenu] = useState<string>("basico")

  // Dados básicos do evento
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    category: "",
    language: "pt" as "pt" | "es" | "en",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    banner_url: "",
    status: "draft",
    difficulty_level: "" as "Fácil" | "Moderado" | "Difícil" | "Muito Difícil" | "",
    major_access: false,
    major_access_type: "",
    race_type: "" as "asfalto" | "trail" | "misto" | "",
    show_in_showcase: false,
  })

  // Lotes e ingressos
  const [batches, setBatches] = useState<any[]>([])

  // Pixels de rastreamento
  const [pixels, setPixels] = useState({
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
  })

  // Afiliados
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [showAddAffiliate, setShowAddAffiliate] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<any | null>(null)
  const [newAffiliate, setNewAffiliate] = useState({
    email: "",
    commission_type: "percentage" as "percentage" | "fixed",
    commission_value: "",
  })
  const [organizerId, setOrganizerId] = useState<string | null>(null)

  // Cupons
  const [coupons, setCoupons] = useState<any[]>([])
  const [showAddCoupon, setShowAddCoupon] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null)
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    affiliate_id: "" as string | "",
    max_uses: "",
    expires_at: "",
    is_active: true,
  })

  // Estatísticas de visualizações
  const [viewStats, setViewStats] = useState({
    totalViews: 0,
    viewsToday: 0,
    viewsLast7Days: 0,
    viewsLast30Days: 0,
    conversions: 0,
    conversionRate: 0
  })

  // Buscar estatísticas de visualizações
  const fetchViewStats = async () => {
    try {
      const supabase = createClient()
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const seteDiasAtras = new Date(hoje)
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      const trintaDiasAtras = new Date(hoje)
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

      // Buscar visualizações
      const [viewsToday, viewsLast7Days, viewsLast30Days, totalViews, registrations] = await Promise.all([
        supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", hoje.toISOString()),
        supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", seteDiasAtras.toISOString()),
        supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", trintaDiasAtras.toISOString()),
        supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId),
        supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
      ])

      const viewsTodayCount = viewsToday.count || 0
      const viewsLast7DaysCount = viewsLast7Days.count || 0
      const viewsLast30DaysCount = viewsLast30Days.count || 0
      const totalViewsCount = totalViews.count || 0
      const conversionsCount = registrations.count || 0
      const conversionRateValue = viewsLast30DaysCount > 0 
        ? ((conversionsCount / viewsLast30DaysCount) * 100)
        : 0

      setViewStats({
        totalViews: totalViewsCount,
        viewsToday: viewsTodayCount,
        viewsLast7Days: viewsLast7DaysCount,
        viewsLast30Days: viewsLast30DaysCount,
        conversions: conversionsCount,
        conversionRate: Number(conversionRateValue.toFixed(2))
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas de visualizações:", error)
    }
  }

  // Buscar afiliados do evento
  const fetchAffiliates = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar organizador
      const { data: organizer } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!organizer) return

      setOrganizerId(organizer.id)

      // Buscar convites de afiliados com dados do afiliado e usuário
      const { data: invites, error } = await supabase
        .from("event_affiliate_invites")
        .select(`
          *,
          affiliate:affiliates(
            id,
            user:users(
              id,
              email,
              full_name
            )
          )
        `)
        .eq("event_id", eventId)
        .eq("organizer_id", organizer.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar afiliados:", error)
        return
      }

      setAffiliates(invites || [])
    } catch (error) {
      console.error("Erro ao buscar afiliados:", error)
    }
  }

  // Buscar cupons do evento
  const fetchCoupons = async () => {
    try {
      const supabase = createClient()
      
      // Buscar cupons do evento com dados do afiliado
      const { data: couponsData, error } = await supabase
        .from("affiliate_coupons")
        .select(`
          *,
          affiliate:affiliates(
            id,
            user:users(
              id,
              email,
              full_name
            )
          )
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar cupons:", error)
        return
      }

      setCoupons(couponsData || [])
    } catch (error) {
      console.error("Erro ao buscar cupons:", error)
    }
  }

  // Buscar afiliados aceitos para usar no select de cupons
  const [acceptedAffiliates, setAcceptedAffiliates] = useState<any[]>([])
  const fetchAcceptedAffiliates = async () => {
    try {
      const supabase = createClient()
      
      // Buscar comissões de afiliados aceitos do evento
      const { data: commissions, error } = await supabase
        .from("event_affiliate_commissions")
        .select(`
          *,
          affiliate:affiliates(
            id,
            user:users(
              id,
              email,
              full_name
            )
          )
        `)
        .eq("event_id", eventId)

      if (error) {
        console.error("Erro ao buscar afiliados aceitos:", error)
        return
      }

      setAcceptedAffiliates(commissions || [])
    } catch (error) {
      console.error("Erro ao buscar afiliados aceitos:", error)
    }
  }

  // Carregar dados do evento
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const event = await getEventById(eventId)
        if (event) {
          setEventData({
            name: event.name || "",
            description: event.description || "",
            category: event.category || "",
            language: (event.language === "pt" || event.language === "es" || event.language === "en") ? event.language : "pt",
            event_date: event.event_date || "",
            start_time: event.start_time || "",
            end_time: event.end_time || "",
            location: event.location || "",
            address: event.address || "",
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
          })

          // Carregar lotes e ingressos
          if (event.ticket_batches) {
            setBatches(event.ticket_batches.map((batch: any) => ({
              ...batch,
              tickets: batch.tickets || [],
            })))
            // Expandir primeiro lote por padrão
            if (event.ticket_batches.length > 0) {
              setExpandedBatches({ [event.ticket_batches[0].id]: true })
            }
          }

          // Carregar configurações do evento (incluindo pixels)
          if (event.event_settings) {
            const settings = event.event_settings[0] || {}
            setPixels({
              google_analytics_id: settings.analytics_google_analytics_id || "",
              google_tag_manager_id: settings.analytics_gtm_container_id || "",
              facebook_pixel_id: settings.analytics_facebook_pixel_id || "",
            })
          } else {
            // Se não tem settings, buscar separadamente
            const { data: settingsData } = await supabase
              .from("event_settings")
              .select("*")
              .eq("event_id", eventId)
              .maybeSingle()
            
            if (settingsData) {
              setPixels({
                google_analytics_id: settingsData.analytics_google_analytics_id || "",
                google_tag_manager_id: settingsData.analytics_gtm_container_id || "",
                facebook_pixel_id: settingsData.analytics_facebook_pixel_id || "",
              })
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar evento:", error)
        toast.error("Erro ao carregar dados do evento")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
      fetchAffiliates()
    }
  }, [eventId])

  // Buscar afiliados quando a tab de afiliados for selecionada
  useEffect(() => {
    if (subMenu === "afiliados" && eventId) {
      fetchAffiliates()
    }
  }, [subMenu, eventId])

  // Buscar cupons quando a tab de cupons for selecionada
  useEffect(() => {
    if (subMenu === "cupons" && eventId) {
      fetchCoupons()
      fetchAcceptedAffiliates()
    }
  }, [subMenu, eventId])

  // Buscar estatísticas quando entrar na seção de relatórios
  useEffect(() => {
    if (mainMenu === "relatorios" && eventId) {
      fetchViewStats()
    }
  }, [mainMenu, eventId])

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }))
  }

  const handleSaveEventData = async () => {
    // Verificar permissões antes de salvar
    if (!canEdit && !isPrimary) {
      toast.error("Você não tem permissão para editar eventos")
      return
    }
    try {
      console.log("🔵 [DEBUG] Iniciando salvamento do evento...")
      console.log("🔵 [DEBUG] Event ID:", eventId)
      setSaving(true)
      const supabase = createClient()

      // Se tem novo banner, fazer upload
      let bannerUrl = eventData.banner_url
      if (newBanner) {
        console.log("🔵 [DEBUG] Novo banner detectado, fazendo upload...")
        try {
          bannerUrl = await uploadEventBanner(newBanner, eventId)
          console.log("🔵 [DEBUG] Banner upload concluído:", bannerUrl)
          toast.success("Banner atualizado!")
        } catch (error) {
          console.error("🔴 [DEBUG] Erro ao fazer upload do banner:", error)
          toast.error("Erro ao fazer upload do banner")
        }
      }

      console.log("🔵 [DEBUG] Construindo updateData...")
      console.log("🔵 [DEBUG] eventData atual:", {
        name: eventData.name,
        category: eventData.category,
        difficulty_level: eventData.difficulty_level,
        major_access: eventData.major_access,
        major_access_type: eventData.major_access_type,
        race_type: eventData.race_type,
      })

      const updateData: any = {
        name: eventData.name,
        description: eventData.description,
        category: eventData.category,
        language: eventData.language,
        event_date: eventData.event_date,
        start_time: eventData.start_time,
        end_time: eventData.end_time || null,
        location: eventData.location,
        address: eventData.address,
        city: eventData.city,
        state: eventData.state,
        zip_code: eventData.zip_code,
        banner_url: bannerUrl,
        status: eventData.status,
        updated_at: new Date().toISOString(),
      }

      // Adicionar campos novos apenas se existirem (após migration)
      if (eventData.difficulty_level) {
        updateData.difficulty_level = eventData.difficulty_level
        console.log("🔵 [DEBUG] Adicionado difficulty_level:", eventData.difficulty_level)
      }
      if (eventData.major_access !== undefined) {
        updateData.major_access = eventData.major_access
        console.log("🔵 [DEBUG] Adicionado major_access:", eventData.major_access)
      }
      if (eventData.major_access_type) {
        updateData.major_access_type = eventData.major_access_type
        console.log("🔵 [DEBUG] Adicionado major_access_type:", eventData.major_access_type)
      }
      if (eventData.race_type) {
        updateData.race_type = eventData.race_type
        console.log("🔵 [DEBUG] Adicionado race_type:", eventData.race_type)
      }
      // show_in_showcase - apenas adicionar se a coluna existir no banco
      // A migração 042_add_show_in_showcase.sql deve ser aplicada primeiro
      if (eventData.show_in_showcase !== undefined) {
        updateData.show_in_showcase = eventData.show_in_showcase
        console.log("🔵 [DEBUG] Adicionado show_in_showcase:", eventData.show_in_showcase)
      }

      console.log("🔵 [DEBUG] updateData completo:", JSON.stringify(updateData, null, 2))
      console.log("🔵 [DEBUG] Chamando Supabase update...")

      let { data, error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", eventId)
        .select()
        .single()

      // Se o erro for relacionado à coluna show_in_showcase não existir, tentar novamente sem ela
      if (error && error.message?.includes("show_in_showcase")) {
        console.warn("⚠️ [DEBUG] Coluna show_in_showcase não encontrada. Removendo do update e tentando novamente...")
        const { show_in_showcase, ...updateDataWithoutShowcase } = updateData
        const retryResult = await supabase
          .from("events")
          .update(updateDataWithoutShowcase)
          .eq("id", eventId)
          .select()
          .single()
        data = retryResult.data
        error = retryResult.error
        if (!error) {
          toast.warning("Campo 'Exibir na Vitrine' não está disponível. Aplique a migração 042_add_show_in_showcase.sql")
        }
      }

      console.log("🔵 [DEBUG] Resposta do Supabase:")
      console.log("  - Data:", data ? "✅ Recebido" : "❌ Nulo")
      console.log("  - Error:", error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      } : "✅ Nenhum erro")

      if (error) {
        console.error("🔴 [DEBUG] Erro do Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        })
        throw error
      }

      console.log("✅ [DEBUG] Evento salvo com sucesso!")
      console.log("✅ [DEBUG] Dados retornados:", data)

      setEventData(prev => ({ ...prev, banner_url: bannerUrl, status: data.status }))
      setNewBanner(null)
      
      toast.success(`Evento salvo! Status: ${data.status === 'active' ? 'Ativo' : data.status === 'draft' ? 'Rascunho' : data.status}`)
    } catch (error: any) {
      console.error("🔴 [DEBUG] Erro capturado no catch:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
        fullError: error,
      })
      
      // Detectar erro de tipo (migration não executada)
      if (error?.message?.includes('invalid input syntax for type integer') || 
          error?.message?.includes('column') && error?.message?.includes('does not exist')) {
        const errorMsg = "Erro: Migration não executada. Execute a migration 038_add_event_difficulty_and_type_fields.sql no Supabase."
        console.error("🔴 [DEBUG] ERRO DE MIGRATION:", errorMsg)
        toast.error(errorMsg, { duration: 10000 })
      } else {
        toast.error(`Erro ao salvar evento: ${error?.message || "Erro desconhecido"}`)
      }
    } finally {
      setSaving(false)
      console.log("🔵 [DEBUG] Finalizando salvamento (setSaving false)")
    }
  }

  const handleSaveBatches = async () => {
    // Verificar permissão de edição
    if (!canEdit && !isPrimary) {
      toast.error("Você não tem permissão para editar lotes e ingressos")
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()

      for (const batch of batches) {
        let batchId = batch.id

        // Se é um novo lote, criar
        if (batch.isNew || batch.id.startsWith('new-')) {
          const { data: newBatch, error: batchError } = await supabase
            .from("ticket_batches")
            .insert({
              event_id: eventId,
              name: batch.name,
              start_date: batch.start_date,
              start_time: batch.start_time,
              end_date: batch.end_date || batch.start_date,
              total_quantity: batch.total_quantity,
              is_active: batch.is_active !== false,
            })
            .select()
            .single()

          if (batchError) {
            console.error("Erro ao criar lote:", batchError)
            toast.error(`Erro ao criar lote ${batch.name}`)
            continue
          }

          batchId = newBatch.id
          // Atualizar o ID no estado
          setBatches(prev => prev.map(b =>
            b.id === batch.id ? { ...b, id: batchId, isNew: false } : b
          ))
        } else {
          // Atualizar lote existente
          const { error: batchError } = await supabase
            .from("ticket_batches")
            .update({
              name: batch.name,
              start_date: batch.start_date,
              start_time: batch.start_time,
              end_date: batch.end_date,
              total_quantity: batch.total_quantity,
              is_active: batch.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", batch.id)

          if (batchError) {
            console.error("Erro ao atualizar lote:", batchError)
            toast.error(`Erro ao atualizar lote ${batch.name}`)
            continue
          }
        }

        // Processar ingressos
        for (const ticket of batch.tickets || []) {
          // Se é um novo ingresso, criar
          if (ticket.isNew || ticket.id.startsWith('new-ticket-')) {
            // Converter shirt_quantities para o formato correto (objeto com números)
            const shirtQuantities = Object.entries(ticket.shirt_quantities || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                const parsed = parseInt(value as string || "0", 10)
                if (!Number.isNaN(parsed)) {
                  acc[size] = parsed
                }
                return acc
              },
              {}
            )

            const ticketData: any = {
              batch_id: batchId,
              category: ticket.category,
              price: ticket.price || 0,
              is_free: ticket.is_free || false,
              quantity: ticket.quantity !== null && ticket.quantity !== undefined && ticket.quantity !== "" ? ticket.quantity : null,
              has_kit: ticket.has_kit || false,
              kit_items: ticket.kit_items || [],
              shirt_sizes: ticket.shirt_sizes || [],
              shirt_quantities: shirtQuantities,
              show_route: ticket.show_route || false,
              show_map: ticket.show_map || false,
              show_elevation: ticket.show_elevation || false,
            }

            const { data: newTicket, error: ticketError } = await supabase
              .from("tickets")
              .insert(ticketData)
              .select()
              .single()

            if (ticketError) {
              console.error("Erro ao criar ticket:", ticketError)
              toast.error(`Erro ao criar ingresso ${ticket.category}`)
              continue
            }

            // Se tem novo arquivo GPX, fazer upload
            if (ticket.newGpxFile && newTicket.id) {
              try {
                const gpxUrl = await uploadTicketGPX(ticket.newGpxFile, eventId, newTicket.id)
                await supabase
                  .from("tickets")
                  .update({ gpx_file_url: gpxUrl })
                  .eq("id", newTicket.id)
              } catch (error) {
                console.error("Erro ao fazer upload do GPX:", error)
                toast.error(`Erro ao fazer upload do GPX para ${ticket.category}`)
              }
            }

            // Atualizar o ID no estado
            setBatches(prev => prev.map(b =>
              b.id === batchId
                ? {
                    ...b,
                    tickets: b.tickets.map((t: any) =>
                      t.id === ticket.id ? { ...t, id: newTicket.id, isNew: false } : t
                    )
                  }
                : b
            ))
          } else {
            // Atualizar ingresso existente
            // Converter shirt_quantities para o formato correto (objeto com números)
            const shirtQuantities = Object.entries(ticket.shirt_quantities || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                const parsed = parseInt(value as string || "0", 10)
                if (!Number.isNaN(parsed)) {
                  acc[size] = parsed
                }
                return acc
              },
              {}
            )

            const ticketUpdate: any = {
              category: ticket.category,
              price: ticket.price,
              is_free: ticket.is_free,
              quantity: ticket.quantity,
              has_kit: ticket.has_kit,
              kit_items: ticket.kit_items || [],
              shirt_sizes: ticket.shirt_sizes || [],
              shirt_quantities: shirtQuantities,
              show_route: ticket.show_route || false,
              show_map: ticket.show_map || false,
              show_elevation: ticket.show_elevation || false,
              updated_at: new Date().toISOString(),
            }

            // Se tem novo arquivo GPX, fazer upload
            if (ticket.newGpxFile) {
              try {
                const gpxUrl = await uploadTicketGPX(ticket.newGpxFile, eventId, ticket.id)
                ticketUpdate.gpx_file_url = gpxUrl
              } catch (error) {
                console.error("Erro ao fazer upload do GPX:", error)
                toast.error(`Erro ao fazer upload do GPX para ${ticket.category}`)
              }
            }

            const { error: ticketError } = await supabase
              .from("tickets")
              .update(ticketUpdate)
              .eq("id", ticket.id)

            if (ticketError) {
              console.error("Erro ao atualizar ticket:", ticketError)
              toast.error(`Erro ao atualizar ingresso ${ticket.category}`)
            }
          }
        }
      }

      toast.success("Lotes e ingressos salvos com sucesso!")
      
      // Recarregar dados para atualizar IDs
      const event = await getEventById(eventId)
      if (event && event.ticket_batches) {
        setBatches(event.ticket_batches.map((batch: any) => ({
          ...batch,
          tickets: batch.tickets || [],
        })))
      }
    } catch (error: any) {
      console.error("Erro ao salvar lotes:", error)
      toast.error("Erro ao salvar lotes e ingressos")
    } finally {
      setSaving(false)
    }
  }

  const updateBatch = (batchId: string, field: string, value: any) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId ? { ...batch, [field]: value } : batch
    ))
  }

  const updateTicket = (batchId: string, ticketId: string, field: string, value: any) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId
        ? {
            ...batch,
            tickets: batch.tickets.map((ticket: any) =>
              ticket.id === ticketId ? { ...ticket, [field]: value } : ticket
            )
          }
        : batch
    ))
  }

  const addNewBatch = () => {
    // Verificar permissão de criação
    if (!canCreate && !isPrimary) {
      toast.error("Você não tem permissão para criar lotes")
      return
    }

    const newBatch = {
      id: `new-${Date.now()}`,
      name: `Lote ${batches.length + 1}`,
      start_date: eventData.event_date || new Date().toISOString().split('T')[0],
      start_time: "00:00",
      end_date: eventData.event_date || new Date().toISOString().split('T')[0],
      total_quantity: 0,
      is_active: true,
      tickets: [],
      isNew: true,
    }
    setBatches(prev => [...prev, newBatch])
    setExpandedBatches(prev => ({ ...prev, [newBatch.id]: true }))
  }

  const handleSavePixels = async () => {
    // Verificar permissão de edição
    if (!canEdit && !isPrimary) {
      toast.error("Você não tem permissão para editar configurações")
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()

      // Verificar se já existe event_settings para este evento
      const { data: existingSettings } = await supabase
        .from("event_settings")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle()

      const pixelsData = {
        analytics_google_analytics_id: pixels.google_analytics_id || null,
        analytics_google_analytics_enabled: !!pixels.google_analytics_id,
        analytics_gtm_container_id: pixels.google_tag_manager_id || null,
        analytics_gtm_enabled: !!pixels.google_tag_manager_id,
        analytics_facebook_pixel_id: pixels.facebook_pixel_id || null,
        analytics_facebook_pixel_enabled: !!pixels.facebook_pixel_id,
        updated_at: new Date().toISOString(),
      }

      if (existingSettings) {
        // Atualizar settings existente
        const { error } = await supabase
          .from("event_settings")
          .update(pixelsData)
          .eq("event_id", eventId)

        if (error) throw error
      } else {
        // Criar novo settings
        const { error } = await supabase
          .from("event_settings")
          .insert({
            event_id: eventId,
            ...pixelsData,
          })

        if (error) throw error
      }

      toast.success("Pixels salvos com sucesso!")
    } catch (error: any) {
      console.error("Erro ao salvar pixels:", error)
      toast.error("Erro ao salvar pixels")
    } finally {
      setSaving(false)
    }
  }

  const removeBatch = (batchId: string) => {
    // Verificar permissão de deletar
    if (!canDelete && !isPrimary) {
      toast.error("Você não tem permissão para deletar lotes")
      return
    }

    setBatches(prev => prev.filter((batch: any) => batch.id !== batchId))
    setExpandedBatches(prev => {
      const newState = { ...prev }
      delete newState[batchId]
      return newState
    })
  }

  const addTicketToBatch = (batchId: string) => {
    if (!canCreate && !isPrimary) {
      toast.error("Você não tem permissão para criar ingressos")
      return
    }
    setBatches(prev => prev.map(batch =>
      batch.id === batchId
        ? {
            ...batch,
            tickets: [
              ...(batch.tickets || []),
              {
                id: `new-ticket-${Date.now()}`,
                category: "Nova Categoria",
                price: 0,
                is_free: false,
                quantity: 0,
                has_kit: false,
                kit_items: [],
                shirt_sizes: [],
                shirt_quantities: {},
                show_route: false,
                show_map: false,
                show_elevation: false,
                isNew: true,
              }
            ]
          }
        : batch
    ))
  }

  const removeTicket = (batchId: string, ticketId: string) => {
    // Verificar permissão de deletar
    if (!canDelete && !isPrimary) {
      toast.error("Você não tem permissão para deletar ingressos")
      return
    }

    setBatches(prev => prev.map(batch =>
      batch.id === batchId
        ? {
            ...batch,
            tickets: batch.tickets.filter((ticket: any) => ticket.id !== ticketId)
          }
        : batch
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profissional */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                  {eventData.name || "Editar Evento"}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie todas as configurações do seu evento
                </p>
              </div>
            </div>
            {(canEdit || isPrimary) ? (
              <Button 
                onClick={handleSaveEventData} 
                disabled={saving} 
                className="bg-[#156634] hover:bg-[#1a7a3e] text-white shadow-md"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Evento
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="text-sm px-3 py-1.5">
                Apenas visualização
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">

      {/* Menu Superior Principal */}
      <div className="mb-6">
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => {
              setMainMenu("edicao")
              setSubMenu("basico")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              mainMenu === "edicao"
                ? "border-[#156634] text-[#156634]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edição
            </div>
          </button>
          <button
            onClick={() => {
              setMainMenu("configuracao")
              setSubMenu("pixels")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              mainMenu === "configuracao"
                ? "border-[#156634] text-[#156634]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </div>
          </button>
          <button
            onClick={() => {
              setMainMenu("relatorios")
              setSubMenu("inscricoes")
            }}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              mainMenu === "relatorios"
                ? "border-[#156634] text-[#156634]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </div>
          </button>
        </div>
      </div>

      {/* Submenu de Edição */}
      {mainMenu === "edicao" && (
        <div className="mb-6">
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="basico" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
            <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Básico</span>
          </TabsTrigger>
              <TabsTrigger 
                value="lotes" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Lotes & Ingressos</span>
                <span className="sm:hidden">Lotes</span>
          </TabsTrigger>
              <TabsTrigger 
                value="mapas" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Route className="h-4 w-4" />
                <span className="hidden sm:inline">Mapas</span>
          </TabsTrigger>
              <TabsTrigger 
                value="pagamento" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamento</span>
          </TabsTrigger>
              <TabsTrigger 
                value="afiliados" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Afiliados</span>
          </TabsTrigger>
              <TabsTrigger 
                value="outros" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
            <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Outros</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Básico */}
        <TabsContent value="basico" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#156634]" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                    Dados principais do evento
              </CardDescription>
            </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="name">Nome do Evento *</Label>
                  <Input
                    id="name"
                    value={eventData.name}
                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                    placeholder="Nome do evento"
                    disabled={fieldDisabled}
                  />
                </div>

                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={eventData.category}
                    onValueChange={(value) => setEventData({ ...eventData, category: value })}
                    disabled={fieldDisabled}
                  >
                    <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODALIDADES_ESPORTIVAS.map((mod) => (
                        <SelectItem key={mod.value} value={mod.value}>
                          {mod.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma do Evento *</Label>
                  <Select
                    value={eventData.language}
                    onValueChange={(value) => setEventData({ ...eventData, language: value as "pt" | "es" | "en" })}
                    disabled={fieldDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">
                        <span className="flex items-center gap-2">
                          <span>🇧🇷</span> <span>Português</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="es">
                        <span className="flex items-center gap-2">
                          <span>🇦🇷</span> <span>Español</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="en">
                        <span className="flex items-center gap-2">
                          <span>🇺🇸</span> <span>English</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                  <Select
                    value={eventData.status}
                        onValueChange={(value) => setEventData({ ...eventData, status: value })}
                    disabled={fieldDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="show_in_showcase">Exibir na Vitrine</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="show_in_showcase"
                        checked={eventData.show_in_showcase}
                        onCheckedChange={(checked) => setEventData({ ...eventData, show_in_showcase: checked })}
                        disabled={fieldDisabled}
                      />
                      <Label htmlFor="show_in_showcase" className="text-sm text-muted-foreground cursor-pointer">
                        {eventData.show_in_showcase ? "Evento será exibido na vitrine pública" : "Evento não será exibido na vitrine"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apenas eventos ativos com esta opção habilitada aparecerão na vitrine
                    </p>
                  </div>
                </div>

                {/* Dificuldade, Tipo de Prova e Acesso Major */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level">Dificuldade da Prova</Label>
                    <Select
                      value={eventData.difficulty_level}
                      onValueChange={(value) => setEventData({ ...eventData, difficulty_level: value as any })}
                      disabled={fieldDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a dificuldade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Moderado">Moderado</SelectItem>
                        <SelectItem value="Difícil">Difícil</SelectItem>
                        <SelectItem value="Muito Difícil">Muito Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="race_type">Tipo de Prova</Label>
                    <Select
                      value={eventData.race_type}
                      onValueChange={(value) => setEventData({ ...eventData, race_type: value as any })}
                      disabled={fieldDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asfalto">Asfalto</SelectItem>
                        <SelectItem value="trail">Trail</SelectItem>
                        <SelectItem value="misto">Misto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Acesso a Prova Major</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="major_access_sim"
                          name="major_access"
                          checked={eventData.major_access === true}
                          onChange={() => setEventData({ ...eventData, major_access: true })}
                          className="h-4 w-4 text-[#156634]"
                          disabled={fieldDisabled}
                        />
                        <Label htmlFor="major_access_sim" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="major_access_nao"
                          name="major_access"
                          checked={eventData.major_access === false}
                          onChange={() => setEventData({ ...eventData, major_access: false, major_access_type: "" })}
                          className="h-4 w-4 text-[#156634]"
                          disabled={fieldDisabled}
                        />
                        <Label htmlFor="major_access_nao" className="font-normal cursor-pointer">Não</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {eventData.major_access && (
                  <div className="space-y-2">
                    <Label htmlFor="major_access_type">Qual prova major? *</Label>
                    <Select
                      value={eventData.major_access_type}
                      onValueChange={(value) => setEventData({ ...eventData, major_access_type: value })}
                      disabled={fieldDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prova major" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boston Marathon">Boston Marathon</SelectItem>
                        <SelectItem value="New York City Marathon">New York City Marathon</SelectItem>
                        <SelectItem value="Chicago Marathon">Chicago Marathon</SelectItem>
                        <SelectItem value="Berlin Marathon">Berlin Marathon</SelectItem>
                        <SelectItem value="London Marathon">London Marathon</SelectItem>
                        <SelectItem value="Tokyo Marathon">Tokyo Marathon</SelectItem>
                        <SelectItem value="Paris Marathon">Paris Marathon</SelectItem>
                        <SelectItem value="Amsterdam Marathon">Amsterdam Marathon</SelectItem>
                        <SelectItem value="Dubai Marathon">Dubai Marathon</SelectItem>
                        <SelectItem value="São Paulo Marathon">São Paulo Marathon</SelectItem>
                        <SelectItem value="Rio de Janeiro Marathon">Rio de Janeiro Marathon</SelectItem>
                        <SelectItem value="Outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Data do Evento *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={eventData.event_date}
                    onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                    disabled={fieldDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Horário de Início *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={eventData.start_time}
                    onChange={(e) => setEventData({ ...eventData, start_time: e.target.value })}
                    disabled={fieldDisabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Localização */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#156634]" />
                    Localização
                  </CardTitle>
              <CardDescription>
                    Onde o evento será realizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="space-y-2">
                  <Label htmlFor="location">Local / Nome do Estabelecimento</Label>
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    placeholder="Ex: Praça da Liberdade"
                    disabled={fieldDisabled}
                  />
                </div>

                  <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={eventData.address}
                    onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
                    placeholder="Ex: Av. Beira Mar, 1000"
                    disabled={fieldDisabled}
                  />
                </div>

                  <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={eventData.city}
                    onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                    placeholder="Ex: Florianópolis"
                    disabled={fieldDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={eventData.state}
                    onChange={(e) => setEventData({ ...eventData, state: e.target.value })}
                    placeholder="Ex: SC"
                    disabled={fieldDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={eventData.zip_code}
                    onChange={(e) => setEventData({ ...eventData, zip_code: e.target.value })}
                    placeholder="00000-000"
                    disabled={fieldDisabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

              {/* Descrição */}
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#156634]" />
                    Descrição do Evento
                  </CardTitle>
              <CardDescription>
                    Texto que será exibido na página do evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={eventData.description}
                      onChange={(value) => setEventData({ ...eventData, description: value })}
                      placeholder="Descreva seu evento aqui..."
                      className="bg-white"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          ['link'],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Banner */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#156634]" />
                Banner do Evento
              </CardTitle>
              <CardDescription>
                    Imagem principal do evento. Proporção recomendada: 21:9 (ex: 1920x823px ou 1680x720px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventData.banner_url && (
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={eventData.banner_url}
                    alt="Banner atual"
                    fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newBanner">
                  {eventData.banner_url ? "Trocar Banner" : "Adicionar Banner"}
                </Label>
                <Input
                  id="newBanner"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewBanner(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                  disabled={fieldDisabled}
                />
                {newBanner && (
                  <p className="text-sm text-green-600">
                        ✓ Novo banner: {newBanner.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
              </div>
          </div>
        </TabsContent>

        {/* Tab: Lotes & Ingressos */}
        <TabsContent value="lotes" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-[#156634]" />
                Lotes e Ingressos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gerencie os lotes de venda e os ingressos do evento
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(canCreate || isPrimary) && (
                <Button onClick={addNewBatch} variant="outline" className="flex-1 sm:flex-initial" disabled={fieldDisabled}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Lote
                </Button>
              )}
              {(canEdit || isPrimary) && (
                <Button 
                  onClick={handleSaveBatches} 
                  disabled={saving || fieldDisabled}
                  className="bg-[#156634] hover:bg-[#1a7a3e] text-white flex-1 sm:flex-initial"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {batches.length === 0 ? (
          <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum lote cadastrado</h3>
                <p className="text-sm text-gray-600 mb-6">Comece criando seu primeiro lote de ingressos</p>
                <Button onClick={addNewBatch} className="bg-[#156634] hover:bg-[#1a7a3e]">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Lote
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {batches.map((batch, batchIndex) => (
                <Card key={batch.id} className="overflow-hidden border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all">
                  {/* Cabeçalho do Lote */}
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors bg-gradient-to-r from-[#156634]/5 via-white to-white border-b-2 border-gray-100"
                    onClick={() => toggleBatch(batch.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#156634]/10 text-[#156634] font-bold text-lg mt-1">
                          {batchIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl font-bold text-gray-900">
                              {batch.name || `Lote ${batchIndex + 1}`}
                            </CardTitle>
                            {batch.isNew && (
                              <Badge variant="default" className="bg-blue-600 text-white">
                                Novo
                              </Badge>
                            )}
                            <Badge variant={batch.is_active ? "default" : "secondary"} className={batch.is_active ? "bg-green-100 text-green-800 border-green-300" : ""}>
                              {batch.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-[#156634]" />
                              <span className="font-medium">{new Date(batch.start_date).toLocaleDateString('pt-BR')}</span>
                              <span className="text-gray-400">às</span>
                              <span className="font-medium">{batch.start_time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-[#156634]" />
                              <span>
                            {batch.total_quantity === null || batch.total_quantity === undefined
                              ? "Ilimitado"
                                  : `${batch.total_quantity.toLocaleString('pt-BR')} ingressos`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Trophy className="h-4 w-4 text-[#156634]" />
                              <span>{batch.tickets?.length || 0} {batch.tickets?.length === 1 ? 'categoria' : 'categorias'}</span>
                            </div>
                          </div>
                  </div>
                  </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-gray-600 hover:text-gray-900"
                        >
                          {expandedBatches[batch.id] ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                        {batch.isNew && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBatch(batch.id)
                            }}
                            className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                </div>
              </div>
            </CardHeader>

                  {expandedBatches[batch.id] && (
                    <CardContent className="space-y-8 pt-6">
                      {/* Seção: Informações do Lote */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Settings className="h-5 w-5 text-[#156634]" />
                          <h3 className="text-lg font-semibold text-gray-900">Informações do Lote</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              Nome do Lote <span className="text-red-500">*</span>
                            </Label>
                          <Input
                            value={batch.name}
                            onChange={(e) => updateBatch(batch.id, "name", e.target.value)}
                              className="h-10"
                              placeholder="Ex: Lote Promocional"
                          />
                  </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Data de Início <span className="text-red-500">*</span>
                            </Label>
                          <Input
                            type="date"
                            value={batch.start_date}
                            onChange={(e) => updateBatch(batch.id, "start_date", e.target.value)}
                              className="h-10"
                  />
                  </div>
                    <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Hora de Início <span className="text-red-500">*</span>
                            </Label>
                          <Input
                            type="time"
                            value={batch.start_time}
                            onChange={(e) => updateBatch(batch.id, "start_time", e.target.value)}
                              className="h-10"
                  />
                </div>
                    <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Quantidade Total
                            </Label>
                          <Input
                            type="number"
                            min="0"
                            value={batch.total_quantity ?? ""}
                            onChange={(e) => {
                              const valor = e.target.value
                              if (valor === "") {
                                updateBatch(batch.id, "total_quantity", null)
                              } else {
                                const num = parseInt(valor)
                                if (!isNaN(num) && num >= 0) {
                                  updateBatch(batch.id, "total_quantity", num)
                                }
                              }
                            }}
                            placeholder="Deixe vazio para ilimitado"
                              className="h-10"
                        />
                            <p className="text-xs text-gray-500">
                          Deixe vazio para ilimitado
                        </p>
                          </div>
                      </div>
              </div>

                      <Separator className="my-6" />

                      {/* Seção: Ingressos */}
                      <div className="space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-[#156634]" />
                            <h3 className="text-lg font-semibold text-gray-900">Ingressos do Lote</h3>
                            <Badge variant="outline" className="ml-2">
                              {batch.tickets?.length || 0} {batch.tickets?.length === 1 ? 'ingresso' : 'ingressos'}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTicketToBatch(batch.id)}
                            className="border-[#156634] text-[#156634] hover:bg-[#156634] hover:text-white font-medium"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Ingresso
                          </Button>
                      </div>
                        {batch.tickets && batch.tickets.length > 0 ? (
                          <div className="space-y-4">
                            {batch.tickets.map((ticket: any, ticketIndex: number) => (
                              <Card key={ticket.id} className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-all bg-white">
                                <CardContent className="p-6 space-y-6">
                                  {/* Cabeçalho do Ingresso */}
                                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#156634]/10 text-[#156634] font-semibold text-sm">
                                        {ticketIndex + 1}
                                      </div>
                                      <div>
                      <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-gray-900 text-lg">{ticket.category || 'Nova Categoria'}</h4>
                                          {ticket.isNew && (
                                            <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                              Novo
                                      </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                          {ticket.is_free ? 'Gratuito' : `R$ ${Number(ticket.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} • 
                                          {' '}{ticket.quantity === null || ticket.quantity === undefined ? 'Ilimitado' : `${ticket.quantity} ingressos`}
                                        </p>
                                      </div>
                      </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTicket(batch.id, ticket.id)}
                                      className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                    </div>

                                  {/* Informações Básicas do Ingresso */}
                                  <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                          Categoria <span className="text-red-500">*</span>
                                        </Label>
                                      <Input
                                        value={ticket.category}
                                        onChange={(e) => updateTicket(batch.id, ticket.id, "category", e.target.value)}
                                        className="h-10"
                                          placeholder="Ex: 5km, 10km, 21km"
                                      />
                  </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                          <DollarSign className="h-4 w-4" />
                                          Preço (R$)
                                        </Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                          min="0"
                                          value={ticket.price || ""}
                                        onChange={(e) => updateTicket(batch.id, ticket.id, "price", parseFloat(e.target.value) || 0)}
                                        className="h-10"
                                        disabled={ticket.is_free}
                                        placeholder="0.00"
                                      />
              </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                          <Users className="h-4 w-4" />
                                          Quantidade
                                        </Label>
                                      <Input
                                        type="number"
                                          min="0"
                                          value={ticket.quantity ?? ""}
                                          onChange={(e) => {
                                            const valor = e.target.value
                                            if (valor === "") {
                                              updateTicket(batch.id, ticket.id, "quantity", null)
                                            } else {
                                              const num = parseInt(valor)
                                              if (!isNaN(num) && num >= 0) {
                                                updateTicket(batch.id, ticket.id, "quantity", num)
                                              }
                                            }
                                          }}
                                        className="h-10"
                                          placeholder="Deixe vazio para ilimitado"
                                      />
                                        <p className="text-xs text-gray-500">Vazio = ilimitado</p>
                  </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                                        <div className="flex items-center space-x-2 h-10 px-3 bg-gray-50 rounded-md border">
                <Checkbox
                                          id={`free-${ticket.id}`}
                                          checked={ticket.is_free}
                                          onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "is_free", checked)}
                                        />
                                          <Label htmlFor={`free-${ticket.id}`} className="text-sm font-medium cursor-pointer">
                                          Gratuito
                      </Label>
                                        </div>
                    </div>
                  </div>
                                  </div>

                                  <Separator className="my-5" />

                                  {/* Seção: Kit do Participante */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-[#156634]" />
                                        <h4 className="text-base font-semibold text-gray-900">Kit do Participante</h4>
                                      </div>
                                    <div className="flex items-center space-x-2">
                  <Checkbox
                                        id={`kit-${ticket.id}`}
                                        checked={ticket.has_kit || false}
                                        onCheckedChange={(checked) => {
                                          updateTicket(batch.id, ticket.id, "has_kit", checked)
                                          // Se desmarcar, limpa os dados do kit
                                          if (!checked) {
                                            updateTicket(batch.id, ticket.id, "kit_items", [])
                                            updateTicket(batch.id, ticket.id, "shirt_sizes", [])
                                            updateTicket(batch.id, ticket.id, "shirt_quantities", {})
                                          }
                                        }}
                                      />
                                        <Label htmlFor={`kit-${ticket.id}`} className="text-sm font-medium cursor-pointer">
                                          Este ingresso inclui kit
                                      </Label>
                                      </div>
                </div>

                                    {ticket.has_kit && (
                                      <div className="space-y-5 pl-2 border-l-2 border-[#156634]/20">
                                        {/* Seleção de itens do kit */}
                                        <div className="space-y-3">
                                          <Label className="text-sm font-medium text-gray-700">Itens Incluídos no Kit</Label>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            {ITENS_KIT.map((item) => (
                                              <div key={item.value} className="flex items-center space-x-2 p-2 hover:bg-white rounded-md transition-colors">
                                                <Checkbox
                                                  id={`item-${batch.id}-${ticket.id}-${item.value}`}
                                                  checked={(ticket.kit_items || []).includes(item.value)}
                                                  onCheckedChange={(checked) => {
                                                    const itensAtuais = ticket.kit_items || []
                                                    const novosItens = checked
                                                      ? [...itensAtuais, item.value]
                                                      : itensAtuais.filter((i: string) => i !== item.value)
                                                    updateTicket(batch.id, ticket.id, "kit_items", novosItens)
                                                    
                                                    // Se desmarcar camiseta, limpa tamanhos e quantidades
                                                    if (!checked && item.value === "camiseta") {
                                                      updateTicket(batch.id, ticket.id, "shirt_sizes", [])
                                                      updateTicket(batch.id, ticket.id, "shirt_quantities", {})
                                                    }
                                                  }}
                                                />
                                                <Label
                                                  htmlFor={`item-${batch.id}-${ticket.id}-${item.value}`}
                                                  className="text-sm font-normal cursor-pointer flex-1"
                                                >
                                                  {item.label}
                      </Label>
                    </div>
                                            ))}
                  </div>
                    </div>

                                        {/* Configuração de camiseta */}
                                        {(ticket.kit_items || []).includes("camiseta") && (
                                          <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border-2 border-blue-200/50">
                                            <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                                              <Package className="h-4 w-4 text-blue-700" />
                                              <Label className="text-sm font-semibold text-blue-900">Configuração de Camiseta</Label>
                                            </div>
                                            
                                            <div className="space-y-3">
                                              <Label className="text-sm font-medium text-gray-700">Tamanhos Disponíveis <span className="text-red-500">*</span></Label>
                                              <div className="flex flex-wrap gap-2 p-3 bg-white rounded-md border border-gray-200">
                                                {TAMANHOS_CAMISETA.map((tamanho) => (
                                                  <div key={tamanho.value} className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors">
                  <Checkbox
                                                      id={`tamanho-${batch.id}-${ticket.id}-${tamanho.value}`}
                                                      checked={(ticket.shirt_sizes || []).includes(tamanho.value)}
                                                      onCheckedChange={(checked) => {
                                                        const tamanhosAtuais = ticket.shirt_sizes || []
                                                        const novosTamanhos = checked
                                                          ? [...tamanhosAtuais, tamanho.value]
                                                          : tamanhosAtuais.filter((t: string) => t !== tamanho.value)
                                                        updateTicket(batch.id, ticket.id, "shirt_sizes", novosTamanhos)
                                                        
                                                        // Se desmarcar um tamanho, remove a quantidade
                                                        if (!checked) {
                                                          const quantidadesAtuais = ticket.shirt_quantities || {}
                                                          const novasQuantidades = { ...quantidadesAtuais }
                                                          delete novasQuantidades[tamanho.value]
                                                          updateTicket(batch.id, ticket.id, "shirt_quantities", novasQuantidades)
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`tamanho-${batch.id}-${ticket.id}-${tamanho.value}`}
                                                      className="text-sm font-medium cursor-pointer"
                                                    >
                                                      {tamanho.label}
                        </Label>
                      </div>
                                                ))}
                                              </div>
                </div>

                                            {/* Quantidade por tamanho */}
                                            {(ticket.shirt_sizes || []).length > 0 && (
                                              <div className="space-y-3 pt-3 border-t border-blue-200">
                                                <Label className="text-sm font-medium text-gray-700">
                                                  Quantidade de Camisetas por Tamanho
                                                </Label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 bg-white rounded-md border border-gray-200">
                                                  {(ticket.shirt_sizes || []).map((tamanho: string) => {
                                                    const tamanhoLabel = TAMANHOS_CAMISETA.find(t => t.value === tamanho)?.label || tamanho
                                                    return (
                                                      <div key={tamanho} className="space-y-2">
                                                        <Label htmlFor={`qtd-${tamanho}-${batch.id}-${ticket.id}`} className="text-xs font-medium text-gray-600">
                                                          Tamanho {tamanhoLabel}
                                                        </Label>
                    <Input
                                                          id={`qtd-${tamanho}-${batch.id}-${ticket.id}`}
                                                          type="number"
                                                          min="0"
                                                          step="1"
                                                          value={(ticket.shirt_quantities || {})[tamanho] ?? ""}
                                                          onChange={(e) => {
                                                            const valor = e.target.value
                                                            const quantidadesAtuais = ticket.shirt_quantities || {}
                                                            updateTicket(
                                                              batch.id,
                                                              ticket.id,
                                                              "shirt_quantities",
                                                              {
                                                                ...quantidadesAtuais,
                                                                [tamanho]: valor === "" ? null : (valor ? parseInt(valor) : null),
                                                              }
                                                            )
                                                          }}
                                                          placeholder="Ilimitado"
                                                          className="w-full h-9"
                        />
                      </div>
                                                    )
                                                  })}
                    </div>
                                                {(ticket.shirt_sizes || []).length > 0 && (
                                                  <div className="flex items-center justify-between p-2 bg-blue-100 rounded-md border border-blue-300">
                                                    <span className="text-sm font-medium text-blue-900">Total de camisetas:</span>
                                                    <span className="text-sm font-bold text-blue-900">
                                                      {Object.values(ticket.shirt_quantities || {})
                                                        .reduce((sum: number, qtd: any) => sum + (parseInt(qtd) || 0), 0)}
                                                    </span>
                                                  </div>
                                                )}
                  </div>
                )}
              </div>
                                        )}
                  </div>
                                    )}
                  </div>
                                </CardContent>
                              </Card>
                            ))}
                </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground mb-4">
                              Nenhum ingresso cadastrado neste lote
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addTicketToBatch(batch.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar Primeiro Ingresso
                            </Button>
                  </div>
                )}
              </div>
            </CardContent>
                  )}
          </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Mapas & Percursos */}
        <TabsContent value="mapas" className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
              <h2 className="text-2xl font-bold">Mapas e Percursos GPX</h2>
              <p className="text-muted-foreground">
                Gerencie os arquivos GPX e opções de exibição para cada distância
                      </p>
                    </div>
            <Button onClick={handleSaveBatches} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
              </div>

          {batches.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Route className="h-8 w-8 text-gray-400" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum lote cadastrado</h3>
                <p className="text-sm text-gray-600">Configure os lotes primeiro na aba &quot;Lotes &amp; Ingressos&quot;</p>
            </CardContent>
          </Card>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                batch.tickets && batch.tickets.length > 0 && (
                  <Card key={batch.id} className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[#156634]" />
                        {batch.name}
                      </CardTitle>
              <CardDescription>
                        Gerencie os percursos GPX para cada distância deste lote
              </CardDescription>
            </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {batch.tickets.map((ticket: any) => (
                        <Card key={ticket.id} className="border-2 border-gray-200 shadow-sm">
                          <CardContent className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                                <h4 className="font-semibold">{ticket.category}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.quantity} ingressos disponíveis
                      </p>
                    </div>
                              {ticket.gpx_file_url && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  GPX Carregado
                                </Badge>
                              )}
                </div>

                            <Separator />

                            {/* Upload GPX */}
                    <div className="space-y-2">
                              <Label>Arquivo GPX do Percurso</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept=".gpx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    if (file) {
                                      updateTicket(batch.id, ticket.id, "newGpxFile", file)
                                      toast.success(`Arquivo ${file.name} selecionado`)
                                    }
                                  }}
                                  className="hidden"
                                  id={`gpx-${batch.id}-${ticket.id}`}
                                />
                                <label htmlFor={`gpx-${batch.id}-${ticket.id}`} className="flex-1 cursor-pointer">
                                  <div className="w-full">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        const input = document.getElementById(`gpx-${batch.id}-${ticket.id}`) as HTMLInputElement
                                        input?.click()
                                      }}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      {ticket.newGpxFile
                                        ? ticket.newGpxFile.name
                                        : ticket.gpx_file_url
                                        ? "Trocar GPX"
                                        : "Upload GPX"}
                                    </Button>
                  </div>
                                </label>
                                {ticket.newGpxFile && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateTicket(batch.id, ticket.id, "newGpxFile", null)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                )}
              </div>
                              {ticket.gpx_file_url && !ticket.newGpxFile && (
                      <p className="text-xs text-muted-foreground">
                                  GPX atual: {ticket.gpx_file_url.split('/').pop()}
                      </p>
                              )}
                    </div>

                            {/* Opções de Exibição */}
                            {(ticket.gpx_file_url || ticket.newGpxFile) && (
                              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border-l-4 border-[#156634]">
                                <Label className="text-sm font-semibold">Opções de Exibição</Label>
                    <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`show-route-${ticket.id}`}
                                      checked={ticket.show_route || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_route", checked)}
                                    />
                                    <Label htmlFor={`show-route-${ticket.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <Route className="h-4 w-4" />
                                      Exibir percurso no mapa
                                    </Label>
                  </div>
                                  <div className="flex items-center space-x-2">
                  <Checkbox
                                      id={`show-map-${ticket.id}`}
                                      checked={ticket.show_map || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_map", checked)}
                                    />
                                    <Label htmlFor={`show-map-${ticket.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Exibir mapa na página do evento
                    </Label>
                </div>
                                  <div className="flex items-center space-x-2">
                  <Checkbox
                                      id={`show-elevation-${ticket.id}`}
                                      checked={ticket.show_elevation || false}
                                      onCheckedChange={(checked) => updateTicket(batch.id, ticket.id, "show_elevation", checked)}
                                    />
                                    <Label htmlFor={`show-elevation-${ticket.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                      <Mountain className="h-4 w-4" />
                                      Exibir gráfico de altimetria
                                    </Label>
                </div>
                    </div>
                  </div>
                )}
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )
              ))}
              </div>
          )}
        </TabsContent>

        {/* Tab: Pagamento */}
        <TabsContent value="pagamento" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#156634]" />
                Meios de Pagamento
              </CardTitle>
              <CardDescription>
                Configure os meios de pagamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  Configurações de pagamento em desenvolvimento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Outros */}
        <TabsContent value="outros" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#156634]" />
                Outras Configurações
              </CardTitle>
              <CardDescription>
                Configurações adicionais
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                      Mais configurações em breve
                  </p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
              </div>
      )}

      {/* Submenu de Configuração */}
      {mainMenu === "configuracao" && (
        <div className="mb-6">
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="pixels" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Pixels Google</span>
                <span className="sm:hidden">Pixels</span>
              </TabsTrigger>
              <TabsTrigger 
                value="metodos-pagamento" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Métodos de Pagamento</span>
                <span className="sm:hidden">Pagamento</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cupons" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Cupons</span>
              </TabsTrigger>
              <TabsTrigger 
                value="afiliados" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Afiliados</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Pixels Google */}
            <TabsContent value="pixels" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Code className="h-5 w-5 text-[#156634]" />
                    Pixels do Google
                  </CardTitle>
                  <CardDescription>
                    Configure os pixels de rastreamento do Google Analytics e Google Tag Manager
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">Google Analytics ID (G-XXXXXXXXXX)</Label>
                    <Input
                      id="google_analytics_id"
                      value={pixels.google_analytics_id}
                      onChange={(e) => setPixels({ ...pixels, google_analytics_id: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p className="text-xs text-gray-500">
                      Os pixels serão executados na landing page e na página de checkout
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google_tag_manager_id">Google Tag Manager ID (GTM-XXXXXXX)</Label>
                      <Input
                      id="google_tag_manager_id"
                      value={pixels.google_tag_manager_id}
                      onChange={(e) => setPixels({ ...pixels, google_tag_manager_id: e.target.value })}
                      placeholder="GTM-XXXXXXX"
                      />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_pixel_id">Facebook Pixel ID (opcional)</Label>
                    <Input
                      id="facebook_pixel_id"
                      value={pixels.facebook_pixel_id}
                      onChange={(e) => setPixels({ ...pixels, facebook_pixel_id: e.target.value })}
                      placeholder="123456789012345"
                    />
                  </div>
                  <Button 
                    onClick={handleSavePixels}
                    disabled={saving}
                    className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Pixels
                      </>
                    )}
                  </Button>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Tab: Métodos de Pagamento */}
            <TabsContent value="metodos-pagamento" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#156634]" />
                    Métodos de Pagamento
                  </CardTitle>
              <CardDescription>
                    Habilite ou desabilite métodos de pagamento específicos para este evento
              </CardDescription>
            </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#156634]" />
                  <div>
                          <Label className="text-base font-semibold">PIX</Label>
                          <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#156634]" />
                        <div>
                          <Label className="text-base font-semibold">Cartão de Crédito</Label>
                          <p className="text-sm text-muted-foreground">Parcelamento em até 12x</p>
                  </div>
              </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#156634]" />
                  <div>
                          <Label className="text-base font-semibold">Boleto</Label>
                          <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
                  </div>
                </div>
                      <Checkbox />
                    </div>
                  </div>
                  <Button className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Cupons */}
            <TabsContent value="cupons" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="h-6 w-6 text-[#156634]" />
                    Cupons de Desconto
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Gerencie cupons de desconto para este evento
                  </p>
                    </div>
                <Button 
                  className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
                  onClick={() => {
                    setShowAddCoupon(true)
                    setEditingCoupon(null)
                    setNewCoupon({
                      code: "",
                      discount_type: "percentage",
                      discount_value: "",
                      affiliate_id: "",
                      max_uses: "",
                      expires_at: "",
                      is_active: true,
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Cupom
                </Button>
                    </div>

              {/* Formulário de adicionar/editar cupom */}
              {(showAddCoupon || editingCoupon) && (
              <Card className="border-2 shadow-sm">
                  <CardHeader>
                    <CardTitle>{editingCoupon ? "Editar Cupom" : "Adicionar Novo Cupom"}</CardTitle>
                    <CardDescription>
                      Configure o cupom de desconto para este evento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coupon-code">Código do Cupom *</Label>
                        <Input
                          id="coupon-code"
                          placeholder="EXEMPLO10"
                          value={editingCoupon?.code || newCoupon.code}
                          onChange={(e) => {
                            if (editingCoupon) {
                              setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })
                            } else {
                              setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Desconto *</Label>
                        <Select
                          value={editingCoupon ? (editingCoupon.discount_percentage ? "percentage" : "fixed") : newCoupon.discount_type}
                          onValueChange={(value: "percentage" | "fixed") => {
                            if (editingCoupon) {
                              setEditingCoupon({ 
                                ...editingCoupon, 
                                discount_percentage: value === "percentage" ? editingCoupon.discount_percentage : null,
                                discount_amount: value === "fixed" ? editingCoupon.discount_amount : null,
                              })
                            } else {
                              setNewCoupon({ ...newCoupon, discount_type: value })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentual (%)</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coupon-discount-value">
                          {editingCoupon ? (editingCoupon.discount_percentage ? "Percentual (%) *" : "Valor Fixo (R$) *") : (newCoupon.discount_type === "percentage" ? "Percentual (%) *" : "Valor Fixo (R$) *")}
                        </Label>
                        <Input
                          id="coupon-discount-value"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={editingCoupon ? (editingCoupon.discount_percentage ? "10.00" : "50.00") : (newCoupon.discount_type === "percentage" ? "10.00" : "50.00")}
                          value={editingCoupon ? (editingCoupon.discount_percentage || editingCoupon.discount_amount || "") : newCoupon.discount_value}
                          onChange={(e) => {
                            if (editingCoupon) {
                              if (editingCoupon.discount_percentage) {
                                setEditingCoupon({ ...editingCoupon, discount_percentage: parseFloat(e.target.value) || null })
                              } else {
                                setEditingCoupon({ ...editingCoupon, discount_amount: parseFloat(e.target.value) || null })
                              }
                            } else {
                              setNewCoupon({ ...newCoupon, discount_value: e.target.value })
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coupon-affiliate">Vincular a Afiliado (opcional)</Label>
                        <Select
                          value={editingCoupon?.affiliate_id || newCoupon.affiliate_id || "none"}
                          onValueChange={(value) => {
                            const finalValue = value === "none" ? null : value
                            if (editingCoupon) {
                              setEditingCoupon({ ...editingCoupon, affiliate_id: finalValue })
                            } else {
                              setNewCoupon({ ...newCoupon, affiliate_id: finalValue || "" })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum afiliado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum afiliado</SelectItem>
                            {acceptedAffiliates.map((aff) => {
                              if (!aff.affiliate?.id) return null
                              return (
                                <SelectItem key={aff.affiliate.id} value={aff.affiliate.id}>
                                  {aff.affiliate.user?.full_name || aff.affiliate.user?.email || "Afiliado"}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coupon-max-uses">Máximo de Usos (opcional)</Label>
                        <Input
                          id="coupon-max-uses"
                          type="number"
                          min="1"
                          placeholder="Ilimitado"
                          value={editingCoupon?.max_uses || newCoupon.max_uses}
                          onChange={(e) => {
                            if (editingCoupon) {
                              setEditingCoupon({ ...editingCoupon, max_uses: e.target.value ? parseInt(e.target.value) : null })
                            } else {
                              setNewCoupon({ ...newCoupon, max_uses: e.target.value })
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coupon-expires">Data de Expiração (opcional)</Label>
                        <Input
                          id="coupon-expires"
                          type="datetime-local"
                          value={editingCoupon?.expires_at ? new Date(editingCoupon.expires_at).toISOString().slice(0, 16) : newCoupon.expires_at}
                          onChange={(e) => {
                            if (editingCoupon) {
                              setEditingCoupon({ ...editingCoupon, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                            } else {
                              setNewCoupon({ ...newCoupon, expires_at: e.target.value })
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="coupon-active"
                        checked={editingCoupon?.is_active !== false && (editingCoupon ? editingCoupon.is_active : newCoupon.is_active)}
                        onCheckedChange={(checked) => {
                          if (editingCoupon) {
                            setEditingCoupon({ ...editingCoupon, is_active: checked as boolean })
                          } else {
                            setNewCoupon({ ...newCoupon, is_active: checked as boolean })
                          }
                        }}
                      />
                      <Label htmlFor="coupon-active" className="cursor-pointer">
                        Cupom ativo
                      </Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex-1 bg-[#156634] hover:bg-[#1a7a3e]"
                        onClick={async () => {
                          const couponData = editingCoupon || newCoupon
                          
                          if (!couponData.code || !(couponData.discount_percentage || couponData.discount_amount || couponData.discount_value)) {
                            toast.error("Preencha código e valor do desconto")
                            return
                          }

                          try {
                            const isPercentage = editingCoupon 
                              ? !!editingCoupon.discount_percentage 
                              : couponData.discount_type === "percentage"
                            
                            const discountValue = editingCoupon
                              ? (editingCoupon.discount_percentage || editingCoupon.discount_amount || "")
                              : couponData.discount_value

                            if (!discountValue || isNaN(parseFloat(discountValue))) {
                              toast.error("Valor do desconto inválido")
                              return
                            }

                            const requestBody = {
                              event_id: eventId,
                              code: couponData.code,
                              discount_percentage: isPercentage ? parseFloat(discountValue) : null,
                              discount_amount: !isPercentage ? parseFloat(discountValue) : null,
                                affiliate_id: couponData.affiliate_id && couponData.affiliate_id !== "" && couponData.affiliate_id !== "none" ? couponData.affiliate_id : null,
                              max_uses: couponData.max_uses && couponData.max_uses !== "" ? parseInt(couponData.max_uses) : null,
                              expires_at: couponData.expires_at && couponData.expires_at !== "" ? couponData.expires_at : null,
                              is_active: couponData.is_active !== false,
                            }

                            const response = await fetch(editingCoupon ? `/api/events/coupon/${editingCoupon.id}` : "/api/events/coupon", {
                              method: editingCoupon ? "PUT" : "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(requestBody),
                            })

                            const data = await response.json()

                            if (!response.ok) {
                              throw new Error(data.error || data.details || "Erro ao salvar cupom")
                            }

                            toast.success(editingCoupon ? "Cupom atualizado com sucesso!" : "Cupom criado com sucesso!")
                            setShowAddCoupon(false)
                            setEditingCoupon(null)
                            setNewCoupon({
                              code: "",
                              discount_type: "percentage",
                              discount_value: "",
                              affiliate_id: "",
                              max_uses: "",
                              expires_at: "",
                              is_active: true,
                            })
                            await fetchCoupons()
                          } catch (error: any) {
                            toast.error(error.message || "Erro ao salvar cupom")
                          }
                        }}
                      >
                        {editingCoupon ? "Salvar Alterações" : "Criar Cupom"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddCoupon(false)
                          setEditingCoupon(null)
                          setNewCoupon({
                            code: "",
                            discount_type: "percentage",
                            discount_value: "",
                            affiliate_id: "",
                            max_uses: "",
                            expires_at: "",
                            is_active: true,
                          })
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de cupons */}
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle>Cupons Cadastrados</CardTitle>
                  <CardDescription>
                    Lista de cupons de desconto para este evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {coupons.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Tag className="h-8 w-8 text-gray-400" />
                  </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cupom criado</h3>
                    <p className="text-sm text-gray-600 mb-6">Crie seu primeiro cupom de desconto para este evento</p>
                      <Button 
                        className="bg-[#156634] hover:bg-[#1a7a3e]"
                        onClick={() => setShowAddCoupon(true)}
                      >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Cupom
                    </Button>
              </div>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{coupon.code}</p>
                              <Badge variant={coupon.is_active ? "default" : "secondary"}>
                                {coupon.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Desconto: {coupon.discount_percentage ? `${coupon.discount_percentage}%` : `R$ ${coupon.discount_amount?.toFixed(2)}`}
                            </p>
                            {coupon.affiliate && (
                              <p className="text-xs text-gray-400">
                                Afiliado: {coupon.affiliate.user?.full_name || coupon.affiliate.user?.email}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              Usos: {coupon.current_uses || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : " / Ilimitado"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCoupon(coupon)
                                setShowAddCoupon(false)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Afiliados */}
            <TabsContent value="afiliados" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                  <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-[#156634]" />
                    Afiliados
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Cadastre afiliados para promover este evento
                    </p>
                  </div>
                <Button 
                  className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
                  onClick={() => setShowAddAffiliate(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Afiliado
                </Button>
                </div>

              {/* Formulário de adicionar/editar afiliado */}
              {(showAddAffiliate || editingAffiliate) && (
              <Card className="border-2 shadow-sm">
                  <CardHeader>
                    <CardTitle>{editingAffiliate ? "Editar Afiliado" : "Adicionar Novo Afiliado"}</CardTitle>
                    <CardDescription>
                      {editingAffiliate ? "Edite a comissão do afiliado" : "Envie um convite de afiliação para este evento"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="affiliate-email">Email do Afiliado *</Label>
                      <Input
                        id="affiliate-email"
                        type="email"
                        placeholder="afiliado@exemplo.com"
                        value={editingAffiliate?.email || newAffiliate.email}
                        onChange={(e) => {
                          if (editingAffiliate) {
                            setEditingAffiliate({ ...editingAffiliate, email: e.target.value })
                          } else {
                            setNewAffiliate({ ...newAffiliate, email: e.target.value })
                          }
                        }}
                        disabled={!!editingAffiliate}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Comissão *</Label>
                      <Select
                        value={editingAffiliate?.commission_type || newAffiliate.commission_type}
                        onValueChange={(value: "percentage" | "fixed") => {
                          if (editingAffiliate) {
                            setEditingAffiliate({ ...editingAffiliate, commission_type: value })
                          } else {
                            setNewAffiliate({ ...newAffiliate, commission_type: value })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual (%)</SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commission-value">
                        {(editingAffiliate?.commission_type || newAffiliate.commission_type) === "percentage" ? "Percentual (%) *" : "Valor Fixo (R$) *"}
                      </Label>
                      <Input
                        id="commission-value"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={(editingAffiliate?.commission_type || newAffiliate.commission_type) === "percentage" ? "10.00" : "50.00"}
                        value={editingAffiliate?.commission_value || newAffiliate.commission_value}
                        onChange={(e) => {
                          if (editingAffiliate) {
                            setEditingAffiliate({ ...editingAffiliate, commission_value: e.target.value })
                          } else {
                            setNewAffiliate({ ...newAffiliate, commission_value: e.target.value })
                          }
                        }}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex-1 bg-[#156634] hover:bg-[#1a7a3e]"
                        onClick={async () => {
                          const affiliateData = editingAffiliate || newAffiliate
                          
                          if (!affiliateData.email || !affiliateData.commission_value) {
                            toast.error("Preencha todos os campos")
                            return
                          }

                          try {
                            if (editingAffiliate) {
                              // Editar afiliado
                              const response = await fetch(`/api/events/affiliate/${editingAffiliate.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  commission_type: affiliateData.commission_type,
                                  commission_value: parseFloat(affiliateData.commission_value),
                                }),
                              })

                              const data = await response.json()

                              if (!response.ok) {
                                throw new Error(data.error || "Erro ao atualizar afiliado")
                              }

                              toast.success("Afiliado atualizado com sucesso!")
                              setEditingAffiliate(null)
                              fetchAffiliates()
                            } else {
                              // Criar novo convite
                              const response = await fetch("/api/events/affiliate-invite", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  event_id: eventId,
                                  email: affiliateData.email,
                                  commission_type: affiliateData.commission_type,
                                  commission_value: parseFloat(affiliateData.commission_value),
                                }),
                              })

                              const data = await response.json()

                              if (!response.ok) {
                                throw new Error(data.error || "Erro ao enviar convite")
                              }

                              toast.success("Convite enviado com sucesso!")
                              setShowAddAffiliate(false)
                              setNewAffiliate({ email: "", commission_type: "percentage", commission_value: "" })
                              fetchAffiliates()
                            }
                          } catch (error: any) {
                            toast.error(error.message || "Erro ao processar")
                          }
                        }}
                      >
                        {editingAffiliate ? "Salvar Alterações" : "Enviar Convite"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddAffiliate(false)
                          setEditingAffiliate(null)
                          setNewAffiliate({ email: "", commission_type: "percentage", commission_value: "" })
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de afiliados */}
              <Card className="border-2 shadow-sm">
                <CardHeader>
                  <CardTitle>Afiliados Cadastrados</CardTitle>
                  <CardDescription>
                    Lista de afiliados convidados para este evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {affiliates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum afiliado cadastrado</h3>
                    <p className="text-sm text-gray-600 mb-6">Cadastre afiliados para promover seu evento e aumentar as vendas</p>
                      <Button 
                        className="bg-[#156634] hover:bg-[#1a7a3e]"
                        onClick={() => setShowAddAffiliate(true)}
                      >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar Primeiro Afiliado
                    </Button>
                  </div>
                  ) : (
                    <div className="space-y-3">
                      {affiliates.map((affiliate) => (
                        <div
                          key={affiliate.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{affiliate.email}</p>
                            {affiliate.affiliate?.user?.full_name && (
                              <p className="text-xs text-gray-400">{affiliate.affiliate.user.full_name}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Comissão: {affiliate.commission_type === "percentage" ? `${affiliate.commission_value}%` : `R$ ${affiliate.commission_value}`}
                            </p>
                            <Badge variant={affiliate.status === "accepted" ? "default" : affiliate.status === "pending" ? "secondary" : "destructive"}>
                              {affiliate.status === "accepted" ? "Aceito" : affiliate.status === "pending" ? "Pendente" : "Rejeitado"}
                            </Badge>
                          </div>
                          {affiliate.status === "accepted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAffiliate(affiliate)
                                setShowAddAffiliate(false)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
                  </div>
                )}

      {/* Submenu de Relatórios */}
      {mainMenu === "relatorios" && (
        <div className="mb-6 space-y-6">
          {/* Card de Estatísticas de Visualizações */}
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#156634]" />
                Cliques na Landing Page
              </CardTitle>
              <CardDescription>
                Estatísticas de visualizações e conversões do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{viewStats.totalViews.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-gray-600 mt-1">Total de Visualizações</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{viewStats.viewsToday.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-blue-600 mt-1">Hoje</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{viewStats.viewsLast7Days.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-green-600 mt-1">Últimos 7 dias</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{viewStats.viewsLast30Days.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-purple-600 mt-1">Últimos 30 dias</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{viewStats.conversions.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-orange-600 mt-1">Inscrições</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">{viewStats.conversionRate.toFixed(2)}%</p>
                  <p className="text-xs text-indigo-600 mt-1">Taxa de Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="inscricoes" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Inscrições</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financeiro" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger 
                value="afiliados" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Afiliados</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cupons" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Cupons</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Relatório de Inscrições */}
            <TabsContent value="inscricoes" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#156634]" />
                    Relatório de Inscrições
                  </CardTitle>
                  <CardDescription>
                    Visualize todas as inscrições do evento
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Relatório de inscrições em desenvolvimento
                    </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Tab: Relatório Financeiro */}
            <TabsContent value="financeiro" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#156634]" />
                    Relatório Financeiro
                  </CardTitle>
              <CardDescription>
                    Visualize receitas, descontos e comissões
              </CardDescription>
            </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Relatório financeiro em desenvolvimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Relatório de Afiliados */}
            <TabsContent value="afiliados" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#156634]" />
                    Relatório de Afiliados
                  </CardTitle>
                  <CardDescription>
                    Visualize performance dos afiliados
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Relatório de afiliados em desenvolvimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Relatório de Cupons */}
            <TabsContent value="cupons" className="space-y-6">
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5 text-[#156634]" />
                    Relatório de Cupons
                  </CardTitle>
                  <CardDescription>
                    Visualize uso e performance dos cupons
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
                    <p className="text-sm text-gray-600">
                      Relatório de cupons em desenvolvimento
                    </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      )}

      </div>
    </div>
  )
}
