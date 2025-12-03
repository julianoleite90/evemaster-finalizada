// Interface para ingresso dentro de um lote
export interface Ingresso {
  categoria: string
  valor: string
  gratuito: boolean
  quantidade: number | null
  possuiKit: boolean
  itensKit: string[]
  tamanhosCamiseta: string[]
  quantidadeCamisetasPorTamanho: { [tamanho: string]: string }
  gpxFile: File | null
  gpxFileUrl: string | null
  showRoute: boolean
  showMap: boolean
  showElevation: boolean
}

// Interface para lote
export interface Lote {
  id: string
  nome: string
  dataInicio: string
  horaInicio: string
  quantidadeTotal: string
  salvo: boolean
  ingressos: Ingresso[]
}

// Interface para formulário completo
export interface NewEventFormData {
  // Step 1: Informações da Corrida
  nome: string
  data: string
  horarioInicio: string
  horarioFim: string
  categoria: string
  language: "pt" | "es" | "en"
  modalidades: string[]
  distancias: string[]
  distanciasCustom: string[]
  difficulty_level: "Fácil" | "Moderado" | "Difícil" | "Muito Difícil" | ""
  major_access: boolean
  major_access_type: string
  race_type: "asfalto" | "trail" | "misto" | ""
  bannerEvento: File | null
  gpxStrava: File | null
  // Endereço
  pais: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  quantidade_total: string
  // Step 2: Lotes e Ingressos
  lotes: Lote[]
  // Step 3: Meios de Pagamento
  meiosPagamento: {
    pix: boolean
    cartaoCredito: boolean
    boleto: boolean
    parcelamento: {
      habilitado: boolean
      maxParcelas: number
      assumirJuros: boolean
    }
    taxaAdministracao: {
      percentual: number
      assumirTaxa: boolean
    }
  }
  // Step 4: Descrição do Evento
  descricao: string
}

// Props para componentes de step
export interface StepProps {
  formData: NewEventFormData
  setFormData: React.Dispatch<React.SetStateAction<NewEventFormData>>
}