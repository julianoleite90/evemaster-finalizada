import { z } from "zod"

// Schema para participante
export const participantSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  idade: z.string().optional(),
  genero: z.string().optional(),
  paisResidencia: z.string().default("brasil"),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cpf: z.string().min(1, "Documento é obrigatório"),
  tamanhoCamiseta: z.string().optional(),
  aceiteTermo: z.boolean(),
  contatoEmergenciaNome: z.string().optional(),
  contatoEmergenciaTelefone: z.string().optional(),
})

export type ParticipantFormData = z.infer<typeof participantSchema>

// Valores padrão do participante
export const defaultParticipant: ParticipantFormData = {
  nome: "",
  email: "",
  telefone: "",
  idade: "",
  genero: "",
  paisResidencia: "brasil",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cpf: "",
  tamanhoCamiseta: "",
  aceiteTermo: false,
  contatoEmergenciaNome: "",
  contatoEmergenciaTelefone: "",
}

// Schema para endereço
export const addressSchema = z.object({
  cep: z.string().optional(),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().optional(),
  pais: z.string().default("brasil"),
})

export type AddressFormData = z.infer<typeof addressSchema>

// Lista de países
export const PAISES = [
  { value: "brasil", label: "🇧🇷 Brasil", labelEs: "🇧🇷 Brasil", labelEn: "🇧🇷 Brazil" },
  { value: "argentina", label: "🇦🇷 Argentina", labelEs: "🇦🇷 Argentina", labelEn: "🇦🇷 Argentina" },
  { value: "chile", label: "🇨🇱 Chile", labelEs: "🇨🇱 Chile", labelEn: "🇨🇱 Chile" },
  { value: "uruguai", label: "🇺🇾 Uruguai", labelEs: "🇺🇾 Uruguay", labelEn: "🇺🇾 Uruguay" },
  { value: "paraguai", label: "🇵🇾 Paraguai", labelEs: "🇵🇾 Paraguay", labelEn: "🇵🇾 Paraguay" },
  { value: "peru", label: "🇵🇪 Peru", labelEs: "🇵🇪 Perú", labelEn: "🇵🇪 Peru" },
  { value: "colombia", label: "🇨🇴 Colômbia", labelEs: "🇨🇴 Colombia", labelEn: "🇨🇴 Colombia" },
  { value: "mexico", label: "🇲🇽 México", labelEs: "🇲🇽 México", labelEn: "🇲🇽 Mexico" },
  { value: "eua", label: "🇺🇸 Estados Unidos", labelEs: "🇺🇸 Estados Unidos", labelEn: "🇺🇸 United States" },
  { value: "outro", label: "🌍 Outro país", labelEs: "🌍 Otro país", labelEn: "🌍 Other country" },
]

// Tamanhos de camiseta
export const TAMANHOS_CAMISETA = ["PP", "P", "M", "G", "GG", "XG", "XXG"]

// Gêneros
export const GENEROS = [
  { value: "masculino", label: "Masculino", labelEs: "Masculino", labelEn: "Male" },
  { value: "feminino", label: "Feminino", labelEs: "Femenino", labelEn: "Female" },
  { value: "outro", label: "Outro", labelEs: "Otro", labelEn: "Other" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar", labelEs: "Prefiero no informar", labelEn: "Prefer not to say" },
]

// Utilitários de formatação
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11)
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
}

export function formatCEP(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 8)
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
}

export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
}

// Alias para compatibilidade
export const formatTelefone = formatPhone

export function formatDNI(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 8)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
}

export function formatDocumento(value: string, pais: string): string {
  if (pais === "brasil") return formatCPF(value)
  if (pais === "argentina") return formatDNI(value)
  return value.replace(/\D/g, "").slice(0, 20)
}

// Normalizar país
export function normalizarPais(pais: string | null | undefined): string {
  if (!pais) return "brasil"
  
  const paisLower = pais.toLowerCase().trim()
  
  const mapeamento: Record<string, string> = {
    "brasil": "brasil",
    "brazil": "brasil",
    "argentina": "argentina",
    "chile": "chile",
    "uruguai": "uruguai",
    "uruguay": "uruguai",
    "paraguai": "paraguai",
    "paraguay": "paraguai",
    "peru": "peru",
    "perú": "peru",
    "colombia": "colombia",
    "colômbia": "colombia",
    "mexico": "mexico",
    "méxico": "mexico",
    "eua": "eua",
    "estados unidos": "eua",
    "united states": "eua",
    "usa": "eua",
    "us": "eua",
  }
  
  return mapeamento[paisLower] || "brasil"
}

