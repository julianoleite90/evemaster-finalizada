"use client"

import { useState, useEffect } from "react"
import { parallelQueries, safeQuery } from "@/lib/supabase/query-safe"
import { DashboardErrorBoundary } from "@/components/error/DashboardErrorBoundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { eventLogger as logger } from "@/lib/utils/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  X,
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
  Pencil,
  Shirt,
  Lock,
  Unlock,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getEventById } from "@/lib/supabase/events"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { PermissionGuard } from "@/components/dashboard/permission-guard"
import { uploadEventBanner, uploadTicketGPX, uploadEventImage } from "@/lib/supabase/storage"
import { RunningClubsTabContent } from "@/components/dashboard/running-clubs-tab"
import dynamic from "next/dynamic"
import Image from "next/image"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts"
import { EditorLoader } from "@/components/ui/dynamic-loader"
import { DistributionChartsCard } from "@/components/charts"
import { ReportsSection, BatchesSection, CouponsSection, AffiliatesSection, BasicInfoSection, MapsSection, PixelsSection, PaymentMethodsSection, OtherSettingsSection, ModernNavigation, ModernSubMenu } from "./components"

const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
  loading: () => <EditorLoader />
})
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

function EventSettingsPageContent() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { canView, canEdit, canCreate, canDelete, isPrimary, loading: permissionsLoading } = useUserPermissions()
  const fieldDisabled = !canEdit && !isPrimary
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newBanner, setNewBanner] = useState<File | null>(null)
  const [expandedBatches, setExpandedBatches] = useState<{ [key: string]: boolean }>({})
  const [mainMenu, setMainMenu] = useState<"edicao" | "configuracao" | "relatorios">("relatorios")
  const [subMenu, setSubMenu] = useState<string>("inscricoes") // Inicializar com primeira aba de relatórios
  const [eventImages, setEventImages] = useState<Array<{ id: string; image_url: string; image_order: number }>>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [isEditingEnabled, setIsEditingEnabled] = useState(false)
  const [editingBlocks, setEditingBlocks] = useState<{ [key: string]: boolean }>({
    basic: false,
    location: false,
    description: false,
    banner: false,
    gallery: false,
    batches: false,
    maps: false
  })

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
    address_number: "",
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
    quantidade_total: null as number | null,
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

  // Clube de Corrida - estados removidos (agora gerenciados abaixo)

  // Estatísticas de visualizações
  const [viewStats, setViewStats] = useState({
    totalViews: 0,
    viewsToday: 0,
    viewsLast7Days: 0,
    viewsLast30Days: 0,
    conversions: 0,
    conversionRate: 0
  })

  // Dados para relatórios
  const [reportData, setReportData] = useState({
    registrationsOverTime: [] as Array<{ date: string; count: number; views: number }>,
    revenueOverTime: [] as Array<{ date: string; amount: number }>,
    ticketsByCategory: [] as Array<{ name: string; value: number; percent: number }>,
    topCoupons: [] as Array<{ code: string; uses: number; discount: number; revenue: number }>,
    financialMetrics: {
      totalRevenue: 0,
      totalDiscounts: 0,
      netRevenue: 0,
      averageTicket: 0,
      estimatedRevenue: 0
    },
    affiliatePerformance: [] as Array<{ name: string; sales: number; commission: number; revenue: number }>,
    byGender: [] as Array<{ name: string; value: number; percent: number }>,
    byAge: [] as Array<{ name: string; value: number; percent: number }>,
    byShirtSize: [] as Array<{ name: string; value: number; percent: number }>,
    loading: false
  })

  // Buscar estatísticas de visualizações
  const fetchViewStats = async () => {
    logger.log("🚀 [VIEW STATS] Iniciando fetchViewStats para eventId:", eventId)
    try {
      const supabase = createClient()
      // Calcular início e fim do dia no timezone local
      const getStartOfDayUTC = (date: Date) => {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
        return localDate.toISOString()
      }
      
      const agora = new Date()
      const inicioHojeUTC = getStartOfDayUTC(agora)
      
      const hojeFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999)
      const fimHojeUTC = hojeFim.toISOString()
      
      // 7 dias atrás
      const seteDiasAtras = new Date(agora)
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      const seteDiasAtrasUTC = getStartOfDayUTC(seteDiasAtras)
      
      // 30 dias atrás
      const trintaDiasAtras = new Date(agora)
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
      const trintaDiasAtrasUTC = getStartOfDayUTC(trintaDiasAtras)

      // Buscar visualizações com parallelQueries (não crasheia se uma falhar)
      const { data: viewsData, errors: viewsErrors } = await parallelQueries({
        viewsToday: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", inicioHojeUTC)
          .lt("viewed_at", fimHojeUTC),
        viewsLast7Days: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", seteDiasAtrasUTC),
        viewsLast30Days: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .gte("viewed_at", trintaDiasAtrasUTC),
        totalViews: async () => await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId),
        registrations: async () => await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .neq("status", "cancelled")
      }, { timeout: 10000, retries: 1 })

      if (Object.keys(viewsErrors).length > 0) {
        logger.warn("⚠️ [VIEW STATS] Algumas queries falharam:", viewsErrors)
      }

      logger.log("📊 [VIEW STATS] Dados retornados:")
      logger.log({
        eventId,
        hoje: inicioHojeUTC,
        seteDias: seteDiasAtrasUTC,
        trintaDias: trintaDiasAtrasUTC
      })
      logger.log("viewsData:", JSON.stringify(viewsData, null, 2))
      logger.log("viewsErrors:", JSON.stringify(viewsErrors, null, 2))

      // Acessar .count do resultado da query (que vem em .data pela estrutura do parallelQueries)
      const viewsTodayCount = (viewsData.viewsToday as any)?.count || 0
      const viewsLast7DaysCount = (viewsData.viewsLast7Days as any)?.count || 0
      const viewsLast30DaysCount = (viewsData.viewsLast30Days as any)?.count || 0
      const totalViewsCount = (viewsData.totalViews as any)?.count || 0
      const conversionsCount = (viewsData.registrations as any)?.count || 0
      const conversionRateValue = viewsLast30DaysCount > 0 
        ? ((conversionsCount / viewsLast30DaysCount) * 100)
        : 0

      logger.log("📊 [VIEW STATS] Counts calculados:")
      logger.log({
        viewsTodayCount,
        viewsLast7DaysCount,
        viewsLast30DaysCount,
        totalViewsCount,
        conversionsCount,
        conversionRateValue
      })

      setViewStats({
        totalViews: totalViewsCount,
        viewsToday: viewsTodayCount,
        viewsLast7Days: viewsLast7DaysCount,
        viewsLast30Days: viewsLast30DaysCount,
        conversions: conversionsCount,
        conversionRate: Number(conversionRateValue.toFixed(2))
      })

      logger.log("✅ [VIEW STATS] Estado atualizado com sucesso")
    } catch (error) {
      logger.error("❌ [VIEW STATS] ERRO ao buscar estatísticas:", error)
    }
  }

  // Buscar afiliados do evento
  const fetchAffiliates = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar organizador (direto ou via organization_users)
      let currentOrganizerId: string | null = null

      // Primeiro tenta buscar como organizador direto
      const { data: organizer } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (organizer) {
        currentOrganizerId = organizer.id
      } else {
        // Se não for organizador direto, busca via organization_users
        const { data: orgUser } = await supabase
          .from("organization_users")
          .select("organizer_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single()

        if (orgUser) {
          currentOrganizerId = orgUser.organizer_id
        }
      }

      if (!currentOrganizerId) return

      setOrganizerId(currentOrganizerId)

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
        .eq("organizer_id", currentOrganizerId)
        .order("created_at", { ascending: false })

      if (error) {
        logger.error("Erro ao buscar afiliados:", error)
        return
      }

      setAffiliates(invites || [])
    } catch (error) {
      logger.error("Erro ao buscar afiliados:", error)
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
        logger.error("Erro ao buscar cupons:", error)
        return
      }

      setCoupons(couponsData || [])
    } catch (error) {
      logger.error("Erro ao buscar cupons:", error)
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
        logger.error("Erro ao buscar afiliados aceitos:", error)
        return
      }

      setAcceptedAffiliates(commissions || [])
    } catch (error) {
      logger.error("Erro ao buscar afiliados aceitos:", error)
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
            address_number: "", // Campo não existe na tabela events, mantido apenas para UI
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
            quantidade_total: (event as any).quantidade_total ?? null,
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

          // NOTA: Tabela event_images não existe no banco (migration 044 não executada)
          // TODO: Executar migration 044_add_event_images.sql no Supabase
          // const { data: images } = await supabase
          //   .from("event_images")
          //   .select("*")
          //   .eq("event_id", eventId)
          //   .order("image_order", { ascending: true })
          
          setEventImages([] /* images || [] */)

          // Carregar configurações do evento (incluindo pixels)
          // Sempre buscar separadamente para garantir que temos os dados mais recentes
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
          } else if (event.event_settings && event.event_settings.length > 0) {
            // Fallback para event_settings do join
            const settings = event.event_settings[0] || {}
            setPixels({
              google_analytics_id: settings.analytics_google_analytics_id || "",
              google_tag_manager_id: settings.analytics_gtm_container_id || "",
              facebook_pixel_id: settings.analytics_facebook_pixel_id || "",
            })
          } else {
            setPixels({
              google_analytics_id: "",
              google_tag_manager_id: "",
              facebook_pixel_id: "",
            })
          }
        }
      } catch (error) {
        logger.error("Erro ao carregar evento:", error)
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

  // Estado para clubes de corrida (movido para cá para evitar duplicação)
  const [runningClubs, setRunningClubs] = useState<any[]>([])
  const [loadingRunningClubs, setLoadingRunningClubs] = useState(false)

  // Buscar clubes de corrida quando a tab for selecionada
  const fetchRunningClubs = async () => {
    if (!eventId) return
    try {
      setLoadingRunningClubs(true)
      const res = await fetch(`/api/events/running-clubs?event_id=${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setRunningClubs(data.clubs || [])
      } else {
        const errorData = await res.json().catch(() => ({}))
        logger.error('Erro ao buscar clubes:', errorData)
        toast.error(errorData.error || 'Erro ao carregar clubes')
      }
    } catch (error) {
      logger.error('Erro ao buscar clubes:', error)
      toast.error('Erro ao carregar clubes')
    } finally {
      setLoadingRunningClubs(false)
    }
  }

  // Buscar clubes quando a tab de clube-corrida for selecionada
  useEffect(() => {
    if (subMenu === "clube-corrida" && eventId) {
      fetchRunningClubs()
    }
  }, [subMenu, eventId])

  // Buscar dados de relatórios
  const fetchReportData = async () => {
    if (!eventId) {
      logger.log("⚠️ [REPORTS] eventId não encontrado")
      return
    }
    
    logger.log("🔍 [REPORTS] Iniciando busca de dados para eventId:", eventId)
    setReportData(prev => ({ ...prev, loading: true }))
    try {
      const supabase = createClient()
      
      // Buscar inscrições com LIMITE e timeout (SEM head: true - precisamos dos dados)
      // IMPORTANTE: Excluir inscrições canceladas dos relatórios
      const registrationsResult = await safeQuery(
        async () => await supabase
          .from("registrations")
          .select(`
            id,
            created_at,
            ticket_id,
            shirt_size
          `)
          .eq("event_id", eventId)
          .neq("status", "cancelled")
          .order("created_at", { ascending: true })
          .limit(1000), // LIMITE: máximo 1000 para relatórios
        { timeout: 20000, retries: 2 }
      )

      if (registrationsResult.error) {
        logger.error("❌ [REPORTS] Erro ao buscar inscrições:", registrationsResult.error)
        setReportData(prev => ({ ...prev, loading: false }))
        return
      }

      // Desembrulhar: se veio { count, data }, pegar o .data interno
      // Se veio direto como array, usar direto
      const registrationsData: any = registrationsResult.data
      const registrations = Array.isArray(registrationsData) 
        ? registrationsData 
        : (registrationsData?.data || [])

      logger.log("✅ [REPORTS] Tipo de registrationsResult.data:", typeof registrationsResult.data, Array.isArray(registrationsResult.data) ? 'é array' : 'não é array')
      logger.log("✅ [REPORTS] Inscrições encontradas:", registrations?.length || 0)

      if (!registrations || registrations.length === 0) {
        logger.log("⚠️ [REPORTS] Nenhuma inscrição encontrada")
        setReportData(prev => ({ ...prev, loading: false }))
        return
      }

      logger.log("📊 [REPORTS] Total de inscrições encontradas:", registrations.length)

      // Buscar dados relacionados separadamente
      const registrationIds = registrations.map((r: any) => r.id)
      const ticketIds = registrations.map((r: any) => r.ticket_id).filter(Boolean)

      logger.log("📊 [REPORTS] IDs de tickets:", ticketIds.length)

      // Buscar dados relacionados com parallelQueries e limites
      const { data: relatedData, errors: relatedErrors } = await parallelQueries({
        tickets: ticketIds.length > 0 
          ? async () => await supabase
          .from("tickets")
          .select("id, category, price")
              .in("id", ticketIds)
              .limit(1000)
          : async () => Promise.resolve({ data: [], error: null }),
        payments: registrationIds.length > 0 
          ? async () => await supabase
          .from("payments")
              .select("registration_id, total_amount, payment_status, affiliate_id")
              .in("registration_id", registrationIds)
              .limit(1000)
          : async () => Promise.resolve({ data: [], error: null }),
        athletes: registrationIds.length > 0 
          ? async () => await supabase
          .from("athletes")
          .select("registration_id, gender, birth_date, age")
              .in("registration_id", registrationIds)
              .limit(1000)
          : async () => Promise.resolve({ data: [], error: null }),
        views: async () => await supabase
          .from("event_views")
          .select("viewed_at")
          .eq("event_id", eventId)
          .limit(5000) // Limitar views a 5000
      }, { timeout: 15000, retries: 1 })

      if (Object.keys(relatedErrors).length > 0) {
        logger.warn("⚠️ [REPORTS] Algumas queries falharam (não crítico):", relatedErrors)
      }

      // Desembrulhar dados do parallelQueries (podem vir como array ou { count, data })
      const extractArray = (val: any) => Array.isArray(val) ? val : (val?.data || [])
      
      const ticketsData = { data: extractArray(relatedData.tickets) }
      const paymentsData = { data: extractArray(relatedData.payments) }
      const athletesData = { data: extractArray(relatedData.athletes), error: relatedErrors.athletes || null }
      const viewsData = { data: extractArray(relatedData.views) }

      if (relatedErrors.athletes) {
        logger.error("❌ [REPORTS] Erro ao buscar atletas:", relatedErrors.athletes)
      }

      // Buscar afiliados únicos dos pagamentos
      const uniqueAffiliateIds = [...new Set((paymentsData.data || [])
        .map((p: any) => p.affiliate_id)
        .filter(Boolean))]
      
      const { data: affiliatesData } = uniqueAffiliateIds.length > 0 ? await supabase
        .from("affiliates")
        .select("id, name")
        .in("id", uniqueAffiliateIds) : { data: null }

      // Criar mapas para lookup rápido
      const ticketsMap: Map<string, any> = new Map((ticketsData.data || []).map((t: any) => [t.id, t]))
      const paymentsMap: Map<string, any> = new Map((paymentsData.data || []).map((p: any) => [p.registration_id, p]))
      const affiliatesMap: Map<string, any> = new Map((affiliatesData || []).map((a: any) => [a.id, a]))
      const athletesMap: Map<string, any> = new Map((athletesData.data || []).map((a: any) => [a.registration_id, a]))

      logger.log("📊 [REPORTS] Tickets encontrados:", ticketsMap.size)
      logger.log("📊 [REPORTS] Pagamentos encontrados:", paymentsMap.size)
      logger.log("📊 [REPORTS] Atletas encontrados:", athletesMap.size)
      logger.log("📊 [REPORTS] Amostra de atletas:", Array.from(athletesData.data || []).slice(0, 3))
      logger.log("📊 [REPORTS] Amostra de registrations com shirt_size:", registrations.filter((r: any) => r.shirt_size).slice(0, 3))

      const registrationsByDate = new Map<string, number>()
      const viewsByDate = new Map<string, number>()
      const revenueByDate = new Map<string, number>()
      const categoryMap = new Map<string, number>()
      const couponMap = new Map<string, { uses: number; discount: number; revenue: number }>()
      const affiliateMap = new Map<string, { name: string; sales: number; commission: number; revenue: number }>()
      const genderMap = new Map<string, number>()
      const ageMap = new Map<string, number>()
      const shirtSizeMap = new Map<string, number>()
      let totalRevenue = 0
      let totalDiscounts = 0
      let paidCount = 0

      registrations.forEach((reg: any) => {
        // Usar timezone local para calcular a data corretamente
        const regDate = new Date(reg.created_at)
        const year = regDate.getFullYear()
        const month = String(regDate.getMonth() + 1).padStart(2, '0')
        const day = String(regDate.getDate()).padStart(2, '0')
        const date = `${year}-${month}-${day}`
        registrationsByDate.set(date, (registrationsByDate.get(date) || 0) + 1)

        // Buscar ticket
        const ticket = reg.ticket_id ? ticketsMap.get(reg.ticket_id) : null
        if (ticket?.category) {
          categoryMap.set(ticket.category, (categoryMap.get(ticket.category) || 0) + 1)
        } else if (reg.ticket_id && !ticket) {
          logger.log("⚠️ [REPORTS] Ticket não encontrado para ticket_id:", reg.ticket_id)
        } else if (reg.ticket_id && ticket && !ticket.category) {
          // Se o ticket existe mas não tem categoria, usar "Sem categoria"
          categoryMap.set("Sem categoria", (categoryMap.get("Sem categoria") || 0) + 1)
        } else if (!reg.ticket_id) {
          // Se não tem ticket_id, usar "Sem ingresso"
          categoryMap.set("Sem ingresso", (categoryMap.get("Sem ingresso") || 0) + 1)
        }

        // Buscar pagamento
        const payment = paymentsMap.get(reg.id)
        
        // NOTA: coupon_code e discount_amount não existem em payments
        // Essas informações devem vir de registrations ou coupons
        // TODO: Buscar coupon_code e discount da tabela correta
        
        if (payment && payment.payment_status === 'paid') {
          paidCount++
          const amount = parseFloat(payment.total_amount) || 0
          // const discount = parseFloat(payment.discount_amount) || 0 // Coluna não existe
          const discount = 0 // Temporário até integrar com tabela correta
          totalRevenue += amount
          totalDiscounts += discount
          
          revenueByDate.set(date, (revenueByDate.get(date) || 0) + amount)
          
          // Cupons - TODO: buscar de registrations ou tabela de coupons
          // if (payment.coupon_code) {
          //   const coupon = couponMap.get(payment.coupon_code)!
          //   coupon.discount += discount
          //   coupon.revenue += amount
          // }
        }

        // Buscar afiliado do pagamento (já temos payment declarado acima)
        if (payment?.affiliate_id) {
          const affiliate = affiliatesMap.get(payment.affiliate_id)
          if (affiliate) {
            const existing = affiliateMap.get(payment.affiliate_id) || {
              name: affiliate.name || 'Sem nome',
              sales: 0,
              commission: 0,
              revenue: 0
            }
            existing.sales++
            if (payment.payment_status === 'paid') {
              const amount = parseFloat(payment.total_amount) || 0
              existing.revenue += amount
              existing.commission += amount * 0.1
            }
            affiliateMap.set(payment.affiliate_id, existing)
          }
        }

        // Processar dados do atleta (gênero, idade, tamanho de camiseta)
        const athlete = athletesMap.get(reg.id)
        
        // Gênero - buscar do atleta
        if (athlete?.gender) {
          let genderLabel = ''
          const genderValue = athlete.gender.toString().trim()
          
          if (genderValue === 'M' || genderValue === 'Masculino' || genderValue.toLowerCase() === 'masculino') {
            genderLabel = 'Masculino'
          } else if (genderValue === 'F' || genderValue === 'Feminino' || genderValue.toLowerCase() === 'feminino') {
            genderLabel = 'Feminino'
          } else if (genderValue === 'Outro' || genderValue.toLowerCase() === 'outro') {
            genderLabel = 'Outro'
          } else {
            genderLabel = genderValue
          }
          
          genderMap.set(genderLabel, (genderMap.get(genderLabel) || 0) + 1)
        }

        // Idade - buscar do atleta
        if (athlete) {
          let age: number | null = null
          if (athlete.age && athlete.age > 0 && athlete.age <= 120) {
            age = athlete.age
          } else if (athlete.birth_date) {
            try {
              const birthDate = new Date(athlete.birth_date)
              if (!isNaN(birthDate.getTime())) {
                const today = new Date()
                age = today.getFullYear() - birthDate.getFullYear()
                const monthDiff = today.getMonth() - birthDate.getMonth()
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  age--
                }
              }
            } catch (error) {
              logger.error('Erro ao calcular idade:', error)
            }
          }

          if (age !== null && age >= 0 && age <= 120) {
            let faixaEtaria = ''
            if (age < 18) faixaEtaria = 'Menor de 18'
            else if (age < 25) faixaEtaria = '18-24'
            else if (age < 35) faixaEtaria = '25-34'
            else if (age < 45) faixaEtaria = '35-44'
            else if (age < 55) faixaEtaria = '45-54'
            else if (age < 65) faixaEtaria = '55-64'
            else faixaEtaria = '65+'
            
            ageMap.set(faixaEtaria, (ageMap.get(faixaEtaria) || 0) + 1)
          }
        }

        // Tamanho de camiseta - buscar de registrations
        const shirtSize = (reg as any).shirt_size
        if (shirtSize) {
          const shirtSizeStr = shirtSize.toString().trim().toUpperCase()
          if (shirtSizeStr) {
            shirtSizeMap.set(shirtSizeStr, (shirtSizeMap.get(shirtSizeStr) || 0) + 1)
          }
        }
      })

      // Formatar datas para "dia mês ano"
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00') // Adicionar hora para evitar problemas de timezone
        const day = date.getDate()
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
        const month = months[date.getMonth()]
        const year = date.getFullYear()
        return `${day} ${month} ${year}`
      }

      // Processar visualizações por data
      if (viewsData.data) {
        viewsData.data.forEach((view: any) => {
          const viewDate = new Date(view.viewed_at)
          const year = viewDate.getFullYear()
          const month = String(viewDate.getMonth() + 1).padStart(2, '0')
          const day = String(viewDate.getDate()).padStart(2, '0')
          const date = `${year}-${month}-${day}`
          viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1)
        })
      }

      // Combinar todas as datas (inscrições e visualizações) para ter um conjunto completo
      const allDates = new Set([
        ...Array.from(registrationsByDate.keys()),
        ...Array.from(viewsByDate.keys())
      ])

      const registrationsOverTime = Array.from(allDates)
        .map((date) => {
          const count = registrationsByDate.get(date) || 0
          const views = viewsByDate.get(date) || 0
          return { date: formatDate(date), count, views, originalDate: date }
        })
        .sort((a, b) => a.originalDate.localeCompare(b.originalDate))

      const revenueOverTime = Array.from(revenueByDate.entries())
        .map(([date, amount]) => ({ date: formatDate(date), amount, originalDate: date }))
        .sort((a, b) => a.originalDate.localeCompare(b.originalDate))

      const totalWithCategory = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
      const ticketsByCategory = Array.from(categoryMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithCategory > 0 ? (value / totalWithCategory) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)

      logger.log("📊 [REPORTS] Registrations over time:", registrationsOverTime.length, registrationsOverTime)
      logger.log("📊 [REPORTS] Categories found:", categoryMap.size, Array.from(categoryMap.entries()))
      logger.log("📊 [REPORTS] Tickets by category:", ticketsByCategory)

      const topCoupons = Array.from(couponMap.entries())
        .map(([code, data]) => ({
          code,
          uses: data.uses,
          discount: data.discount,
          revenue: data.revenue
        }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 10)

      const affiliatePerformance = Array.from(affiliateMap.values())
        .sort((a, b) => b.sales - a.sales)

      // Processar dados de gênero
      const totalWithGender = Array.from(genderMap.values()).reduce((a, b) => a + b, 0)
      const byGender = Array.from(genderMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithGender > 0 ? (value / totalWithGender) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)

      logger.log("📊 [REPORTS] Dados de gênero:", {
        total: totalWithGender,
        map: Array.from(genderMap.entries()),
        processed: byGender
      })

      // Processar dados de idade
      const totalWithAge = Array.from(ageMap.values()).reduce((a, b) => a + b, 0)
      const byAge = Array.from(ageMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithAge > 0 ? (value / totalWithAge) * 100 : 0
        }))
        .sort((a, b) => {
          // Ordenar por ordem de faixa etária
          const order = ['Menor de 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
          const indexA = order.indexOf(a.name)
          const indexB = order.indexOf(b.name)
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })

      logger.log("📊 [REPORTS] Dados de idade:", {
        total: totalWithAge,
        map: Array.from(ageMap.entries()),
        processed: byAge
      })

      // Processar dados de tamanho de camiseta
      const totalWithShirtSize = Array.from(shirtSizeMap.values()).reduce((a, b) => a + b, 0)
      const byShirtSize = Array.from(shirtSizeMap.entries())
        .map(([name, value]) => ({
          name,
          value,
          percent: totalWithShirtSize > 0 ? (value / totalWithShirtSize) * 100 : 0
        }))
        .sort((a, b) => {
          // Ordenar por ordem de tamanho
          const order = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']
          const indexA = order.indexOf(a.name)
          const indexB = order.indexOf(b.name)
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })

      logger.log("📊 [REPORTS] Dados de tamanho de camiseta:", {
        total: totalWithShirtSize,
        map: Array.from(shirtSizeMap.entries()),
        processed: byShirtSize
      })

      const last7Days = revenueOverTime.slice(-7)
      const avgDailyRevenue = last7Days.length > 0
        ? last7Days.reduce((sum, day) => sum + day.amount, 0) / last7Days.length
        : 0
      
      const daysUntilEvent = eventData.event_date 
        ? Math.max(0, Math.ceil((new Date(eventData.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0
      const estimatedRevenue = avgDailyRevenue * Math.min(daysUntilEvent, 30)

      logger.log("📊 [REPORTS] Final data before setting:", {
        registrationsOverTime: registrationsOverTime.length,
        ticketsByCategory: ticketsByCategory.length,
        topCoupons: topCoupons.length
      })

      const finalData = {
        registrationsOverTime,
        revenueOverTime,
        ticketsByCategory,
        topCoupons,
        financialMetrics: {
          totalRevenue,
          totalDiscounts,
          netRevenue: totalRevenue - totalDiscounts,
          averageTicket: paidCount > 0 ? totalRevenue / paidCount : 0,
          estimatedRevenue
        },
        affiliatePerformance,
        byGender,
        byAge,
        byShirtSize,
        loading: false
      }

      setReportData(finalData)
    } catch (error) {
      logger.error("❌ [REPORTS] Erro ao buscar dados de relatórios:", error)
      logger.error("❌ [REPORTS] Detalhes do erro:", JSON.stringify(error, null, 2))
      setReportData(prev => ({ ...prev, loading: false }))
    }
  }

  // Buscar estatísticas quando entrar na seção de relatórios
  useEffect(() => {
    logger.log("🔍 [REPORTS] useEffect disparado - mainMenu:", mainMenu, "eventId:", eventId)
    if (mainMenu === "relatorios" && eventId) {
      logger.log("✅ [REPORTS] Chamando fetchViewStats e fetchReportData")
      fetchViewStats()
      fetchReportData()
    } else {
      logger.log("⚠️ [REPORTS] Condições não atendidas - mainMenu:", mainMenu, "eventId:", eventId)
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
      setSaving(true)
      const supabase = createClient()

      // Se tem novo banner, fazer upload
      let bannerUrl = eventData.banner_url
      if (newBanner) {
        try {
          bannerUrl = await uploadEventBanner(newBanner, eventId)
          toast.success("Banner atualizado!")
        } catch (error) {
          toast.error("Erro ao fazer upload do banner")
        }
      }

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
        quantidade_total: eventData.quantidade_total || null,
        updated_at: new Date().toISOString(),
      }

      // Adicionar campos novos apenas se existirem (após migration)
      if (eventData.difficulty_level) {
        updateData.difficulty_level = eventData.difficulty_level
      }
      if (eventData.major_access !== undefined) {
        updateData.major_access = eventData.major_access
      }
      if (eventData.major_access_type) {
        updateData.major_access_type = eventData.major_access_type
      }
      if (eventData.race_type) {
        updateData.race_type = eventData.race_type
      }
      // show_in_showcase - apenas adicionar se a coluna existir no banco
      // A migração 042_add_show_in_showcase.sql deve ser aplicada primeiro
      if (eventData.show_in_showcase !== undefined) {
        updateData.show_in_showcase = eventData.show_in_showcase
      }


      let { data, error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", eventId)
        .select()
        .single()

      // Se o erro for relacionado à coluna show_in_showcase não existir, tentar novamente sem ela
      if (error && error.message?.includes("show_in_showcase")) {
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

      if (error) {
        throw error
      }

      setEventData(prev => ({ ...prev, banner_url: bannerUrl, status: data.status }))
      setNewBanner(null)
      
      toast.success(`Evento salvo! Status: ${data.status === 'active' ? 'Ativo' : data.status === 'draft' ? 'Rascunho' : data.status}`)
    } catch (error: any) {
      // Detectar erro de tipo (migration não executada)
      if (error?.message?.includes('invalid input syntax for type integer') || 
          error?.message?.includes('column') && error?.message?.includes('does not exist')) {
        const errorMsg = "Erro: Migration não executada. Execute a migration 038_add_event_difficulty_and_type_fields.sql no Supabase."
        toast.error(errorMsg, { duration: 10000 })
      } else {
        toast.error(`Erro ao salvar evento: ${error?.message || "Erro desconhecido"}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBatches = async () => {
    // Verificar permissão de edição
    if (!canEdit && !isPrimary) {
      toast.error("Você não tem permissão para editar lotes e ingressos")
      return
    }

    // Validar quantidade total se estiver definida
    if (eventData.quantidade_total) {
      let totalIngressos = 0
      
      for (const batch of batches) {
        // Somar quantidade do lote se tiver
        if (batch.total_quantity) {
          totalIngressos += batch.total_quantity
        } else {
          // Se o lote não tem quantidade total, somar quantidades dos ingressos
          for (const ticket of batch.tickets || []) {
            if (ticket.quantity) {
              totalIngressos += ticket.quantity
            }
          }
        }
      }
      
      if (totalIngressos > eventData.quantidade_total) {
        toast.error(
          `A quantidade total de ingressos (${totalIngressos}) excede o limite do evento (${eventData.quantidade_total}). ` +
          `Por favor, ajuste as quantidades dos lotes.`
        )
        return
      }
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
            logger.error("Erro ao criar lote:", batchError)
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
            logger.error("Erro ao atualizar lote:", batchError)
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
              logger.error("Erro ao criar ticket:", ticketError)
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
                logger.error("Erro ao fazer upload do GPX:", error)
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
                logger.error("Erro ao fazer upload do GPX:", error)
                toast.error(`Erro ao fazer upload do GPX para ${ticket.category}`)
              }
            }

            const { error: ticketError } = await supabase
              .from("tickets")
              .update(ticketUpdate)
              .eq("id", ticket.id)

            if (ticketError) {
              logger.error("Erro ao atualizar ticket:", ticketError)
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
      logger.error("Erro ao salvar lotes:", error)
      toast.error("Erro ao salvar lotes e ingressos")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async () => {
    // Verificar permissões
    if (!canDelete && !isPrimary) {
      toast.error("Você não tem permissão para deletar eventos")
      return
    }

    // Verificar se o evento está em rascunho
    if (eventData.status !== "draft") {
      toast.error("Apenas eventos em rascunho podem ser deletados. Eventos publicados não podem ser removidos.")
      return
    }

    // Verificar confirmação
    if (deleteConfirmText !== "DELETAR") {
      toast.error("Por favor, digite 'DELETAR' para confirmar")
      return
    }

    try {
      setDeleting(true)
      const supabase = createClient()

      // Soft delete: marcar como deletado ao invés de deletar do banco
      // Usar status 'cancelled' ou 'deleted' para manter os dados no banco
      const { error } = await supabase
        .from("events")
        .update({ 
          status: "cancelled",
          // Adicionar timestamp de deleção se houver campo deleted_at
          // deleted_at: new Date().toISOString()
        })
        .eq("id", eventId)

      if (error) {
        logger.error("Erro ao deletar evento:", error)
        toast.error("Erro ao deletar evento. Tente novamente.")
        return
      }

      toast.success("Evento deletado com sucesso! Os dados foram mantidos no banco para segurança.")
      
      // Redirecionar para a lista de eventos
      router.push("/dashboard/organizer/events")
    } catch (error: any) {
      logger.error("Erro ao deletar evento:", error)
      toast.error("Erro ao deletar evento: " + (error.message || "Erro desconhecido"))
    } finally {
      setDeleting(false)
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
        analytics_google_analytics_id: pixels.google_analytics_id?.trim() || null,
        analytics_google_analytics_enabled: !!pixels.google_analytics_id?.trim(),
        analytics_gtm_container_id: pixels.google_tag_manager_id?.trim() || null,
        analytics_gtm_enabled: !!pixels.google_tag_manager_id?.trim(),
        analytics_facebook_pixel_id: pixels.facebook_pixel_id?.trim() || null,
        analytics_facebook_pixel_enabled: !!pixels.facebook_pixel_id?.trim(),
        updated_at: new Date().toISOString(),
      }

      logger.log("💾 [SAVE PIXELS] Dados que serão salvos:", pixelsData)
      logger.log("💾 [SAVE PIXELS] Event ID:", eventId)
      logger.log("💾 [SAVE PIXELS] Settings existente?", !!existingSettings)

      if (existingSettings) {
        // Atualizar settings existente
        const { error, data } = await supabase
          .from("event_settings")
          .update(pixelsData)
          .eq("event_id", eventId)
          .select()

        if (error) {
          throw error
        }
        
      } else {
        // Criar novo settings
        
        // Verificar se existe algum registro (mesmo sem os campos de analytics)
        const { data: anySettings } = await supabase
          .from("event_settings")
          .select("id")
          .eq("event_id", eventId)
          .maybeSingle()
        
        if (anySettings) {
          // Se existe, atualizar
          const { error, data } = await supabase
            .from("event_settings")
            .update(pixelsData)
            .eq("event_id", eventId)
            .select()

          if (error) {
            throw error
          }
        } else {
          // Se não existe, criar
          const { error, data } = await supabase
          .from("event_settings")
          .insert({
            event_id: eventId,
            ...pixelsData,
          })
            .select()

          if (error) {
            throw error
          }
        }
      }

      // Recarregar os pixels para confirmar que foram salvos
      await new Promise(resolve => setTimeout(resolve, 300)) // Aguardar um pouco para garantir que o banco foi atualizado
      
      const { data: updatedSettings, error: reloadError } = await supabase
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle()

      if (updatedSettings) {
        const reloadedPixels = {
          google_analytics_id: updatedSettings.analytics_google_analytics_id || "",
          google_tag_manager_id: updatedSettings.analytics_gtm_container_id || "",
          facebook_pixel_id: updatedSettings.analytics_facebook_pixel_id || "",
        }
        setPixels(reloadedPixels)
      } else {
        // Mesmo assim, tentar recarregar novamente após mais um tempo
        setTimeout(async () => {
          const { data: retrySettings } = await supabase
            .from("event_settings")
            .select("analytics_google_analytics_id, analytics_gtm_container_id, analytics_facebook_pixel_id")
            .eq("event_id", eventId)
            .maybeSingle()
          
          if (retrySettings) {
            setPixels({
              google_analytics_id: retrySettings.analytics_google_analytics_id || "",
              google_tag_manager_id: retrySettings.analytics_gtm_container_id || "",
              facebook_pixel_id: retrySettings.analytics_facebook_pixel_id || "",
            })
          }
        }, 1000)
      }

      toast.success("Pixels salvos com sucesso!")
    } catch (error: any) {
      logger.error("Erro ao salvar pixels:", error)
      logger.error("Detalhes do erro:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      toast.error(`Erro ao salvar pixels: ${error.message || "Erro desconhecido"}`)
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
    <div className="space-y-8">
      {/* Header com visual moderno */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {eventData.name || "Editar Evento"}
            </h1>
            <p className="text-gray-500 mt-1">
              Gerencie todas as configurações do seu evento
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de Cadeado para Habilitar Edição */}
            {(canEdit || isPrimary) && (
              <button
                onClick={() => setIsEditingEnabled(!isEditingEnabled)}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  isEditingEnabled 
                    ? "border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100" 
                    : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                {isEditingEnabled ? (
                  <>
                    <Unlock className="mr-1.5 h-3.5 w-3.5" />
                    Editando
                  </>
                ) : (
                  <>
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </>
                )}
              </button>
            )}
            {(canDelete || isPrimary) && eventData.status === "draft" && (
              <Button 
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 text-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Deletar
              </Button>
            )}
            {(canEdit || isPrimary) ? (
              <Button 
                onClick={handleSaveEventData} 
                disabled={saving || !isEditingEnabled} 
                size="sm"
                className="bg-[#156634] hover:bg-[#1a7a3e] h-8 text-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Salvar
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-xs">Apenas visualização</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navegação Principal Moderna */}
      <ModernNavigation 
        currentSection={mainMenu} 
        onSectionClick={(section) => {
          setMainMenu(section)
          if (section === "relatorios") setSubMenu("inscricoes")
          if (section === "configuracao") setSubMenu("pixels")
          if (section === "edicao") setSubMenu("basico")
        }}
      />

      {/* Conteúdo Principal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">

      {/* Submenu de Edição */}
      {mainMenu === "edicao" && (
        <div className="space-y-6">
          <ModernSubMenu
            items={[
              { id: "basico", title: "Básico", icon: FileText },
              { id: "lotes", title: "Lotes & Ingressos", icon: Trophy },
              { id: "mapas", title: "Mapas", icon: Route },
              { id: "outros", title: "Outros", icon: Settings },
            ]}
            currentItem={subMenu}
            onItemClick={setSubMenu}
          />
          
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">

        {/* Tab: Básico */}
        <TabsContent value="basico" className="space-y-6">
          <BasicInfoSection
            eventData={eventData}
            setEventData={setEventData}
            editingBlocks={editingBlocks}
            setEditingBlocks={setEditingBlocks}
            fieldDisabled={fieldDisabled || !isEditingEnabled}
            isEditingEnabled={isEditingEnabled}
            newBanner={newBanner}
            setNewBanner={setNewBanner}
            eventImages={eventImages}
            setEventImages={setEventImages}
            newImages={newImages}
            setNewImages={setNewImages}
            uploadingImages={uploadingImages}
          />
        </TabsContent>

        {/* Tab: Lotes & Ingressos */}
        <TabsContent value="lotes" className="space-y-6">
          <BatchesSection
            batches={batches}
            expandedBatches={expandedBatches}
            editingBlocks={editingBlocks}
            saving={saving}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            isPrimary={isPrimary}
            fieldDisabled={fieldDisabled}
            isEditingEnabled={isEditingEnabled}
            addNewBatch={addNewBatch}
            updateBatch={updateBatch}
            removeBatch={removeBatch}
            toggleBatch={toggleBatch}
            addTicketToBatch={addTicketToBatch}
            updateTicket={updateTicket}
            removeTicket={removeTicket}
            handleSaveBatches={handleSaveBatches}
            setEditingBlocks={setEditingBlocks}
          />
        </TabsContent>

        {/* Tab: Mapas & Percursos */}
        <TabsContent value="mapas" className="space-y-6">
          <MapsSection
            batches={batches}
            saving={saving}
            fieldDisabled={fieldDisabled}
            isEditingEnabled={isEditingEnabled}
            editingBlocks={editingBlocks}
            setEditingBlocks={setEditingBlocks}
            updateTicket={updateTicket}
            handleSaveBatches={handleSaveBatches}
          />
        </TabsContent>

        {/* Tab: Outros */}
        <TabsContent value="outros" className="space-y-6">
          <OtherSettingsSection />
        </TabsContent>
          </Tabs>
              </div>
      )}

      {/* Submenu de Configuração */}
      {mainMenu === "configuracao" && (
        <div className="space-y-6">
          <ModernSubMenu
            items={[
              { id: "pixels", title: "Pixels Google", icon: Code },
              { id: "metodos-pagamento", title: "Pagamento", icon: CreditCard },
              { id: "cupons", title: "Cupons", icon: Tag },
              { id: "afiliados", title: "Afiliados", icon: UserPlus },
              { id: "clube-corrida", title: "Clube de Corrida", icon: Trophy },
            ]}
            currentItem={subMenu}
            onItemClick={setSubMenu}
          />
          
          <Tabs value={subMenu} onValueChange={setSubMenu} className="space-y-6">

            {/* Tab: Pixels Google */}
            <TabsContent value="pixels" className="space-y-6">
              <PixelsSection
                pixels={pixels}
                setPixels={setPixels}
                handleSavePixels={handleSavePixels}
                saving={saving}
              />
        </TabsContent>

            {/* Tab: Métodos de Pagamento */}
            <TabsContent value="metodos-pagamento" className="space-y-6">
              <PaymentMethodsSection />
            </TabsContent>

            {/* Tab: Cupons */}
            <TabsContent value="cupons" className="space-y-6">
              <CouponsSection
                eventId={eventId}
                coupons={coupons}
                showAddCoupon={showAddCoupon}
                setShowAddCoupon={setShowAddCoupon}
                editingCoupon={editingCoupon}
                setEditingCoupon={setEditingCoupon}
                newCoupon={newCoupon}
                setNewCoupon={setNewCoupon}
                acceptedAffiliates={acceptedAffiliates}
                fetchCoupons={fetchCoupons}
              />
            </TabsContent>

            {/* Tab: Afiliados */}
            <TabsContent value="afiliados" className="space-y-6">
              <AffiliatesSection
                eventId={eventId}
                affiliates={affiliates}
                showAddAffiliate={showAddAffiliate}
                setShowAddAffiliate={setShowAddAffiliate}
                editingAffiliate={editingAffiliate}
                setEditingAffiliate={setEditingAffiliate}
                newAffiliate={newAffiliate}
                setNewAffiliate={setNewAffiliate}
                fetchAffiliates={fetchAffiliates}
              />
            </TabsContent>

            {/* Tab: Clube de Corrida */}
            <TabsContent value="clube-corrida" className="space-y-6">
              {(() => {
                logger.log('🏃 [SETTINGS] Renderizando TabsContent clube-corrida, eventId:', eventId, 'subMenu atual:', subMenu)
                if (!eventId) {
                  logger.error('❌ [SETTINGS] eventId não encontrado')
                  return (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">ID do evento não encontrado</p>
                    </div>
                  )
                }
                logger.log('✅ [SETTINGS] Renderizando RunningClubsTabContent')
                return (
                  <RunningClubsTabContent 
                    eventId={eventId} 
                    clubs={runningClubs}
                    loading={loadingRunningClubs}
                    onRefresh={fetchRunningClubs}
                  />
                )
              })()}
            </TabsContent>
          </Tabs>
                  </div>
                )}

      {/* Submenu de Relatórios */}
      {mainMenu === "relatorios" && (
        <ReportsSection
          viewStats={viewStats}
          reportData={reportData}
          subMenu={subMenu}
          setSubMenu={setSubMenu}
        />
      )}

      </div>

      {/* Dialog de Confirmação para Deletar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Deletar Evento</DialogTitle>
            <DialogDescription className="pt-2">
              O evento <span className="font-semibold text-gray-900">{eventData.name}</span> será removido da visualização,
              mas <span className="font-semibold text-green-600">todos os dados serão mantidos no banco de dados</span> para segurança e auditoria.
              O evento será marcado como cancelado e não aparecerá mais nas listagens.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm" className="text-sm font-medium">
              Para confirmar, digite <span className="font-bold text-red-600">DELETAR</span>:
            </Label>
            <Input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Digite DELETAR"
              className="mt-2"
              disabled={deleting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmText("")
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleteConfirmText !== "DELETAR" || deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Wrap com Error Boundary para proteger contra crashes
export default function EventSettingsPage() {
  return (
    <DashboardErrorBoundary page="event-settings">
      <EventSettingsPageContent />
    </DashboardErrorBoundary>
  )
}