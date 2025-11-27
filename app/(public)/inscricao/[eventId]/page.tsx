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
import { Shield, Loader2, ChevronRight, ChevronLeft, Check, CreditCard, QrCode, FileText, User, MapPin, Wallet, Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getEventById } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
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
        if (pais === "argentina") {
          setIdioma("es")
        } else if (pais !== "brasil") {
          setIdioma("en")
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
    const subtotal = ingressosSelecionados.reduce((sum, ing) => sum + ing.valor, 0)
    const taxa = subtotal > 0 ? ingressosSelecionados.length * 5 : 0
    return { subtotal, taxa, total: subtotal + taxa }
  }

  // Verificar se é gratuito
  const isGratuito = () => {
    return ingressosSelecionados.every(ing => ing.gratuito)
  }

  // Validar step atual
  const validarStep = () => {
    const p = participantes[currentParticipante]
    
    if (currentStep === 1) {
      if (!p.nome || !p.email || !p.telefone || !p.idade || !p.genero) {
        toast.error("Preencha todos os campos obrigatórios")
        return false
      }
      if (!p.email.includes("@")) {
        toast.error("Email inválido")
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
  const handleNext = () => {
    if (!validarStep()) return
    
    const totalSteps = isGratuito() ? 3 : 3
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else if (currentParticipante < participantes.length - 1) {
      // Próximo participante
      setCurrentParticipante(currentParticipante + 1)
      setCurrentStep(1)
    } else {
      // Finalizar
      handleSubmit()
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

      // Para cada participante, criar registro
      for (let i = 0; i < participantes.length; i++) {
        const p = participantes[i]
        const ingresso = ingressosSelecionados[i]

        // Gerar número de inscrição
        const registrationNumber = `EVE-${Date.now().toString(36).toUpperCase()}-${i + 1}`

        console.log("Criando inscrição para:", p.nome)

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

        if (!ticketData || ticketData.quantity <= 0) {
          toast.error("Ingresso esgotado. Selecione outro ticket.")
          throw new Error("Ticket esgotado")
        }

        // 1. Criar inscrição primeiro (sem athlete_id/buyer_id - são para usuários logados)
        const now = new Date()
        const insertData = {
          event_id: eventId,
          ticket_id: ingresso.id,
          registration_number: registrationNumber,
          registration_date: now.toISOString().split('T')[0],
          registration_time: now.toTimeString().split(' ')[0],
          status: isGratuito() ? "confirmed" : "pending",
          shirt_size: p.tamanhoCamiseta || null,
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
          // Não bloqueia, atleta é informação adicional
        }

        // 3. Se não for gratuito, criar pagamento
        if (!isGratuito()) {
          const paymentData = {
            registration_id: registration.id,
            amount: ingresso.valor + 5,
            payment_method: meioPagamento || "pix",
            payment_status: "pending",
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
      }

      console.log("=== INSCRIÇÃO CONCLUÍDA COM SUCESSO ===")
      toast.success("Inscrição realizada com sucesso!")

      // Sinalizar que o evento foi atualizado para recarregar dados
      localStorage.setItem(`event_updated_${eventId}`, 'true')

      // Enviar emails de confirmação (em background)
      try {
        await fetch('/api/email/confirmacao-inscricao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inscricoes: participantes.map((p, i) => ({
              email: p.email,
              nome: p.nome,
              categoria: ingressosSelecionados[i].categoria,
              valor: ingressosSelecionados[i].valor,
              gratuito: ingressosSelecionados[i].gratuito,
              codigoInscricao: `EVE-${Date.now().toString(36).toUpperCase()}-${i + 1}`,
            })),
            evento: {
              nome: eventData.name,
              data: eventData.event_date ? new Date(eventData.event_date).toLocaleDateString('pt-BR') : '',
              local: eventData.location || eventData.address || '',
            },
          }),
        })
      } catch (emailError) {
        console.error('Erro ao enviar emails:', emailError)
        // Não bloquear o fluxo se o email falhar
      }
      
      // Redirecionar para página de obrigado
      const { subtotal, taxa, total } = calcularTotal()
      const resumoParam = encodeURIComponent(JSON.stringify({
        evento: eventData.name,
        eventoData: eventData.event_date ? new Date(eventData.event_date).toLocaleDateString('pt-BR') : '',
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
  const { subtotal, taxa, total } = calcularTotal()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#156634] text-white py-3 px-4 md:py-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image
            src="/images/logo/logo.png"
            alt="Logo EveMaster"
            width={120}
            height={32}
            className="h-5 md:h-8 w-auto"
            priority
          />
          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Shield className="h-4 w-4 md:h-5 md:w-5" />
            <span>{t("pagamentoSeguro")}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1">
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
                    <div className="space-y-2">
                      <Label htmlFor="nome">{t("nomeCompleto")} *</Label>
                      <Input
                        id="nome"
                        value={participante.nome}
                        onChange={(e) => updateParticipante("nome", e.target.value)}
                        placeholder={t("nomeCompleto")}
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
                        <Label htmlFor="idade">{t("idade")} *</Label>
                        <Input
                          id="idade"
                          type="number"
                          min="1"
                          max="120"
                          value={participante.idade}
                          onChange={(e) => updateParticipante("idade", e.target.value)}
                          placeholder="Ex: 30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("genero")} *</Label>
                        <Select
                          value={participante.genero}
                          onValueChange={(value) => updateParticipante("genero", value)}
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
                    <div className="space-y-2">
                      <Label htmlFor="cpf">
                        {participante.paisResidencia === "brasil" 
                          ? "CPF" 
                          : participante.paisResidencia === "argentina"
                          ? "DNI"
                          : idioma === "es" ? "Documento" : idioma === "en" ? "ID Document" : "Documento"} *
                      </Label>
                      <Input
                        id="cpf"
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
                    {eventData?.event_date && new Date(eventData.event_date).toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-AR" : "pt-BR")}
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
                  {ingressosSelecionados.map((ing, i) => {
                    const participanteResumo = participantes[i] || participantes[0]
                    return (
                      <div key={i} className="border rounded-md p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between font-medium">
                          <span>{ing.categoria}</span>
                          <span>{ing.valor === 0 || ing.gratuito ? (isBrasil ? "R$ 0,00" : "$ 0.00") : `${isBrasil ? "R$" : "$"} ${ing.valor.toFixed(2)}`}</span>
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

      {/* Rodapé */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="opacity-20">
              <Image
                src="/images/logo/logo.png"
                alt="EveMaster"
                width={120}
                height={35}
                className="h-8 w-auto"
              />
            </div>

            {/* Seletor de Idioma */}
            <Select value={idioma} onValueChange={setIdioma}>
              <SelectTrigger className="w-[150px] bg-white border-gray-200 text-gray-600 text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">
                  <span className="flex items-center gap-2">
                    <span>🇧🇷</span>
                    <span>Português</span>
                  </span>
                </SelectItem>
                <SelectItem value="es">
                  <span className="flex items-center gap-2">
                    <span>🇦🇷</span>
                    <span>Español</span>
                  </span>
                </SelectItem>
                <SelectItem value="en">
                  <span className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    <span>English</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Links */}
            <div className="flex items-center gap-3 text-sm">
              <Link href="/termos-de-uso" className="text-muted-foreground hover:text-[#156634] transition-colors">
                {idioma === "es" ? "Términos de Uso" : idioma === "en" ? "Terms of Use" : "Termos de Uso"}
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/politica-de-privacidade" className="text-muted-foreground hover:text-[#156634] transition-colors">
                {idioma === "es" ? "Política de Privacidad" : idioma === "en" ? "Privacy Policy" : "Política de Privacidade"}
              </Link>
            </div>

            {/* Formas de Pagamento */}
            <p className="text-sm text-muted-foreground text-center">
              {footerPaymentText[idioma]}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
