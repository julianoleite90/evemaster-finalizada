import { z } from "zod"

// Schema para ingresso
export const ticketSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.string(),
  gratuito: z.boolean().default(false),
  quantidade: z.number().nullable(),
  possuiKit: z.boolean().default(false),
  itensKit: z.array(z.string()).default([]),
  tamanhosCamiseta: z.array(z.string()).default([]),
  quantidadeCamisetasPorTamanho: z.record(z.string(), z.string()).default({}),
  gpxFile: z.any().nullable(),
  gpxFileUrl: z.string().nullable(),
  showRoute: z.boolean().default(false),
  showMap: z.boolean().default(false),
  showElevation: z.boolean().default(false),
})

export type TicketFormData = z.infer<typeof ticketSchema>

// Schema para lote
export const batchSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome do lote é obrigatório"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  horaInicio: z.string().default(""),
  quantidadeTotal: z.string().default(""),
  salvo: z.boolean().default(false),
  ingressos: z.array(ticketSchema).default([]),
})

export type BatchFormData = z.infer<typeof batchSchema>

// Schema para meios de pagamento
export const paymentMethodsSchema = z.object({
  pix: z.boolean().default(true),
  cartaoCredito: z.boolean().default(true),
  boleto: z.boolean().default(true),
  parcelamento: z.object({
    habilitado: z.boolean().default(true),
    maxParcelas: z.number().default(12),
    assumirJuros: z.boolean().default(false),
  }),
  taxaAdministracao: z.object({
    percentual: z.number().default(10),
    assumirTaxa: z.boolean().default(false),
  }),
})

export type PaymentMethodsFormData = z.infer<typeof paymentMethodsSchema>

// Schema completo do formulário de novo evento
export const newEventSchema = z.object({
  // Step 1: Informações da Corrida
  nome: z.string().min(1, "Nome do evento é obrigatório"),
  data: z.string().min(1, "Data é obrigatória"),
  horarioInicio: z.string().default(""),
  horarioFim: z.string().default(""),
  categoria: z.string().default(""),
  language: z.enum(["pt", "es", "en"]).default("pt"),
  modalidades: z.array(z.string()).default([]),
  distancias: z.array(z.string()).default([]),
  distanciasCustom: z.array(z.string()).default([]),
  difficulty_level: z.enum(["Fácil", "Moderado", "Difícil", "Muito Difícil", ""]).default(""),
  major_access: z.boolean().default(false),
  major_access_type: z.string().default(""),
  race_type: z.enum(["asfalto", "trail", "misto", ""]).default(""),
  bannerEvento: z.any().nullable(),
  gpxStrava: z.any().nullable(),
  
  // Endereço
  pais: z.string().default("Brasil"),
  cep: z.string().default(""),
  endereco: z.string().default(""),
  numero: z.string().default(""),
  complemento: z.string().default(""),
  bairro: z.string().default(""),
  cidade: z.string().default(""),
  estado: z.string().default(""),
  quantidade_total: z.string().default(""),
  
  // Step 2: Lotes e Ingressos
  lotes: z.array(batchSchema).default([]),
  
  // Step 3: Meios de Pagamento
  meiosPagamento: paymentMethodsSchema,
  
  // Step 4: Descrição do Evento
  descricao: z.string().default(""),
})

export type NewEventFormData = z.infer<typeof newEventSchema>

// Valor padrão do formulário
export const defaultNewEventForm: NewEventFormData = {
  nome: "",
  data: "",
  horarioInicio: "",
  horarioFim: "",
  categoria: "",
  language: "pt",
  modalidades: [],
  distancias: [],
  distanciasCustom: [],
  difficulty_level: "",
  major_access: false,
  major_access_type: "",
  race_type: "",
  bannerEvento: null,
  gpxStrava: null,
  pais: "Brasil",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  quantidade_total: "",
  lotes: [],
  meiosPagamento: {
    pix: true,
    cartaoCredito: true,
    boleto: true,
    parcelamento: {
      habilitado: true,
      maxParcelas: 12,
      assumirJuros: false,
    },
    taxaAdministracao: {
      percentual: 10,
      assumirTaxa: false,
    },
  },
  descricao: "",
}

// Valor padrão para novo ingresso
export const defaultTicket: TicketFormData = {
  categoria: "",
  valor: "",
  gratuito: false,
  quantidade: null,
  possuiKit: false,
  itensKit: [],
  tamanhosCamiseta: [],
  quantidadeCamisetasPorTamanho: {},
  gpxFile: null,
  gpxFileUrl: null,
  showRoute: false,
  showMap: false,
  showElevation: false,
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

export const DISTANCIAS_PADRAO = [
  { value: "5", label: "5km" },
  { value: "10", label: "10km" },
  { value: "21", label: "21km (Meia Maratona)" },
  { value: "42", label: "42km (Maratona)" },
  { value: "custom", label: "Personalizado" },
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

export const DIFICULDADES = [
  { value: "Fácil", label: "Fácil" },
  { value: "Moderado", label: "Moderado" },
  { value: "Difícil", label: "Difícil" },
  { value: "Muito Difícil", label: "Muito Difícil" },
]

export const TIPOS_PROVA = [
  { value: "asfalto", label: "Asfalto" },
  { value: "trail", label: "Trail" },
  { value: "misto", label: "Misto" },
]

export const IDIOMAS = [
  { value: "pt", label: "🇧🇷 Português" },
  { value: "es", label: "🇦🇷 Español" },
  { value: "en", label: "🇺🇸 English" },
]

// Gerar ID único para lotes
export function generateBatchId(): string {
  return `lote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

