/**
 * Tipos compartilhados da aplicação
 * 
 * Este arquivo contém todos os tipos centralizados do sistema.
 * Use estes tipos em vez de definir tipos inline ou usar 'any'.
 */

// ===== ENUMS E TIPOS BASE =====

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'AFFILIATE' | 'ATHLETE'

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished'

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded'

export type PaymentMethod = 'pix' | 'cartao' | 'boleto'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export type Idioma = 'pt' | 'es' | 'en'

// ===== USUÁRIO =====

export interface User {
  id: string
  email: string
  full_name?: string
  cpf?: string
  phone?: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at?: string
}

export interface UserProfile extends User {
  birth_date?: string
  gender?: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar'
  address?: Address
  emergency_contact?: EmergencyContact
}

// ===== ENDEREÇO =====

export interface Address {
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  country?: string
}

export interface EmergencyContact {
  name: string
  phone: string
}

// ===== EVENTO =====

export interface Event {
  id: string
  name: string
  slug?: string
  description?: string
  short_description?: string
  event_date?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  location?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  banner_url?: string
  organizer_id: string
  status: EventStatus
  max_participants?: number
  is_free?: boolean
  requires_medical_certificate?: boolean
  terms_of_service?: string
  created_at: string
  updated_at?: string
  // Relacionamentos
  organizer?: Organizer
  ticket_batches?: TicketBatch[]
  gallery_images?: string[]
}

export interface EventWithDetails extends Event {
  total_registrations?: number
  total_revenue?: number
  categories?: EventCategory[]
}

// ===== ORGANIZADOR =====

export interface Organizer {
  id: string
  user_id: string
  company_name?: string
  cnpj?: string
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  approved: boolean
  created_at: string
}

// ===== LOTES E INGRESSOS =====

export interface TicketBatch {
  id: string
  event_id: string
  name: string
  start_date?: string
  end_date?: string
  is_active: boolean
  tickets?: Ticket[]
  created_at: string
}

export interface Ticket {
  id: string
  batch_id: string
  category: string
  price: number
  quantity?: number
  sold?: number
  is_free?: boolean
  has_kit?: boolean
  kit_items?: string[]
  shirt_sizes?: string[]
  created_at: string
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  distance?: string
  price: number
}

// ===== INSCRIÇÃO =====

export interface Registration {
  id: string
  event_id: string
  batch_id?: string
  ticket_id?: string
  user_id?: string
  buyer_id?: string
  athlete_id?: string
  status: RegistrationStatus
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
  total_amount: number
  service_fee?: number
  discount?: number
  coupon_code?: string
  // Dados do participante
  participant_name?: string
  participant_email?: string
  participant_cpf?: string
  participant_phone?: string
  participant_age?: number
  participant_gender?: string
  shirt_size?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  // Metadados
  created_at: string
  updated_at?: string
  confirmed_at?: string
  cancelled_at?: string
}

export interface RegistrationWithEvent extends Registration {
  event?: Event
  ticket?: Ticket
}

// ===== PAGAMENTO =====

export interface Payment {
  id: string
  registration_id: string
  external_id?: string // ID do gateway (Barte)
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  paid_at?: string
  pix_code?: string
  pix_qr_code?: string
  boleto_url?: string
  boleto_barcode?: string
  card_last_digits?: string
  installments?: number
  created_at: string
}

// ===== CUPOM =====

export interface Coupon {
  id: string
  event_id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses?: number
  used_count: number
  valid_from?: string
  valid_until?: string
  is_active: boolean
  affiliate_id?: string
  created_at: string
}

// ===== AFILIADO =====

export interface Affiliate {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  commission_rate: number
  total_sales?: number
  total_commission?: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// ===== RUNNING CLUB =====

export interface RunningClub {
  id: string
  name: string
  event_id?: string
  base_discount: number
  progressive_discount_threshold?: number
  progressive_discount_value?: number
  invite_token?: string
  is_active: boolean
  created_at: string
}

// ===== RELATÓRIOS =====

export interface EventStats {
  total_registrations: number
  confirmed_registrations: number
  pending_registrations: number
  cancelled_registrations: number
  total_revenue: number
  average_ticket_price: number
  registrations_by_category: Record<string, number>
  registrations_by_gender: Record<string, number>
  registrations_by_age: Record<string, number>
  registrations_by_shirt_size: Record<string, number>
  registrations_over_time: Array<{ date: string; count: number }>
  revenue_over_time: Array<{ date: string; amount: number }>
}

// ===== API RESPONSES =====

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ===== FORM STATES =====

export interface FormState {
  isSubmitting: boolean
  isValid: boolean
  errors: Record<string, string>
}

// ===== PARTICIPANTE (Checkout) =====

export interface Participante {
  nome: string
  email: string
  telefone: string
  idade: string
  genero: string
  paisResidencia: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cpf: string
  tamanhoCamiseta: string
  aceiteTermo: boolean
  contatoEmergenciaNome: string
  contatoEmergenciaTelefone: string
}





