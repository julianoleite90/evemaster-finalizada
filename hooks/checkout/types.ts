import { ParticipantFormData } from "@/lib/schemas/checkout"

export interface IngressoSelecionado {
  id: string
  categoria: string
  valor: number
  gratuito: boolean
  hasKit: boolean
  kitItems: string[]
  shirtSizes: string[]
}

export interface RunningClubData {
  id: string
  name: string
  base_discount: number
  progressive_discount_threshold?: number
  progressive_discount_value?: number
  tickets_allocated: number
  tickets_used: number
  deadline?: string
}

export interface CpfUserData {
  id: string
  maskedEmail: string
  fullName: string
  email?: string
  phone?: string
  cpf?: string
}

export interface PerfilSalvo {
  id: string
  full_name: string
  email: string
  phone?: string
  cpf?: string
  age?: number
  gender?: string
  country?: string
  zip_code?: string
  address?: string
  address_number?: string
  address_complement?: string
  neighborhood?: string
  city?: string
  state?: string
  shirt_size?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export interface CheckoutState {
  loading: boolean
  submitting: boolean
  loadingCep: boolean
  eventData: any
  eventId: string
  ingressosSelecionados: IngressoSelecionado[]
  currentStep: number
  currentParticipante: number
  participantes: ParticipantFormData[]
  meioPagamento: string
  temKit: boolean
  temCamiseta: boolean
  paisEvento: string
  idioma: string
  runningClub: RunningClubData | null
  usuarioLogado: any
  perfisSalvos: PerfilSalvo[]
  showCpfLogin: boolean
  cpfVerificado: string | null
  cpfUserData: CpfUserData | null
  verificandoCpf: boolean
  salvarPerfil: { [key: number]: boolean }
  permiteEdicao: boolean
  mostrarPopupIncluirParticipantes: boolean
  quantidadeParticipantesAdicionais: number
  mostrarBuscaParticipantes: boolean
  termoBuscaParticipante: string
  participanteAtualEmEdicao: number | null
  quantidadeIngressosInicial: number
  perfisSelecionadosPopup: { perfilId: string; categoriaId: string }[]
}

export interface ResumoFinanceiro {
  subtotal: number
  desconto: number
  subtotalComDesconto: number
  taxa: number
  total: number
}

