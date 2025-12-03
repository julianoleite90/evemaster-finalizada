// Tipos compartilhados para a página de configurações do evento

export interface EventData {
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

export interface TicketBatch {
  id?: string
  event_id: string
  name: string
  price: number
  quantity: number
  sold?: number
  start_date: string
  end_date: string
  ticket_type_id?: string
  ticket_type_name?: string
  distance?: string
  gpx_url?: string
  elevation_gain?: string
  kit_items?: string[]
  shirt_sizes?: string[]
  is_free?: boolean
  status?: string
}

export interface Affiliate {
  id: string
  email: string
  name?: string
  commission_type: "percentage" | "fixed"
  commission_value: number
  total_sales?: number
  total_commission?: number
  status?: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  affiliate_id?: string
  affiliate_name?: string
}

export interface ViewStats {
  totalViews: number
  viewsToday: number
  viewsLast7Days: number
  viewsLast30Days: number
  conversions: number
  conversionRate: number
}

export interface FinancialMetrics {
  totalRevenue: number
  totalDiscounts: number
  netRevenue: number
  averageTicket: number
  estimatedRevenue: number
}

export interface ReportData {
  registrationsOverTime: Array<{ date: string; count: number; views: number }>
  revenueOverTime: Array<{ date: string; amount: number }>
  ticketsByCategory: Array<{ name: string; value: number; percent: number }>
  topCoupons: Array<{ code: string; uses: number; discount: number; revenue: number }>
  financialMetrics: FinancialMetrics
  affiliatePerformance: Array<{ name: string; sales: number; commission: number; revenue: number }>
  byGender: Array<{ name: string; value: number; percent: number }>
  byAge: Array<{ name: string; value: number; percent: number }>
  byShirtSize: Array<{ name: string; value: number; percent: number }>
  loading: boolean
}

export interface EventImage {
  id: string
  image_url: string
  image_order: number
}

export interface Pixels {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
}

// Constantes
export const MODALIDADES_ESPORTIVAS = [
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

export const TAMANHOS_CAMISETA = [
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XG", label: "XG" },
  { value: "XXG", label: "XXG" },
]

export const ITENS_KIT = [
  { value: "camiseta", label: "Camiseta" },
  { value: "medalha", label: "Medalha" },
  { value: "numero", label: "Número de Peito" },
  { value: "chip", label: "Chip de Cronometragem" },
  { value: "sacola", label: "Sacola" },
  { value: "outros", label: "Outros" },
]

