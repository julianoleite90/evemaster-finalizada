"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Shield, Loader2, ChevronRight, ChevronLeft, Check, CreditCard, QrCode, FileText, User, MapPin, Wallet, Info, CheckCircle2, Edit2, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getEventById } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
import EventPixels from "@/components/analytics/EventPixels"
import Link from "next/link"
import Image from "next/image"

// Tamanhos de camiseta
const TAMANHOS_CAMISETA = ["PP", "P", "M", "G", "GG", "XG", "XXG"]

interface Participante {
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
}

const participanteVazio: Participante = {
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
}

// Lista de países
const PAISES = [
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

export default function CheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [ingressosSelecionados, setIngressosSelecionados] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [currentParticipante, setCurrentParticipante] = useState(0)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [meioPagamento, setMeioPagamento] = useState("")
  const [temKit, setTemKit] = useState(false)
  const [temCamiseta, setTemCamiseta] = useState(false)
  const [paisEvento, setPaisEvento] = useState("brasil")
  const [idioma, setIdioma] = useState("pt")
  const [runningClub, setRunningClub] = useState<any>(null) // Dados do clube de corrida se houver
  
  // Estados para login rápido
  const [verificandoCPF, setVerificandoCPF] = useState(false)
  const [usuarioExiste, setUsuarioExiste] = useState<any>(null)
  const [mostrarLoginRapido, setMostrarLoginRapido] = useState(false)
  const [enviandoCodigo, setEnviandoCodigo] = useState(false)
  const [codigoEnviado, setCodigoEnviado] = useState(false)
  const [codigoLogin, setCodigoLogin] = useState("")
  const [validandoCodigo, setValidandoCodigo] = useState(false)
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [perfisSalvos, setPerfisSalvos] = useState<any[]>([])
  const [mostrarSelecaoParticipantes, setMostrarSelecaoParticipantes] = useState(false)
  const [salvarPerfil, setSalvarPerfil] = useState<{ [key: number]: boolean }>({})
  const [permiteEdicao, setPermiteEdicao] = useState(false) // Controla se permite editar campos quando logado
  
  // Novos estados para o fluxo inteligente
  const [mostrarPopupIncluirParticipantes, setMostrarPopupIncluirParticipantes] = useState(false)
  const [quantidadeParticipantesAdicionais, setQuantidadeParticipantesAdicionais] = useState(1)
  const [mostrarBuscaParticipantes, setMostrarBuscaParticipantes] = useState(false)
  const [termoBuscaParticipante, setTermoBuscaParticipante] = useState("")
  const [participanteAtualEmEdicao, setParticipanteAtualEmEdicao] = useState<number | null>(null) // Qual participante está sendo editado na busca

  const footerPaymentText: Record<string, string> = {
    pt: "Aceitamos todos os cartões, Pix e Boleto",
    es: "Aceptamos todas las tarjetas, Pix y Boleto",
    en: "We accept all credit cards, Pix and Boleto",
  }

  // Traduções
  const traducoes: Record<string, Record<string, string>> = {
    pt: {
      pagamentoSeguro: "Pagamento 100% seguro",
      dadosPessoais: "Dados Pessoais",
      endereco: "Endereço",
      pagamento: "Pagamento",
      finalizarInscricao: "Finalizar Inscrição",
      nomeCompleto: "Nome Completo",
      email: "Email",
      telefone: "Telefone",
      idade: "Idade",
      genero: "Gênero",
      masculino: "Masculino",
      feminino: "Feminino",
      outro: "Outro",
      prefiroNaoInformar: "Prefiro não informar",
      cep: "CEP",
      estado: "Estado",
      cidade: "Cidade",
      bairro: "Bairro",
      numero: "Número",
      complemento: "Complemento",
      cpf: "CPF",
      documento: "Documento",
      formaPagamento: "Forma de Pagamento",
      pix: "PIX",
      pagamentoInstantaneo: "Pagamento instantâneo",
      cartaoCredito: "Cartão de Crédito",
      parceleAte: "Parcele em até 12x",
      boleto: "Boleto Bancário",
      vencimento: "Vencimento em 3 dias úteis",
      termoResponsabilidade: "Termo de Responsabilidade",
      liAceito: "Li e aceito o termo de responsabilidade",
      voltar: "Voltar",
      continuar: "Continuar",
      finalizarPagar: "Finalizar e Pagar",
      resumoInscricao: "Resumo da Inscrição",
      subtotal: "Subtotal",
      taxaServico: "Taxa de serviço",
      total: "Total",
      participante: "Participante",
      ingresso: "Ingresso",
      ingressos: "ingresso(s)",
      selecione: "Selecione",
      tamanhoCamiseta: "Tamanho da Camiseta",
    },
    es: {
      pagamentoSeguro: "Pago 100% seguro",
      dadosPessoais: "Datos Personales",
      endereco: "Dirección",
      pagamento: "Pago",
      finalizarInscricao: "Finalizar Inscripción",
      nomeCompleto: "Nombre Completo",
      email: "Correo Electrónico",
      telefone: "Teléfono",
      idade: "Edad",
      genero: "Género",
      masculino: "Masculino",
      feminino: "Femenino",
      outro: "Otro",
      prefiroNaoInformar: "Prefiero no informar",
      cep: "Código Postal",
      estado: "Provincia/Estado",
      cidade: "Ciudad",
      bairro: "Barrio",
      numero: "Número",
      complemento: "Complemento",
      cpf: "CPF",
      documento: "Documento",
      formaPagamento: "Forma de Pago",
      pix: "PIX",
      pagamentoInstantaneo: "Pago instantáneo",
      cartaoCredito: "Tarjeta de Crédito",
      parceleAte: "Hasta 12 cuotas",
      boleto: "Boleto Bancario",
      vencimento: "Vencimiento en 3 días hábiles",
      termoResponsabilidade: "Término de Responsabilidad",
      liAceito: "He leído y acepto el término de responsabilidad",
      voltar: "Volver",
      continuar: "Continuar",
      finalizarPagar: "Finalizar y Pagar",
      resumoInscricao: "Resumen de la Inscripción",
      subtotal: "Subtotal",
      taxaServico: "Tarifa de servicio",
      total: "Total",
      participante: "Participante",
      ingresso: "Entrada",
      ingressos: "entrada(s)",
      selecione: "Seleccione",
      tamanhoCamiseta: "Talla de Camiseta",
    },
    en: {
      pagamentoSeguro: "100% Secure Payment",
      dadosPessoais: "Personal Information",
      endereco: "Address",
      pagamento: "Payment",
      finalizarInscricao: "Complete Registration",
      nomeCompleto: "Full Name",
      email: "Email",
      telefone: "Phone",
      idade: "Age",
      genero: "Gender",
      masculino: "Male",
      feminino: "Female",
      outro: "Other",
      prefiroNaoInformar: "Prefer not to say",
      cep: "Postal Code",
      estado: "State/Province",
      cidade: "City",
      bairro: "Neighborhood",
      numero: "Number",
      complemento: "Apt/Suite",
      cpf: "CPF",
      documento: "ID Document",
      formaPagamento: "Payment Method",
      pix: "PIX",
      pagamentoInstantaneo: "Instant payment",
      cartaoCredito: "Credit Card",
      parceleAte: "Up to 12 installments",
      boleto: "Bank Slip",
      vencimento: "Due in 3 business days",
      termoResponsabilidade: "Liability Waiver",
      liAceito: "I have read and accept the liability waiver",
      voltar: "Back",
      continuar: "Continue",
      finalizarPagar: "Complete & Pay",
      resumoInscricao: "Registration Summary",
      subtotal: "Subtotal",
      taxaServico: "Service fee",
      total: "Total",
      participante: "Participant",
      ingresso: "Ticket",
      ingressos: "ticket(s)",
      selecione: "Select",
      tamanhoCamiseta: "T-Shirt Size",
    },
  }

  const t = (key: string) => traducoes[idioma]?.[key] || traducoes.pt[key] || key
  const isBrasil = paisEvento === "brasil"

  // Carregar dados do evento e ingressos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const event = await getEventById(eventId)
        
        if (!event) {
          toast.error("Evento não encontrado")
          router.push("/")
          return
        }

        setEventData(event)

        // Definir país do evento e idioma
        const pais = (event.country || "brasil").toLowerCase()
        setPaisEvento(pais)
        
        // Usar idioma do evento se disponível, senão usar país como fallback
        if (event.language && (event.language === "pt" || event.language === "es" || event.language === "en")) {
          setIdioma(event.language)
        } else if (pais === "argentina") {
          setIdioma("es")
        } else if (pais !== "brasil") {
          setIdioma("en")
        }

        // Verificar se há parâmetro de clube de corrida
        const clubId = searchParams.get("club")
        if (clubId) {
          console.log("🏃 [CHECKOUT] Clube de corrida detectado na URL:", clubId)
          const supabase = createClient()
          const { data: clubData, error: clubError } = await supabase
            .from("running_clubs")
            .select("*")
            .eq("id", clubId)
            .eq("event_id", eventId)
            .eq("status", "accepted")
            .maybeSingle()
          
          if (clubData && !clubError) {
            // Verificar se ainda há ingressos disponíveis
            const ticketsRemaining = clubData.tickets_allocated - (clubData.tickets_used || 0)
            if (ticketsRemaining > 0) {
              // Verificar se o prazo ainda é válido
              const deadline = new Date(clubData.deadline)
              const now = new Date()
              if (deadline >= now) {
                setRunningClub(clubData)
                console.log("✅ [CHECKOUT] Clube de corrida válido encontrado:", clubData)
                console.log("🏃 [CHECKOUT] Desconto base:", clubData.base_discount, "%")
              } else {
                console.warn("⚠️ [CHECKOUT] Prazo do clube expirado")
              }
            } else {
              console.warn("⚠️ [CHECKOUT] Clube sem ingressos disponíveis")
            }
          } else {
            console.warn("⚠️ [CHECKOUT] Clube não encontrado ou não autorizado:", clubError)
          }
        }

        // Parsear ingressos da URL
        const loteId = searchParams.get("lote")
        const ingressosParam = searchParams.get("ingressos")
        
        if (!ingressosParam || !loteId) {
          toast.error("Selecione os ingressos primeiro")
          router.push(`/evento/${eventId}`)
          return
        }

        const ingressosObj = JSON.parse(decodeURIComponent(ingressosParam))
        
        // Buscar detalhes do lote
        const lote = event.ticket_batches?.find((b: any) => b.id === loteId)
        if (!lote) {
          toast.error("Lote não encontrado")
          router.push(`/evento/${eventId}`)
          return
        }

        // Montar lista de ingressos
        const listaIngressos: any[] = []
        let verificarKit = false
        let verificarCamiseta = false

        Object.entries(ingressosObj).forEach(([categoria, quantidade]) => {
          const ticket = lote.tickets?.find((t: any) => t.category === categoria)
          if (ticket && Number(quantidade) > 0) {
            for (let i = 0; i < Number(quantidade); i++) {
              listaIngressos.push({
                id: ticket.id, // ID do ticket para salvar na inscrição
                categoria,
                valor: ticket.is_free ? 0 : parseFloat(ticket.price || "0"),
                gratuito: ticket.is_free,
                hasKit: ticket.has_kit,
                kitItems: ticket.kit_items || [],
                shirtSizes: ticket.shirt_sizes || [],
              })
              
              if (ticket.has_kit) verificarKit = true
              if (ticket.kit_items?.includes("camiseta")) verificarCamiseta = true
            }
          }
        })

        if (listaIngressos.length === 0) {
          toast.error("Nenhum ingresso selecionado")
          router.push(`/evento/${eventId}`)
          return
        }

        setIngressosSelecionados(listaIngressos)
        setTemKit(verificarKit)
        setTemCamiseta(verificarCamiseta)
        
        // Inicializar participantes
        setParticipantes(listaIngressos.map(() => ({ ...participanteVazio })))
        
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar dados do checkout")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId, searchParams, router])

  // Buscar CEP
  const buscarCep = async (cep: string, index: number) => {
    const cepLimpo = cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        toast.error("CEP não encontrado")
        return
      }

      const novosParticipantes = [...participantes]
      novosParticipantes[index] = {
        ...novosParticipantes[index],
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }
      setParticipantes(novosParticipantes)
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setLoadingCep(false)
    }
  }

  // Atualizar participante
  const updateParticipante = (field: keyof Participante, value: string) => {
    const novosParticipantes = [...participantes]
    novosParticipantes[currentParticipante] = {
      ...novosParticipantes[currentParticipante],
      [field]: value,
    }
    setParticipantes(novosParticipantes)
  }

  // Formatar CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
  }

  // Função para mascarar email (exemplo: julianodesouzaleite@gmail.com → julianode*******@g******)
  const mascararEmail = (email: string) => {
    if (!email) return ''
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    
    // Mostrar primeiras 7 letras do local + asteriscos
    const localMasked = local.length > 7 
      ? local.substring(0, 7) + '*'.repeat(7) // julianode + 7 asteriscos
      : local.substring(0, Math.min(3, local.length)) + '*'.repeat(Math.max(3, local.length - 3))
    
    // Mostrar primeira letra do domínio + asteriscos
    const domainMasked = domain.length > 1
      ? domain.substring(0, 1) + '*'.repeat(6) // g + 6 asteriscos
      : domain
    
    return `${localMasked}@${domainMasked}`
  }

  // Verificar CPF e oferecer login rápido
  const verificarCPF = async (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    console.log('🔍 [CHECKOUT] Verificando CPF:', { cpf, cleanCPF, length: cleanCPF.length })
    
    if (cleanCPF.length !== 11) {
      console.log('⚠️ [CHECKOUT] CPF não tem 11 dígitos:', cleanCPF.length)
      setUsuarioExiste(null)
      setMostrarLoginRapido(false)
      return
    }

    try {
      setVerificandoCPF(true)
      console.log('📡 [CHECKOUT] Enviando requisição para /api/auth/verificar-cpf com CPF:', cleanCPF)
      
      const res = await fetch('/api/auth/verificar-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cleanCPF }),
      })

      console.log('📥 [CHECKOUT] Resposta recebida:', { status: res.status, ok: res.ok })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('❌ [CHECKOUT] Erro na API:', errorData)
        toast.error(errorData.error || 'Erro ao verificar CPF')
        setUsuarioExiste(null)
        setMostrarLoginRapido(false)
        return
      }

      const data = await res.json()
      console.log('✅ [CHECKOUT] Dados recebidos da API:', data)
      
      if (data.exists) {
        console.log('✅ [CHECKOUT] Usuário encontrado! Email:', data.email)
        setUsuarioExiste(data)
        setMostrarLoginRapido(true)
      } else {
        console.log('⚠️ [CHECKOUT] CPF não encontrado no banco de dados')
        setUsuarioExiste(null)
        setMostrarLoginRapido(false)
      }
    } catch (error) {
      console.error('❌ [CHECKOUT] Erro ao verificar CPF:', error)
      toast.error('Erro ao verificar CPF. Tente novamente.')
      setUsuarioExiste(null)
      setMostrarLoginRapido(false)
    } finally {
      setVerificandoCPF(false)
    }
  }

  // Enviar código de login rápido
  const enviarCodigoLogin = async () => {
    if (!usuarioExiste || !participante.cpf) return

    try {
      setEnviandoCodigo(true)
      const res = await fetch('/api/auth/enviar-codigo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usuarioExiste.email,
          cpf: participante.cpf.replace(/\D/g, ''),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setCodigoEnviado(true)
        toast.success('Código enviado para seu email!')
      } else {
        toast.error(data.error || 'Erro ao enviar código')
      }
    } catch (error) {
      console.error('Erro ao enviar código:', error)
      toast.error('Erro ao enviar código')
    } finally {
      setEnviandoCodigo(false)
    }
  }

  // Validar código e fazer login
  const validarCodigoLogin = async () => {
    if (!codigoLogin || codigoLogin.length !== 6 || !usuarioExiste || !participante.cpf) {
      toast.error('Digite o código de 6 dígitos')
      return
    }

    try {
      setValidandoCodigo(true)
      const res = await fetch('/api/auth/validar-codigo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usuarioExiste.email,
          cpf: participante.cpf.replace(/\D/g, ''),
          code: codigoLogin,
        }),
      })

      console.log('📥 [CHECKOUT] Resposta validar código:', { status: res.status, ok: res.ok })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ [CHECKOUT] Erro ao validar código:', errorData)
        toast.error(errorData.error || 'Erro ao validar código. Tente novamente.')
        return
      }

      const data = await res.json()
      console.log('✅ [CHECKOUT] Dados recebidos da validação:', data)

      if (data.user) {
        setUsuarioLogado(data.user)
        setMostrarLoginRapido(false)
        setCodigoEnviado(false)
        setCodigoLogin("")
        
        // Preencher dados do usuário
        const novosParticipantes = [...participantes]
        // Formatar telefone se existir (remover formatação existente e reaplicar)
        let telefoneFormatado = participante.telefone
        if (data.user.phone) {
          if (isBrasil) {
            // Remover formatação existente e reaplicar
            const telefoneLimpo = data.user.phone.replace(/\D/g, '')
            telefoneFormatado = formatTelefone(telefoneLimpo)
          } else {
            telefoneFormatado = data.user.phone
          }
        }
        
        // Formatar CPF se existir
        let cpfFormatado = participante.cpf
        if (data.user.cpf) {
          if (participante.paisResidencia === "brasil") {
            const cpfLimpo = data.user.cpf.replace(/\D/g, '')
            cpfFormatado = formatCPF(cpfLimpo)
          } else {
            cpfFormatado = data.user.cpf
          }
        }
        
        // Formatar CEP se existir
        let cepFormatado = participante.cep
        if (data.user.zip_code) {
          const cepLimpo = data.user.zip_code.replace(/\D/g, '')
          cepFormatado = formatCEP(cepLimpo)
        }
        
        novosParticipantes[currentParticipante] = {
          ...novosParticipantes[currentParticipante],
          nome: data.user.full_name || participante.nome,
          email: data.user.email || participante.email,
          telefone: telefoneFormatado,
          cpf: cpfFormatado,
          idade: participante.idade, // Idade não está salva na tabela users
          genero: participante.genero, // Gender não está salvo na tabela users
          cep: cepFormatado,
          endereco: data.user.address || participante.endereco,
          numero: data.user.address_number || participante.numero,
          complemento: data.user.address_complement || participante.complemento,
          bairro: data.user.neighborhood || participante.bairro,
          cidade: data.user.city || participante.cidade,
          estado: data.user.state || participante.estado,
        }
        setParticipantes(novosParticipantes)
        setPermiteEdicao(false) // Iniciar com campos bloqueados

        // Fazer login no Supabase usando magic link (se disponível)
        const supabase = createClient()
        if (data.magicLink) {
          // Redirecionar para o magic link para completar o login
          // Por enquanto, apenas armazenar os dados do usuário localmente
          // O login completo será feito quando o usuário clicar no link
        }

        // Buscar perfis salvos (mesmo sem login completo, podemos buscar se tiver userId)
        if (data.user?.id) {
          await buscarPerfisSalvos()
        }

        toast.success('Login realizado com sucesso! Dados preenchidos automaticamente.')
      } else {
        toast.error(data.error || 'Código inválido')
      }
    } catch (error) {
      console.error('Erro ao validar código:', error)
      toast.error('Erro ao validar código')
    } finally {
      setValidandoCodigo(false)
    }
  }

  // Buscar perfis salvos
  const buscarPerfisSalvos = async () => {
    if (!usuarioLogado) return

    try {
      const res = await fetch('/api/participants/perfis-salvos')
      const data = await res.json()
      if (res.ok && data.profiles) {
        setPerfisSalvos(data.profiles)
      }
    } catch (error) {
      console.error('Erro ao buscar perfis salvos:', error)
    }
  }

  // Alias para compatibilidade
  const fetchPerfisSalvos = buscarPerfisSalvos

  // Salvar perfil de participante
  const salvarPerfilParticipante = async (index: number) => {
    const p = participantes[index]
    if (!p.nome || !p.email || !p.cpf) {
      toast.error('Preencha nome, email e CPF para salvar o perfil')
      return
    }

    // Obter userId do usuário principal (logado ou do primeiro participante)
    let userIdPrincipal: string | null = null

    if (usuarioLogado?.id) {
      userIdPrincipal = usuarioLogado.id
    } else {
      // Tentar obter userId do primeiro participante através da API criar-conta-automatica
      try {
        const primeiroParticipante = participantes[0]
        const createAccountResponse = await fetch('/api/auth/criar-conta-automatica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: primeiroParticipante.email,
            nome: primeiroParticipante.nome,
            telefone: primeiroParticipante.telefone,
            cpf: primeiroParticipante.cpf,
          }),
        })

        if (createAccountResponse.ok) {
          const accountResult = await createAccountResponse.json()
          userIdPrincipal = accountResult.userId || null
        }
      } catch (error) {
        console.error('Erro ao obter userId do principal:', error)
      }
    }

    if (!userIdPrincipal) {
      toast.error('Não foi possível salvar o perfil. Complete a inscrição primeiro.')
      return
    }

    try {
      const res = await fetch('/api/participants/salvar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userIdPrincipal, // Passar userId do principal
          full_name: p.nome,
          email: p.email,
          phone: p.telefone,
          cpf: p.cpf.replace(/\D/g, ''),
          birth_date: p.idade ? new Date(new Date().getFullYear() - parseInt(p.idade), 0, 1).toISOString().split('T')[0] : null,
          age: p.idade ? parseInt(p.idade) : null,
          gender: p.genero === 'Masculino' ? 'male' : p.genero === 'Feminino' ? 'female' : p.genero || null,
          country: p.paisResidencia || 'brasil',
          zip_code: p.cep,
          address: p.endereco,
          address_number: p.numero,
          address_complement: p.complemento,
          neighborhood: p.bairro,
          city: p.cidade,
          state: p.estado,
          shirt_size: p.tamanhoCamiseta,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Perfil salvo com sucesso!')
        if (usuarioLogado) {
          await buscarPerfisSalvos()
        }
      } else {
        toast.error(data.error || 'Erro ao salvar perfil')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    }
  }

  // Selecionar participante salvo
  // Confirmar inclusão de mais participantes
  const confirmarIncluirParticipantes = async () => {
    if (quantidadeParticipantesAdicionais < 1) {
      toast.error('Selecione pelo menos 1 participante adicional')
      return
    }

    // Adicionar participantes vazios
    const novosParticipantes = [...participantes]
    for (let i = 0; i < quantidadeParticipantesAdicionais; i++) {
      novosParticipantes.push({ ...participanteVazio })
    }
    setParticipantes(novosParticipantes)
    
    // Adicionar ingressos correspondentes (usar o mesmo ingresso do primeiro participante)
    const ingressoPrincipal = ingressosSelecionados[0]
    const novosIngressos = [...ingressosSelecionados]
    for (let i = 0; i < quantidadeParticipantesAdicionais; i++) {
      novosIngressos.push({ ...ingressoPrincipal })
    }
    setIngressosSelecionados(novosIngressos)
    
    setMostrarPopupIncluirParticipantes(false)
    
    // Buscar perfis salvos se estiver logado
    if (usuarioLogado) {
      await fetchPerfisSalvos()
    }
    
    // Mostrar busca de participantes para o primeiro participante adicional
    setParticipanteAtualEmEdicao(1)
    setMostrarBuscaParticipantes(true)
  }

  // Filtrar perfis salvos por termo de busca
  const perfisFiltrados = perfisSalvos.filter(perfil => {
    if (!termoBuscaParticipante) return true
    const termo = termoBuscaParticipante.toLowerCase()
    return (
      perfil.full_name?.toLowerCase().includes(termo) ||
      perfil.email?.toLowerCase().includes(termo) ||
      perfil.cpf?.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
    )
  })

  // Selecionar participante salvo
  const selecionarParticipanteSalvo = (perfil: any) => {
    if (participanteAtualEmEdicao === null) return
    
    const novosParticipantes = [...participantes]
    novosParticipantes[participanteAtualEmEdicao] = {
      ...participanteVazio,
      nome: perfil.full_name || "",
      email: perfil.email || "",
      telefone: perfil.phone || "",
      idade: perfil.age ? String(perfil.age) : "",
      genero: perfil.gender === 'male' ? 'Masculino' : perfil.gender === 'female' ? 'Feminino' : "",
      paisResidencia: perfil.country || "brasil",
      cep: perfil.zip_code || "",
      endereco: perfil.address || "",
      numero: perfil.address_number || "",
      complemento: perfil.address_complement || "",
      bairro: perfil.neighborhood || "",
      cidade: perfil.city || "",
      estado: perfil.state || "",
      cpf: perfil.cpf || "",
      tamanhoCamiseta: perfil.shirt_size || "",
      aceiteTermo: false,
    }
    setParticipantes(novosParticipantes)
    setCurrentParticipante(participanteAtualEmEdicao)
    setCurrentStep(1)
    setMostrarBuscaParticipantes(false)
    setParticipanteAtualEmEdicao(null)
    setTermoBuscaParticipante("")
    toast.success('Participante adicionado! Revise e edite os dados se necessário.')
  }

  // Criar novo participante (não usar perfil salvo)
  const criarNovoParticipante = () => {
    if (participanteAtualEmEdicao === null) return
    
    setCurrentParticipante(participanteAtualEmEdicao)
    setCurrentStep(1)
    setMostrarBuscaParticipantes(false)
    setParticipanteAtualEmEdicao(null)
    setTermoBuscaParticipante("")
  }

  // Continuar para próximo participante na busca
  const continuarParaProximoParticipante = () => {
    if (participanteAtualEmEdicao === null) return
    
    const proximoIndex = participanteAtualEmEdicao + 1
    if (proximoIndex < participantes.length) {
      setParticipanteAtualEmEdicao(proximoIndex)
      setTermoBuscaParticipante("")
    } else {
      // Todos os participantes foram preenchidos, finalizar
      setMostrarBuscaParticipantes(false)
      setParticipanteAtualEmEdicao(null)
      handleSubmit()
    }
  }

  // Formatar telefone
  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
  }

  // Formatar CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2")
  }

  // Calcular total
  const calcularTotal = () => {
    let subtotal = ingressosSelecionados.reduce((sum, ing) => sum + ing.valor, 0)
    let desconto = 0
    
    // Aplicar desconto do clube de corrida se houver
    if (runningClub && runningClub.base_discount > 0) {
      // Calcular desconto base (percentual)
      const descontoBase = (subtotal * runningClub.base_discount) / 100
      desconto += descontoBase
      
      // Verificar desconto progressivo
      if (runningClub.progressive_discount_threshold && 
          runningClub.progressive_discount_value &&
          ingressosSelecionados.length >= runningClub.progressive_discount_threshold) {
        const descontoProgressivo = (subtotal * runningClub.progressive_discount_value) / 100
        desconto += descontoProgressivo
        console.log("🏃 [CHECKOUT] Desconto progressivo aplicado:", runningClub.progressive_discount_value, "%")
      }
      
      console.log("🏃 [CHECKOUT] Desconto aplicado:", desconto, "de", subtotal)
    }
    
    const subtotalComDesconto = Math.max(0, subtotal - desconto)
    const taxa = subtotalComDesconto > 0 ? ingressosSelecionados.length * 5 : 0
    const total = subtotalComDesconto + taxa
    
    return { 
      subtotal, 
      desconto, 
      subtotalComDesconto,
      taxa, 
      total 
    }
  }

  // Verificar se é gratuito
  const isGratuito = () => {
    return ingressosSelecionados.every(ing => ing.gratuito)
  }

  // Validar step atual
  const validarStep = () => {
    const p = participantes[currentParticipante]
    
    if (currentStep === 1) {
      if (!p.cpf || !p.nome || !p.email || !p.telefone || !p.idade || !p.genero) {
        toast.error("Preencha todos os campos obrigatórios")
        return false
      }
      if (!p.email.includes("@")) {
        toast.error("Email inválido")
        return false
      }
      // Validar CPF brasileiro
      if (p.paisResidencia === "brasil" && p.cpf.replace(/\D/g, '').length !== 11) {
        toast.error("CPF inválido")
        return false
      }
    }
    
    if (currentStep === 2) {
      if (!p.paisResidencia) {
        toast.error(idioma === "es" ? "Seleccione su país de residencia" : idioma === "en" ? "Select your country of residence" : "Selecione seu país de residência")
        return false
      }
      if (p.paisResidencia === "brasil" && !p.cep) {
        toast.error("Preencha o CEP")
        return false
      }
      if (!p.endereco || !p.numero || !p.cidade) {
        toast.error(idioma === "es" ? "Complete la dirección" : idioma === "en" ? "Fill in the address" : "Preencha o endereço completo")
        return false
      }
    }
    
    if (currentStep === 3) {
      if (!p.cpf) {
        toast.error(p.paisResidencia === "brasil" ? "CPF inválido" : p.paisResidencia === "argentina" ? "DNI inválido" : "Documento inválido")
        return false
      }
      if (p.paisResidencia === "brasil" && p.cpf.replace(/\D/g, "").length !== 11) {
        toast.error("CPF inválido - deve ter 11 dígitos")
        return false
      }
      if (temCamiseta && !p.tamanhoCamiseta) {
        toast.error("Selecione o tamanho da camiseta")
        return false
      }
      if (!p.aceiteTermo) {
        toast.error("Você precisa aceitar o termo de responsabilidade")
        return false
      }
      if (!isGratuito() && !meioPagamento) {
        toast.error("Selecione o meio de pagamento")
        return false
      }
    }
    
    return true
  }

  // Próximo step ou participante
  const handleNext = async () => {
    if (!validarStep()) return
    
    const totalSteps = isGratuito() ? 3 : 3
    const quantidadeIngressosInicial = ingressosSelecionados.length
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Último step do participante atual
      // Se for o primeiro participante e tinha apenas 1 ingresso no início
      if (currentParticipante === 0 && quantidadeIngressosInicial === 1) {
        // Mostrar popup perguntando se deseja incluir mais participantes
        setMostrarPopupIncluirParticipantes(true)
      } else if (currentParticipante < participantes.length - 1) {
        // Próximo participante já existe (tinha 2+ ingressos desde o início)
        // Mostrar busca de participantes para o próximo participante
        setParticipanteAtualEmEdicao(currentParticipante + 1)
        if (usuarioLogado) {
          await fetchPerfisSalvos()
        }
        setMostrarBuscaParticipantes(true)
      } else {
        // Último participante - finalizar inscrição
        handleSubmit()
      }
    }
  }

  // Voltar
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else if (currentParticipante > 0) {
      setCurrentParticipante(currentParticipante - 1)
      setCurrentStep(3)
    }
  }

  // Finalizar inscrição
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const supabase = createClient()

      console.log("=== INICIANDO INSCRIÇÃO ===")
      console.log("Participantes:", participantes)
      console.log("Ingressos:", ingressosSelecionados)
      console.log("Event ID:", eventId)

      // Primeiro, criar contas automaticamente para cada participante
      const userIdsMap = new Map<string, string>() // email -> userId
      
      for (const participante of participantes) {
        try {
          const createAccountResponse = await fetch('/api/auth/criar-conta-automatica', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: participante.email,
              nome: participante.nome,
              telefone: participante.telefone,
              cpf: participante.cpf,
              endereco: participante.endereco,
              numero: participante.numero,
              complemento: participante.complemento,
              bairro: participante.bairro,
              cidade: participante.cidade,
              estado: participante.estado,
              cep: participante.cep,
            }),
          })

          if (!createAccountResponse.ok) {
            const errorData = await createAccountResponse.json().catch(() => ({}))
            console.error('❌ Erro na API criar-conta-automatica:', createAccountResponse.status, errorData)
            // Continuar tentando buscar/criar usuário manualmente
          } else {
          const accountResult = await createAccountResponse.json()
          
            if (accountResult.userId) {
            userIdsMap.set(participante.email, accountResult.userId)
              console.log('✅ Conta criada/atualizada para:', participante.email, 'userId:', accountResult.userId)
          } else {
              console.warn('⚠️ API não retornou userId para:', participante.email, 'response:', accountResult)
            // Continuar sem user_id (será vinculado pelo email do atleta)
            }
          }
        } catch (accountError) {
          console.error('Erro ao criar conta para', participante.email, ':', accountError)
          // Não bloquear o fluxo se falhar
        }
      }

      // Salvar perfis de participantes se solicitado
      const userIdPrincipal = usuarioLogado?.id || userIdsMap.get(participantes[0]?.email) || null
      if (userIdPrincipal) {
        for (let i = 0; i < participantes.length; i++) {
          if (salvarPerfil[i] && i > 0) { // Apenas salvar perfis de acompanhantes (i > 0)
            const p = participantes[i]
            if (p.nome && p.email && p.cpf) {
              try {
                await fetch('/api/participants/salvar-perfil', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: userIdPrincipal, // Sempre usar userId do principal
                    full_name: p.nome,
                    email: p.email,
                    phone: p.telefone,
                    cpf: p.cpf.replace(/\D/g, ''),
                    birth_date: p.idade ? new Date(new Date().getFullYear() - parseInt(p.idade), 0, 1).toISOString().split('T')[0] : null,
                    age: p.idade ? parseInt(p.idade) : null,
                    gender: p.genero === 'Masculino' ? 'male' : p.genero === 'Feminino' ? 'female' : p.genero || null,
                    country: p.paisResidencia || 'brasil',
                    zip_code: p.cep,
                    address: p.endereco,
                    address_number: p.numero,
                    address_complement: p.complemento,
                    neighborhood: p.bairro,
                    city: p.cidade,
                    state: p.estado,
                    shirt_size: p.tamanhoCamiseta,
                  }),
                })
              } catch (error) {
                console.error('Erro ao salvar perfil do participante', i, ':', error)
                // Não bloquear o fluxo se falhar
              }
            }
          }
        }
      }

      // Array para armazenar os números de inscrição criados
      const registrationNumbers: string[] = []

      // Para cada participante, criar registro
      for (let i = 0; i < participantes.length; i++) {
        const p = participantes[i]
        const ingresso = ingressosSelecionados[i]
        const userId = userIdsMap.get(p.email) || null

        // Gerar número de inscrição
        const registrationNumber = `EVE-${Date.now().toString(36).toUpperCase()}-${i + 1}`

        console.log("Criando inscrição para:", p.nome, "userId:", userId)

        // Garantir disponibilidade do ticket antes de criar inscrição
        const { data: ticketData, error: ticketFetchError } = await supabase
          .from("tickets")
          .select("quantity")
          .eq("id", ingresso.id)
          .single()

        if (ticketFetchError) {
          console.error("ERRO AO BUSCAR TICKET:", ticketFetchError)
          toast.error("Erro ao validar ticket selecionado")
          throw ticketFetchError
        }

        // Se quantity é null, undefined ou 0, significa ilimitado
        const isUnlimited = !ticketData || ticketData.quantity === null || ticketData.quantity === undefined || ticketData.quantity === 0
        
        if (!isUnlimited && ticketData.quantity <= 0) {
          toast.error("Ingresso esgotado. Selecione outro ticket.")
          throw new Error("Ticket esgotado")
        }

        // 1. Criar inscrição com user_id, athlete_id e buyer_id
        const now = new Date()
        const insertData: any = {
          event_id: eventId,
          ticket_id: ingresso.id,
          registration_number: registrationNumber,
          registration_date: now.toISOString().split('T')[0],
          registration_time: now.toTimeString().split(' ')[0],
          status: isGratuito() ? "confirmed" : "pending",
          shirt_size: p.tamanhoCamiseta || null,
        }
        
        // Preencher athlete_id e buyer_id (obrigatórios) e user_id (opcional)
        if (userId) {
          insertData.athlete_id = userId
          insertData.buyer_id = userId
          insertData.user_id = userId
        } else {
          // Se não tiver userId, precisamos criar um usuário temporário ou usar um fallback
          // Por enquanto, vamos buscar ou criar um usuário pelo email
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', p.email)
            .maybeSingle()
          
          if (existingUser) {
            insertData.athlete_id = existingUser.id
            insertData.buyer_id = existingUser.id
          } else {
            // Se não encontrar, criar um usuário básico
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert({
                email: p.email,
                full_name: p.nome,
                role: 'ATLETA',
              })
              .select('id')
              .single()
            
            if (newUser && !userError) {
              insertData.athlete_id = newUser.id
              insertData.buyer_id = newUser.id
            } else {
              console.error("Erro ao criar usuário para inscrição:", userError)
              toast.error("Erro ao vincular usuário à inscrição")
              throw new Error("Erro ao criar usuário")
            }
          }
        }
        console.log("Dados insert registration:", insertData)

        const { data: registration, error: regError } = await supabase
          .from("registrations")
          .insert(insertData)
          .select("id, registration_number")
          .single()

        console.log("Registration result:", registration)

        if (regError) {
          console.error("ERRO INSCRIÇÃO:", JSON.stringify(regError, null, 2))
          toast.error(`Erro ao criar inscrição: ${regError.message}`)
          throw regError
        }

        // Armazenar o número de inscrição criado
        if (registration?.registration_number) {
          registrationNumbers.push(registration.registration_number)
        }

        // 2. Criar atleta vinculado à inscrição
        const athleteData = {
          registration_id: registration.id,
          full_name: p.nome,
          email: p.email,
          phone: p.telefone,
          cpf: p.cpf?.replace(/\D/g, "") || null,
          gender: p.genero || null,
          birth_date: null,
          age: p.idade ? parseInt(p.idade) : null,
          country: p.paisResidencia || 'brasil',
          address: p.endereco || null,
          address_number: p.numero || null,
          address_complement: p.complemento || null,
          neighborhood: p.bairro || null,
          city: p.cidade || null,
          state: p.estado || null,
          zip_code: p.cep?.replace(/\D/g, "") || null,
        }
        console.log("Dados insert athlete:", athleteData)

        const { data: athlete, error: athleteError } = await supabase
          .from("athletes")
          .insert(athleteData)
          .select("id")
          .single()

        console.log("Athlete result:", athlete)

        if (athleteError) {
          console.error("ERRO ATLETA:", JSON.stringify(athleteError, null, 2))
          console.error("Detalhes do erro:", {
            message: athleteError.message,
            code: athleteError.code,
            details: athleteError.details,
            hint: athleteError.hint,
            cpf: athleteData.cpf,
            email: athleteData.email
          })
          
          // Se o erro for de CPF duplicado, tentar buscar atleta existente
          if (athleteError.code === '23505' || athleteError.message?.includes('duplicate') || athleteError.message?.includes('unique')) {
            console.log("⚠️ CPF ou email duplicado detectado, tentando buscar atleta existente...")
            if (athleteData.cpf) {
              const { data: existingAthlete } = await supabase
                .from("athletes")
                .select("id")
                .eq("cpf", athleteData.cpf)
                .maybeSingle()
              
              if (existingAthlete) {
                console.log("✅ Atleta existente encontrado pelo CPF:", existingAthlete.id)
                // Continuar sem bloquear - o atleta já existe
              }
            }
          } else {
            // Outro tipo de erro - não bloqueia, atleta é informação adicional
            console.warn("⚠️ Erro ao criar atleta (não crítico):", athleteError.message)
          }
        }

        // 3. Se não for gratuito, criar pagamento
        if (!isGratuito()) {
          // Calcular valor com desconto do clube se houver
          let valorIngresso = ingresso.valor
          let descontoAplicado = 0
          
          if (runningClub && runningClub.base_discount > 0) {
            // Aplicar desconto base
            const descontoBase = (valorIngresso * runningClub.base_discount) / 100
            descontoAplicado += descontoBase
            
            // Verificar desconto progressivo
            if (runningClub.progressive_discount_threshold && 
                runningClub.progressive_discount_value &&
                ingressosSelecionados.length >= runningClub.progressive_discount_threshold) {
              const descontoProgressivo = (valorIngresso * runningClub.progressive_discount_value) / 100
              descontoAplicado += descontoProgressivo
            }
            
            valorIngresso = Math.max(0, valorIngresso - descontoAplicado)
            console.log("🏃 [CHECKOUT] Valor original:", ingresso.valor, "Desconto:", descontoAplicado, "Valor final:", valorIngresso)
          }
          
          const taxa = 5
          const valorTotal = valorIngresso + taxa
          
          const paymentData = {
            registration_id: registration.id,
            amount: valorTotal,
            discount_amount: descontoAplicado > 0 ? descontoAplicado.toString() : null,
            payment_method: meioPagamento || "pix",
            payment_status: "pending",
            running_club_id: runningClub?.id || null, // Salvar referência ao clube
          }

          const { error: payError } = await supabase
            .from("payments")
            .insert(paymentData)

          if (payError) {
            console.error("ERRO PAGAMENTO:", JSON.stringify(payError, null, 2))
          }
        }

        // 4. Decrementar quantidade disponível do ticket
        const newQuantity = Math.max(0, (ticketData.quantity || 0) - 1)
        const { error: updateTicketError } = await supabase
          .from("tickets")
          .update({ quantity: newQuantity })
          .eq("id", ingresso.id)

        if (updateTicketError) {
          console.error("ERRO AO ATUALIZAR QUANTIDADE:", updateTicketError)
        }

        // 5. Se houver clube de corrida, incrementar tickets_used
        if (runningClub) {
          const { error: updateClubError } = await supabase
            .from("running_clubs")
            .update({ 
              tickets_used: (runningClub.tickets_used || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", runningClub.id)

          if (updateClubError) {
            console.error("ERRO AO ATUALIZAR TICKETS_USED DO CLUBE:", updateClubError)
          } else {
            console.log("✅ [CHECKOUT] Tickets usados do clube atualizado:", runningClub.tickets_used + 1)
          }
        }
      }

      console.log("=== INSCRIÇÃO CONCLUÍDA COM SUCESSO ===")
      toast.success("Inscrição realizada com sucesso! Contas criadas automaticamente.")

      // Sinalizar que o evento foi atualizado para recarregar dados
      localStorage.setItem(`event_updated_${eventId}`, 'true')

      const resumoFinanceiro = calcularTotal()
      // Formatar data sem problemas de timezone
      const dataEvento = eventData.event_date
        ? (() => {
            const [year, month, day] = eventData.event_date.split('-').map(Number)
            const date = new Date(year, month - 1, day) // month é 0-indexed
            return date.toLocaleDateString('pt-BR')
          })()
        : ''
      const horaEvento = eventData.start_time
        ? eventData.start_time.substring(0, 5)
        : ''

      // Enviar emails de confirmação (em background)
      try {
        const emailPayload = {
          inscricoes: participantes.map((p, i) => ({
            email: p.email,
            nome: p.nome,
            categoria: ingressosSelecionados[i].categoria,
            valor: ingressosSelecionados[i].valor,
            gratuito: ingressosSelecionados[i].gratuito,
            codigoInscricao: registrationNumbers[i] || `EVE-${Date.now().toString(36).toUpperCase()}-${i + 1}`,
          })),
          evento: {
            nome: eventData.name,
            data: dataEvento,
            hora: horaEvento,
            local: eventData.location || eventData.address || '',
            descricao: eventData.description
              ? eventData.description.replace(/<[^>]*>/g, '').substring(0, 200)
              : undefined,
          },
          resumoFinanceiro: {
            subtotal: resumoFinanceiro.subtotal,
            taxa: resumoFinanceiro.taxa,
            total: resumoFinanceiro.total,
          },
        }

        console.log('📧 [Frontend] Enviando emails de confirmação...', {
          quantidade: emailPayload.inscricoes.length,
          emails: emailPayload.inscricoes.map(i => i.email),
        })

        const emailResponse = await fetch('/api/email/confirmacao-inscricao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error('❌ [Frontend] Erro HTTP ao enviar emails:', {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            error: errorText,
          })
        } else {
          const emailResult = await emailResponse.json()
          console.log('✅ [Frontend] Emails processados:', emailResult)
        }
      } catch (emailError) {
        console.error('❌ [Frontend] Erro ao enviar emails:', emailError)
        // Não bloquear o fluxo se o email falhar
      }
      
      // Redirecionar para página de obrigado
      const { subtotal, taxa, total } = resumoFinanceiro
      const resumoParam = encodeURIComponent(JSON.stringify({
        evento: eventData.name,
        eventoData: eventData.event_date ? (() => {
          const [year, month, day] = eventData.event_date.split('-').map(Number)
          const date = new Date(year, month - 1, day)
          return date.toLocaleDateString('pt-BR')
        })() : '',
        eventoLocal: eventData.location || eventData.address || '',
        ingressos: ingressosSelecionados.map((ing, i) => ({
          categoria: ing.categoria,
          participante: participantes[i].nome,
          valor: ing.valor,
        })),
        subtotal,
        taxa,
        total,
        gratuito: isGratuito(),
      }))
      
      router.push(`/inscricao/${eventId}/obrigado?resumo=${resumoParam}`)
      
    } catch (error: any) {
      console.error("Erro ao finalizar:", error)
      toast.error("Erro ao finalizar inscrição")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  const participante = participantes[currentParticipante]
  const ingresso = ingressosSelecionados[currentParticipante]
  const { subtotal, desconto, subtotalComDesconto, taxa, total } = calcularTotal()

  // Extrair dados dos pixels do event_settings
  const eventSettings = eventData?.event_settings?.[0] || {}
  const googleAnalyticsId = eventSettings.analytics_google_analytics_enabled 
    ? eventSettings.analytics_google_analytics_id 
    : null
  const googleTagManagerId = eventSettings.analytics_gtm_enabled 
    ? eventSettings.analytics_gtm_container_id 
    : null
  const facebookPixelId = eventSettings.analytics_facebook_pixel_enabled 
    ? eventSettings.analytics_facebook_pixel_id 
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Pixels de Rastreamento */}
      {eventData && (
        <EventPixels
          googleAnalyticsId={googleAnalyticsId}
          googleTagManagerId={googleTagManagerId}
          facebookPixelId={facebookPixelId}
        />
      )}
      
      {/* Header Melhorado */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image
                src="/images/logo/logo.png"
                alt="Logo EveMaster"
                width={126}
                height={36}
                className="h-6 md:h-8 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <Shield className="h-4 w-4 text-[#156634]" />
              <span className="text-xs md:text-sm font-medium text-[#156634]">{t("pagamentoSeguro")}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            {/* Indicador de progresso */}
            {participantes.length > 1 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("participante")} {currentParticipante + 1} de {participantes.length}
                </p>
                <div className="flex gap-2">
                  {participantes.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${
                        i < currentParticipante
                          ? "bg-green-500"
                          : i === currentParticipante
                          ? "bg-[#156634]"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <Card className="min-h-[520px] flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {currentStep === 1 && t("dadosPessoais")}
                      {currentStep === 2 && t("endereco")}
                      {currentStep === 3 && (isGratuito() ? t("finalizarInscricao") : t("pagamento"))}
                    </CardTitle>
                    {participantes.length > 1 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("ingresso")}: {ingresso?.categoria}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === step
                            ? "bg-[#156634] text-white"
                            : currentStep > step
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {currentStep > step ? <Check className="h-4 w-4" /> : step}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                {/* Step 1: Dados Pessoais */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    {/* Botão de edição quando logado */}
                    {usuarioLogado && currentParticipante === 0 && !permiteEdicao && (
                      <div className="flex items-center justify-end mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPermiteEdicao(true)}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar dados
                        </Button>
                      </div>
                    )}
                    
                    {/* CPF como primeiro campo */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cpf">
                          {participante.paisResidencia === "brasil" 
                            ? "CPF" 
                            : participante.paisResidencia === "argentina"
                            ? "DNI"
                            : idioma === "es" ? "Documento" : idioma === "en" ? "ID Document" : "Documento"} *
                        </Label>
                        {usuarioLogado && currentParticipante === 0 && !permiteEdicao && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="cpf"
                          value={participante.cpf}
                          onChange={(e) => {
                            const formatted = participante.paisResidencia === "brasil" ? formatCPF(e.target.value) : e.target.value
                            updateParticipante("cpf", formatted)
                            // Verificar CPF após digitar 11 dígitos (apenas para Brasil e apenas no primeiro participante)
                            if (currentParticipante === 0 && participante.paisResidencia === "brasil" && formatted.replace(/\D/g, '').length === 11) {
                              verificarCPF(formatted)
                            }
                          }}
                          placeholder={
                            participante.paisResidencia === "brasil" 
                              ? "000.000.000-00" 
                              : participante.paisResidencia === "argentina"
                              ? "12.345.678"
                              : idioma === "es" ? "Número de documento" : "Document number"
                          }
                          disabled={!!usuarioLogado && currentParticipante === 0 && !permiteEdicao}
                        />
                        {verificandoCPF && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      
                      {/* Diálogo de login rápido */}
                      {mostrarLoginRapido && !usuarioLogado && usuarioExiste && (
                        <div className="mt-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 mb-3">
                                Faça login rápido para preencher seus dados automaticamente.
                              </p>
                              <div className="text-xs text-gray-600 bg-white/60 px-3 py-1.5 rounded-md inline-block font-mono">
                                {usuarioExiste?.email ? mascararEmail(usuarioExiste.email) : ''}
                              </div>
                            </div>
                          </div>
                          
                          {!codigoEnviado ? (
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <Button
                                type="button"
                                onClick={enviarCodigoLogin}
                                disabled={enviandoCodigo}
                                className="flex-1 bg-[#156634] hover:bg-[#1a7a3e] text-white font-medium"
                              >
                                {enviandoCodigo ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando código...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Fazer login rápido
                                  </>
                                )}
                              </Button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMostrarLoginRapido(false)
                                  setUsuarioExiste(null)
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                style={{
                                  color: '#374151',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#111827'
                                  e.currentTarget.style.backgroundColor = '#f9fafb'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#374151'
                                  e.currentTarget.style.backgroundColor = '#ffffff'
                                }}
                                className="flex-1 h-10 px-4 py-2 rounded-md border border-gray-300 bg-white transition-colors font-medium text-sm"
                              >
                                Continuar sem login
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-2">
                              <div className="bg-white/80 rounded-lg p-3 border border-green-200">
                                <p className="text-xs text-gray-600 mb-2 text-center">
                                  Código enviado para <span className="font-medium text-gray-900 font-mono">{usuarioExiste?.email ? mascararEmail(usuarioExiste.email) : ''}</span>
                                </p>
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    maxLength={6}
                                    value={codigoLogin}
                                    onChange={(e) => setCodigoLogin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="flex-1 font-mono text-center text-xl tracking-[0.5em] h-12 border-2 focus:border-green-500"
                                  />
                                  <Button
                                    type="button"
                                    onClick={validarCodigoLogin}
                                    disabled={validandoCodigo || codigoLogin.length !== 6}
                                    className="bg-[#156634] hover:bg-[#1a7a3e] text-white px-6"
                                  >
                                    {validandoCodigo ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Validando...
                                      </>
                                    ) : (
                                      'Validar'
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setCodigoEnviado(false)
                                  setCodigoLogin("")
                                }}
                                className="w-full text-xs text-gray-600 hover:text-gray-900"
                              >
                                Não recebeu o código? Reenviar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="nome">{t("nomeCompleto")} *</Label>
                        {usuarioLogado && currentParticipante === 0 && !permiteEdicao && (
                          <Lock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <Input
                        id="nome"
                        value={participante.nome}
                        onChange={(e) => updateParticipante("nome", e.target.value)}
                        placeholder={t("nomeCompleto")}
                        disabled={!!usuarioLogado && currentParticipante === 0 && !permiteEdicao}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("email")} *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={participante.email}
                          onChange={(e) => updateParticipante("email", e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">{t("telefone")} *</Label>
                        <Input
                          id="telefone"
                          value={participante.telefone}
                          onChange={(e) => updateParticipante("telefone", isBrasil ? formatTelefone(e.target.value) : e.target.value)}
                          placeholder={isBrasil ? "(00) 00000-0000" : "+00 000 000 0000"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="idade">{t("idade")} *</Label>
                          {usuarioLogado && currentParticipante === 0 && !permiteEdicao && (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Input
                          id="idade"
                          type="number"
                          min="1"
                          max="120"
                          value={participante.idade}
                          onChange={(e) => updateParticipante("idade", e.target.value)}
                          placeholder="Ex: 30"
                          disabled={!!usuarioLogado && currentParticipante === 0 && !permiteEdicao}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{t("genero")} *</Label>
                          {usuarioLogado && currentParticipante === 0 && !permiteEdicao && (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Select
                          value={participante.genero}
                          onValueChange={(value) => updateParticipante("genero", value)}
                          disabled={!!usuarioLogado && currentParticipante === 0 && !permiteEdicao}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selecione")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">{t("masculino")}</SelectItem>
                            <SelectItem value="Feminino">{t("feminino")}</SelectItem>
                            <SelectItem value="Outro">{t("outro")}</SelectItem>
                            <SelectItem value="Prefiro não informar">{t("prefiroNaoInformar")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Endereço */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {/* País de Residência */}
                    <div className="space-y-2">
                      <Label>{idioma === "es" ? "País de Residencia" : idioma === "en" ? "Country of Residence" : "País de Residência"} *</Label>
                      <Select
                        value={participante.paisResidencia}
                        onValueChange={(value) => updateParticipante("paisResidencia", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selecione")} />
                        </SelectTrigger>
                        <SelectContent>
                          {PAISES.map((pais) => (
                            <SelectItem key={pais.value} value={pais.value}>
                              {idioma === "es" ? pais.labelEs : idioma === "en" ? pais.labelEn : pais.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CEP apenas para Brasil */}
                    {participante.paisResidencia === "brasil" ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cep">CEP *</Label>
                            <Input
                              id="cep"
                              value={participante.cep}
                              onChange={(e) => updateParticipante("cep", formatCEP(e.target.value))}
                              onBlur={(e) => buscarCep(e.target.value, currentParticipante)}
                              placeholder="00000-000"
                              disabled={loadingCep}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estado">{idioma === "es" ? "Estado" : idioma === "en" ? "State" : "Estado"}</Label>
                            <Input
                              id="estado"
                              value={participante.estado}
                              onChange={(e) => updateParticipante("estado", e.target.value)}
                              placeholder="UF"
                              disabled={loadingCep}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cidade">{idioma === "es" ? "Ciudad" : idioma === "en" ? "City" : "Cidade"}</Label>
                            <Input
                              id="cidade"
                              value={participante.cidade}
                              onChange={(e) => updateParticipante("cidade", e.target.value)}
                              placeholder={idioma === "es" ? "Ciudad" : idioma === "en" ? "City" : "Cidade"}
                              disabled={loadingCep}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bairro">{idioma === "es" ? "Barrio" : idioma === "en" ? "Neighborhood" : "Bairro"}</Label>
                            <Input
                              id="bairro"
                              value={participante.bairro}
                              onChange={(e) => updateParticipante("bairro", e.target.value)}
                              placeholder={idioma === "es" ? "Barrio" : idioma === "en" ? "Neighborhood" : "Bairro"}
                              disabled={loadingCep}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endereco">{idioma === "es" ? "Dirección" : idioma === "en" ? "Address" : "Endereço"}</Label>
                          <Input
                            id="endereco"
                            value={participante.endereco}
                            onChange={(e) => updateParticipante("endereco", e.target.value)}
                            placeholder="Rua, Avenida..."
                            disabled={loadingCep}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Endereço para outros países */}
                        <div className="space-y-2">
                          <Label htmlFor="endereco">{idioma === "es" ? "Dirección" : idioma === "en" ? "Address" : "Endereço"} *</Label>
                          <Input
                            id="endereco"
                            value={participante.endereco}
                            onChange={(e) => updateParticipante("endereco", e.target.value)}
                            placeholder={participante.paisResidencia === "argentina" ? "Calle, Avenida..." : idioma === "en" ? "Street, Avenue..." : "Rua, Avenida..."}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cidade">{idioma === "es" ? "Ciudad" : idioma === "en" ? "City" : "Cidade"} *</Label>
                            <Input
                              id="cidade"
                              value={participante.cidade}
                              onChange={(e) => updateParticipante("cidade", e.target.value)}
                              placeholder={idioma === "es" ? "Ciudad" : idioma === "en" ? "City" : "Cidade"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estado">{participante.paisResidencia === "argentina" ? "Provincia" : idioma === "es" ? "Estado/Provincia" : idioma === "en" ? "State/Province" : "Estado"}</Label>
                            <Input
                              id="estado"
                              value={participante.estado}
                              onChange={(e) => updateParticipante("estado", e.target.value)}
                              placeholder={participante.paisResidencia === "argentina" ? "Provincia" : idioma === "en" ? "State/Province" : "Estado"}
                            />
                          </div>
                        </div>

                        {/* Código Postal para Argentina */}
                        {participante.paisResidencia === "argentina" && (
                          <div className="space-y-2">
                            <Label htmlFor="cep">Código Postal</Label>
                            <Input
                              id="cep"
                              value={participante.cep}
                              onChange={(e) => updateParticipante("cep", e.target.value)}
                              placeholder="Ej: C1425"
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numero">{idioma === "es" ? "Número" : idioma === "en" ? "Number" : "Número"} *</Label>
                        <Input
                          id="numero"
                          value={participante.numero}
                          onChange={(e) => updateParticipante("numero", e.target.value)}
                          placeholder="Nº"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complemento">{idioma === "es" ? "Depto/Piso" : idioma === "en" ? "Apt/Suite" : "Complemento"}</Label>
                        <Input
                          id="complemento"
                          value={participante.complemento}
                          onChange={(e) => updateParticipante("complemento", e.target.value)}
                          placeholder={idioma === "es" ? "Depto, Piso..." : idioma === "en" ? "Apt, Suite..." : "Apto, Bloco..."}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: CPF/Documento e Pagamento */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {/* CPF já foi preenchido no Step 1, apenas mostrar se não foi preenchido */}
                    {!participante.cpf && (
                      <div className="space-y-2">
                        <Label htmlFor="cpf-step3">
                          {participante.paisResidencia === "brasil" 
                            ? "CPF" 
                            : participante.paisResidencia === "argentina"
                            ? "DNI"
                            : idioma === "es" ? "Documento" : idioma === "en" ? "ID Document" : "Documento"} *
                        </Label>
                        <Input
                          id="cpf-step3"
                          value={participante.cpf}
                          onChange={(e) => updateParticipante("cpf", participante.paisResidencia === "brasil" ? formatCPF(e.target.value) : e.target.value)}
                          placeholder={
                            participante.paisResidencia === "brasil" 
                              ? "000.000.000-00" 
                              : participante.paisResidencia === "argentina"
                              ? "12.345.678"
                              : idioma === "es" ? "Número de documento" : "Document number"
                          }
                        />
                      </div>
                    )}

                    {/* Opção de salvar perfil para participantes adicionais (2+) */}
                    {participantes.length > 1 && currentParticipante > 0 && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`salvar-perfil-${currentParticipante}`}
                            checked={salvarPerfil[currentParticipante] || false}
                            onCheckedChange={(checked) => {
                              setSalvarPerfil({ ...salvarPerfil, [currentParticipante]: checked === true })
                              if (checked) {
                                salvarPerfilParticipante(currentParticipante)
                              }
                            }}
                          />
                          <Label htmlFor={`salvar-perfil-${currentParticipante}`} className="text-sm font-medium cursor-pointer">
                            Salvar este perfil para usar em inscrições futuras?
                          </Label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          {usuarioLogado 
                            ? "Os dados deste participante serão salvos no seu perfil para facilitar próximas inscrições"
                            : "Os dados serão salvos no perfil do participante principal para facilitar próximas inscrições"}
                        </p>
                      </div>
                    )}

                    {/* Tamanho da Camiseta (se houver kit com camiseta) */}
                    {temCamiseta && ingresso?.kitItems?.includes("camiseta") && (
                      <div className="space-y-2">
                        <Label>{t("tamanhoCamiseta")} *</Label>
                        <div className="flex flex-wrap gap-2">
                          {(ingresso.shirtSizes?.length > 0 ? ingresso.shirtSizes : TAMANHOS_CAMISETA).map((tamanho: string) => (
                            <Button
                              key={tamanho}
                              type="button"
                              variant={participante.tamanhoCamiseta === tamanho ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateParticipante("tamanhoCamiseta", tamanho)}
                              className={participante.tamanhoCamiseta === tamanho ? "bg-[#156634]" : ""}
                            >
                              {tamanho}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meios de Pagamento (se não for gratuito) */}
                    {!isGratuito() && (
                      <div className="space-y-4">
                        <Label>{t("formaPagamento")} *</Label>
                        <RadioGroup
                          value={meioPagamento}
                          onValueChange={setMeioPagamento}
                          className="space-y-3"
                        >
                          <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${meioPagamento === "pix" ? "border-[#156634] bg-green-50" : ""}`}>
                            <RadioGroupItem value="pix" id="pix" />
                            <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                              <QrCode className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{t("pix")}</p>
                                <p className="text-xs text-muted-foreground">{t("pagamentoInstantaneo")}</p>
                              </div>
                            </Label>
                          </div>
                          <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${meioPagamento === "cartao" ? "border-[#156634] bg-green-50" : ""}`}>
                            <RadioGroupItem value="cartao" id="cartao" />
                            <Label htmlFor="cartao" className="flex items-center gap-3 cursor-pointer flex-1">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{t("cartaoCredito")}</p>
                                <p className="text-xs text-muted-foreground">{t("parceleAte")}</p>
                              </div>
                            </Label>
                          </div>
                          <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${meioPagamento === "boleto" ? "border-[#156634] bg-green-50" : ""}`}>
                            <RadioGroupItem value="boleto" id="boleto" />
                            <Label htmlFor="boleto" className="flex items-center gap-3 cursor-pointer flex-1">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <div>
                                <p className="font-medium">{t("boleto")}</p>
                                <p className="text-xs text-muted-foreground">{t("vencimento")}</p>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Termo de Responsabilidade */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`aceite-${currentParticipante}`}
                        checked={participante.aceiteTermo}
                        onCheckedChange={(checked) => {
                          const novosParticipantes = [...participantes]
                          novosParticipantes[currentParticipante] = {
                            ...novosParticipantes[currentParticipante],
                            aceiteTermo: checked === true,
                          }
                          setParticipantes(novosParticipantes)
                        }}
                      />
                      <Label 
                        htmlFor={`aceite-${currentParticipante}`} 
                        className="text-sm cursor-pointer"
                      >
                        {t("liAceito")} *
                      </Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="text-gray-400 hover:text-gray-600">
                            <Info className="h-4 w-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("termoResponsabilidade")}</DialogTitle>
                          </DialogHeader>
                          <div className="text-sm text-gray-600 space-y-3">
                            <p>
                              {idioma === "es" 
                                ? "Declaro estar consciente de que la práctica deportiva implica riesgos inherentes a la actividad física."
                                : idioma === "en"
                                ? "I declare that I am aware that sports practice involves risks inherent to physical activity."
                                : "Declaro que estou ciente de que a prática esportiva envolve riscos inerentes à atividade física."}
                            </p>
                            <p>
                              {idioma === "es"
                                ? "Certifico estar en plenas condiciones de salud para participar en este evento, habiendo realizado exámenes médicos y obtenido autorización para la práctica deportiva."
                                : idioma === "en"
                                ? "I certify that I am in full health condition to participate in this event, having undergone medical examinations and obtained clearance for sports practice."
                                : "Atesto estar em plenas condições de saúde para participar deste evento, tendo realizado exames médicos e obtido liberação para a prática esportiva."}
                            </p>
                            <p>
                              {idioma === "es"
                                ? "Eximo a los organizadores de cualquier responsabilidad por accidentes o problemas de salud derivados de mi participación."
                                : idioma === "en"
                                ? "I exempt the organizers from any liability for accidents or health problems arising from my participation."
                                : "Isento os organizadores de quaisquer responsabilidades por acidentes ou problemas de saúde decorrentes da minha participação."}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}

                {/* Botões de navegação */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1 && currentParticipante === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {t("voltar")}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={submitting}
                    className="bg-[#156634] hover:bg-[#1a7a3e]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {idioma === "es" ? "Procesando..." : idioma === "en" ? "Processing..." : "Processando..."}
                      </>
                    ) : currentStep === 3 && currentParticipante === participantes.length - 1 ? (
                      isGratuito() ? t("finalizarInscricao") : t("finalizarPagar")
                    ) : (
                      <>
                        {t("continuar")}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 min-h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{t("resumoInscricao")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{eventData?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {eventData?.event_date && (() => {
                      const [year, month, day] = eventData.event_date.split('-').map(Number)
                      const date = new Date(year, month - 1, day)
                      return date.toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-AR" : "pt-BR")
                    })()}
                  </p>
                  {eventData?.location && (
                    <p className="text-sm text-muted-foreground">
                      {eventData.location}
                    </p>
                  )}
                  {ingresso && (
                    <p className="text-xs text-[#156634] font-semibold">
                      {t("categoria")}: {ingresso.categoria}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3 flex-1">
                  {runningClub && runningClub.base_discount > 0 && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-xs font-semibold text-green-700">
                        🏃 {idioma === "es" ? "Descuento de Clube de Corrida aplicado" : idioma === "en" ? "Running Club discount applied" : "Desconto de Clube de Corrida aplicado"}
                      </p>
                      <p className="text-xs text-green-600">
                        {runningClub.name || "Clube de Corrida"} - {runningClub.base_discount}%
                        {runningClub.progressive_discount_threshold && ingressosSelecionados.length >= runningClub.progressive_discount_threshold
                          ? ` + ${runningClub.progressive_discount_value}%`
                          : ""}
                      </p>
                    </div>
                  )}
                  {ingressosSelecionados.map((ing, i) => {
                    const participanteResumo = participantes[i] || participantes[0]
                    // Calcular valor com desconto para exibição
                    let valorExibicao = ing.valor
                    if (runningClub && runningClub.base_discount > 0) {
                      let descontoIngresso = (ing.valor * runningClub.base_discount) / 100
                      if (runningClub.progressive_discount_threshold && 
                          runningClub.progressive_discount_value &&
                          ingressosSelecionados.length >= runningClub.progressive_discount_threshold) {
                        descontoIngresso += (ing.valor * runningClub.progressive_discount_value) / 100
                      }
                      valorExibicao = Math.max(0, ing.valor - descontoIngresso)
                    }
                    return (
                      <div key={i} className="border rounded-md p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between font-medium">
                          <span>{ing.categoria}</span>
                          <div className="text-right">
                            {ing.valor !== valorExibicao && (
                              <span className="text-xs text-muted-foreground line-through mr-1">
                                {isBrasil ? "R$" : "$"} {ing.valor.toFixed(2)}
                              </span>
                            )}
                            <span className={ing.valor !== valorExibicao ? "text-green-600" : ""}>
                              {ing.valor === 0 || ing.gratuito ? (isBrasil ? "R$ 0,00" : "$ 0.00") : `${isBrasil ? "R$" : "$"} ${valorExibicao.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("participante")}:{" "}
                          <span className="text-foreground">{participanteResumo?.nome || t("participante")}</span>
                        </p>
                        {participanteResumo?.tamanhoCamiseta && (
                          <p className="text-xs text-muted-foreground">
                            {t("tamanhoCamiseta")}:{" "}
                            <span className="text-foreground">{participanteResumo.tamanhoCamiseta}</span>
                          </p>
                        )}
                        {ing.possuiKit && ing.itensKit?.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Kit: <span className="text-foreground">{ing.itensKit.join(", ")}</span>
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("subtotal")}</span>
                    <span>{isBrasil ? "R$" : "$"} {subtotal.toFixed(2)}</span>
                  </div>
                  {desconto > 0 && runningClub && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-muted-foreground">
                        {idioma === "es" ? "Descuento" : idioma === "en" ? "Discount" : "Desconto"}
                        {runningClub.progressive_discount_threshold && ingressosSelecionados.length >= runningClub.progressive_discount_threshold
                          ? ` (${runningClub.base_discount}% + ${runningClub.progressive_discount_value}%)`
                          : ` (${runningClub.base_discount}%)`}
                      </span>
                      <span className="font-semibold">-{isBrasil ? "R$" : "$"} {desconto.toFixed(2)}</span>
                    </div>
                  )}
                  {!isGratuito() && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("taxaServico")}</span>
                      <span>{isBrasil ? "R$" : "$"} {taxa.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold">
                  <span>{t("total")}</span>
                  <span className="text-[#156634]">
                    {isBrasil ? "R$" : "$"} {total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Rodapé Profissional */}
      <footer className="bg-gray-50/50 border-t border-gray-100 mt-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-10 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Grid Principal - 2 colunas no mobile, 4 no desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-6 lg:gap-8 mb-6 md:mb-8">
              {/* Coluna 1: Logo e Descrição */}
              <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <div>
              <Image
                src="/images/logo/logo.png"
                alt="EveMaster"
                    width={126}
                    height={36}
                    className="h-6 md:h-7 w-auto opacity-80"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs text-center md:text-left">
                  Plataforma para gestão, compra e venda de ingressos para eventos esportivos.
                </p>
            </div>

              {/* Coluna 2: Formas de Pagamento */}
              <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600">
                  {idioma === "es" ? "Medios de Pago Aceptados" : idioma === "en" ? "Accepted Payment Methods" : "Meios de Pagamento Aceitos"}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Image
                    src="/images/ic-payment-visa.svg"
                    alt="Visa"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-master-card.svg"
                    alt="Mastercard"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-elo.svg"
                    alt="Elo"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-american-express.svg"
                    alt="American Express"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-hipercard.svg"
                    alt="Hipercard"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-pix.svg"
                    alt="Pix"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-boleto.svg"
                    alt="Boleto"
                    width={40}
                    height={25}
                    className="h-5 md:h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center md:text-left">
                  <span className="text-[#156634]">Parcelamento em até 12x</span> no cartão
                </p>
              </div>

              {/* Coluna 3: Links Legais */}
              <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start md:ml-[20%]">
                <h3 className="text-xs font-medium text-gray-600">
                  Legal
                </h3>
                <div className="flex flex-col gap-1.5">
                  <Link 
                    href="/termos-de-uso" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                  >
                    {idioma === "es" ? "Términos de Uso" : idioma === "en" ? "Terms of Use" : "Termos de Uso"}
              </Link>
                  <Link 
                    href="/politica-de-privacidade" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                  >
                    {idioma === "es" ? "Política de Privacidad" : idioma === "en" ? "Privacy Policy" : "Política de Privacidade"}
              </Link>
                </div>
              </div>

              {/* Coluna 4: Idioma */}
              <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600 hidden md:block">
                  Idioma
                </h3>
                <Select value={idioma} onValueChange={(val: "pt" | "es" | "en") => setIdioma(val)}>
                  <SelectTrigger className="w-full max-w-[140px] md:w-[140px] bg-white border-gray-200 text-gray-600 text-xs h-8 md:h-9">
                    <SelectValue asChild>
                      <span className="flex items-center">
                        <span className="text-sm">{idioma === "pt" ? "🇧🇷" : idioma === "es" ? "🇦🇷" : "🇺🇸"}</span>
                        <span className="text-xs hidden sm:inline ml-[5px]">{idioma === "pt" ? "Português" : idioma === "es" ? "Español" : "English"}</span>
                        <span className="text-xs sm:hidden ml-[5px]">{idioma === "pt" ? "PT" : idioma === "es" ? "ES" : "EN"}</span>
                      </span>
                    </SelectValue>
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

            {/* Separador */}
            <Separator className="my-6 opacity-30" />

            {/* Rodapé Inferior: CNPJ e Copyright */}
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-400 text-center">
              <p>
                © {new Date().getFullYear()} Evemaster. Todos os direitos reservados.
                </p>
              <p>
                Um software do grupo Fullsale Ltda - CNPJ: 41.953.551/0001-57
                </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Popup elaborado: Deseja incluir mais participantes? */}
      <Dialog open={mostrarPopupIncluirParticipantes} onOpenChange={setMostrarPopupIncluirParticipantes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center mb-2">Deseja incluir mais participantes?</DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Você pode adicionar participantes adicionais à sua inscrição
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantos participantes adicionais?</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantidadeParticipantesAdicionais(Math.max(1, quantidadeParticipantesAdicionais - 1))}
                  disabled={quantidadeParticipantesAdicionais <= 1}
                >
                  -
                </Button>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  max="10"
                  value={quantidadeParticipantesAdicionais}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setQuantidadeParticipantesAdicionais(Math.max(1, Math.min(10, val)))
                  }}
                  className="text-center w-20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantidadeParticipantesAdicionais(Math.min(10, quantidadeParticipantesAdicionais + 1))}
                  disabled={quantidadeParticipantesAdicionais >= 10}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarPopupIncluirParticipantes(false)
                  handleSubmit()
                }}
                className="flex-1"
              >
                Não, finalizar apenas eu
              </Button>
              <Button
                onClick={confirmarIncluirParticipantes}
                className="flex-1 bg-[#156634] hover:bg-[#1a7a3e]"
              >
                Sim, incluir {quantidadeParticipantesAdicionais} participante{quantidadeParticipantesAdicionais > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de busca de participantes salvos OU inserir novo */}
      <Dialog open={mostrarBuscaParticipantes} onOpenChange={setMostrarBuscaParticipantes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {participanteAtualEmEdicao !== null 
                ? `Participante ${participanteAtualEmEdicao + 1} de ${participantes.length}`
                : 'Selecione ou crie um participante'}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              {usuarioLogado && perfisSalvos.length > 0
                ? 'Busque um participante salvo ou crie um novo'
                : 'Preencha os dados do participante'}
            </p>
          </DialogHeader>
          
          {usuarioLogado && perfisSalvos.length > 0 && (
            <div className="space-y-4 mt-4">
              {/* Campo de busca */}
              <div className="space-y-2">
                <Label htmlFor="buscaParticipante">Buscar participante por nome, email ou CPF</Label>
                <Input
                  id="buscaParticipante"
                  placeholder="Digite para buscar..."
                  value={termoBuscaParticipante}
                  onChange={(e) => setTermoBuscaParticipante(e.target.value)}
                />
              </div>

              {/* Lista de perfis filtrados */}
              {perfisFiltrados.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {perfisFiltrados.map((perfil) => (
                    <Card key={perfil.id} className="border cursor-pointer hover:border-[#156634] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{perfil.full_name}</p>
                            <p className="text-sm text-gray-600">{perfil.email}</p>
                            {perfil.cpf && (
                              <p className="text-xs text-gray-500">
                                CPF: {perfil.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => selecionarParticipanteSalvo(perfil)}
                            className="bg-[#156634] hover:bg-[#1a7a3e]"
                          >
                            Usar este
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : termoBuscaParticipante ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum participante encontrado com "{termoBuscaParticipante}"
                </p>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Digite para buscar participantes salvos
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={criarNovoParticipante}
              className="flex-1"
            >
              {usuarioLogado && perfisSalvos.length > 0 
                ? "Criar novo participante" 
                : "Preencher dados manualmente"}
            </Button>
            {participanteAtualEmEdicao !== null && participanteAtualEmEdicao < participantes.length - 1 && (
              <Button
                variant="outline"
                onClick={continuarParaProximoParticipante}
              >
                Pular este
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
