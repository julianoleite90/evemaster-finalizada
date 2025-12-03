import { z } from "zod"

// Schema para dados básicos do evento
export const eventBasicSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  category: z.string().min(1, "Selecione uma categoria"),
  language: z.enum(["pt", "es", "en"]),
  event_date: z.string().min(1, "Data do evento é obrigatória"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  banner_url: z.string().optional(),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  difficulty_level: z.enum(["Fácil", "Moderado", "Difícil", "Muito Difícil", ""]).optional(),
  major_access: z.boolean().default(false),
  major_access_type: z.string().optional(),
  race_type: z.enum(["asfalto", "trail", "misto", ""]).optional(),
  show_in_showcase: z.boolean().default(false),
  quantidade_total: z.number().nullable().optional(),
})

export type EventBasicFormData = z.infer<typeof eventBasicSchema>

// Schema para pixels de rastreamento
export const pixelsSchema = z.object({
  google_analytics_id: z.string().optional(),
  google_tag_manager_id: z.string().optional(),
  facebook_pixel_id: z.string().optional(),
})

export type PixelsFormData = z.infer<typeof pixelsSchema>

// Schema para novo afiliado
export const affiliateSchema = z.object({
  email: z.string().email("E-mail inválido"),
  commission_type: z.enum(["percentage", "fixed"]),
  commission_value: z.string().min(1, "Valor da comissão é obrigatório"),
})

export type AffiliateFormData = z.infer<typeof affiliateSchema>

// Schema para cupom
export const couponSchema = z.object({
  code: z.string().min(1, "Código do cupom é obrigatório").toUpperCase(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.string().min(1, "Valor do desconto é obrigatório"),
  affiliate_id: z.string().optional(),
  max_uses: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type CouponFormData = z.infer<typeof couponSchema>

// Schema para lote/ticket
export const ticketSchema = z.object({
  name: z.string().min(1, "Nome do ingresso é obrigatório"),
  price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  quantity: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  description: z.string().optional(),
  distance_km: z.number().optional(),
  elevation_gain: z.number().optional(),
  max_participants: z.number().optional(),
  category_gender: z.enum(["unisex", "male", "female"]).optional(),
  category_age_min: z.number().optional(),
  category_age_max: z.number().optional(),
  has_tshirt: z.boolean().default(false),
  has_medal: z.boolean().default(false),
  has_kit: z.boolean().default(false),
  tshirt_sizes: z.array(z.string()).optional(),
  kit_items: z.array(z.string()).optional(),
  gpx_url: z.string().optional(),
  map_image_url: z.string().optional(),
})

export type TicketFormData = z.infer<typeof ticketSchema>

export const batchSchema = z.object({
  name: z.string().min(1, "Nome do lote é obrigatório"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().default(true),
  tickets: z.array(ticketSchema),
})

export type BatchFormData = z.infer<typeof batchSchema>

// Constantes compartilhadas
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

