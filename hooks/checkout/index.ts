"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getEventById } from "@/lib/supabase/events"
import { ParticipantFormData, defaultParticipant, normalizarPais } from "@/lib/schemas/checkout"
import { IngressoSelecionado, RunningClubData } from "./types"
import { useCheckoutCep } from "./useCheckoutCep"
import { useCheckoutCpf } from "./useCheckoutCpf"
import { useCheckoutProfiles } from "./useCheckoutProfiles"
import { useCheckoutCalculations } from "./useCheckoutCalculations"
import { useCheckoutValidation } from "./useCheckoutValidation"
import { useCheckoutSubmit } from "./useCheckoutSubmit"

// Re-export types
export * from "./types"

export function useCheckout() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = params.eventId as string

  // Core state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [ingressosSelecionados, setIngressosSelecionados] = useState<IngressoSelecionado[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [currentParticipante, setCurrentParticipante] = useState(0)
  const [participantes, setParticipantes] = useState<ParticipantFormData[]>([])
  const [meioPagamento, setMeioPagamento] = useState("")
  const [temKit, setTemKit] = useState(false)
  const [temCamiseta, setTemCamiseta] = useState(false)
  const [paisEvento, setPaisEvento] = useState("brasil")
  const [idioma, setIdioma] = useState("pt")
  const [runningClub, setRunningClub] = useState<RunningClubData | null>(null)
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [salvarPerfil, setSalvarPerfil] = useState<{ [key: number]: boolean }>({})
  const [permiteEdicao, setPermiteEdicao] = useState(false)
  const [quantidadeIngressosInicial, setQuantidadeIngressosInicial] = useState<number>(0)

  const totalSteps = 3
  const participante = participantes[currentParticipante] || defaultParticipant

  // Sub-hooks
  const { loadingCep, buscarCep } = useCheckoutCep()
  const { 
    showCpfLogin, cpfVerificado, cpfUserData, verificandoCpf,
    verificarCpfCadastrado, handleCpfLoginSuccess, handleCloseCpfLogin 
  } = useCheckoutCpf()
  const {
    perfisSalvos, perfisFiltrados, termoBuscaParticipante, setTermoBuscaParticipante,
    participanteAtualEmEdicao, setParticipanteAtualEmEdicao,
    mostrarBuscaParticipantes, setMostrarBuscaParticipantes,
    mostrarPopupIncluirParticipantes, setMostrarPopupIncluirParticipantes,
    perfisSelecionadosPopup, setPerfisSelecionadosPopup,
    buscarPerfisSalvos, selecionarParticipanteSalvo
  } = useCheckoutProfiles(paisEvento)
  const { calcularTotal, isGratuito } = useCheckoutCalculations()
  const { validarStep, t } = useCheckoutValidation(idioma)
  const { handleSubmit: submitCheckout } = useCheckoutSubmit()

  // Load event data
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return
      
      setLoading(true)
      try {
        const supabase = createClient()
        
        // Check logged in user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUsuarioLogado(user)
        
        // Fetch event
        const event = await getEventById(eventId)
        if (!event) {
          toast.error("Evento não encontrado")
          router.push("/")
          return
        }

        setEventData(event)
        const pais = normalizarPais(event.country)
        setPaisEvento(pais)
        setIdioma(event.language || "pt")

        // Check running club
        const clubId = searchParams.get("club")
        if (clubId) {
          const { data: clubData, error: clubError } = await supabase
            .from("running_clubs")
            .select("*")
            .eq("id", clubId)
            .single()

          if (!clubError && clubData) {
            const ticketsRemaining = clubData.tickets_allocated - (clubData.tickets_used || 0)
            if (ticketsRemaining > 0) {
              if (clubData.deadline) {
                const deadline = new Date(clubData.deadline)
                if (new Date() <= deadline) setRunningClub(clubData)
              } else {
                setRunningClub(clubData)
              }
            }
          }
        }

        // Parse tickets from URL
        const loteId = searchParams.get("lote")
        const ingressosParam = searchParams.get("ingressos")
        
        if (!ingressosParam || !loteId) {
          toast.error("Selecione os ingressos primeiro")
          router.push(`/evento/${eventId}`)
          return
        }

        let ingressosObj: Record<string, number>
        try {
          ingressosObj = JSON.parse(decodeURIComponent(ingressosParam))
        } catch {
          toast.error("Erro nos dados dos ingressos")
          router.push(`/evento/${eventId}`)
          return
        }
        
        const lote = event.ticket_batches?.find((b: any) => b.id === loteId)
        if (!lote) {
          toast.error("Lote não encontrado")
          router.push(`/evento/${eventId}`)
          return
        }

        // Build ticket list
        const listaIngressos: IngressoSelecionado[] = []
        let verificarKit = false
        let verificarCamiseta = false

        Object.entries(ingressosObj).forEach(([categoria, quantidade]) => {
          const ticket = lote.tickets?.find((t: any) => t.category === categoria)
          if (ticket && Number(quantidade) > 0) {
            for (let i = 0; i < Number(quantidade); i++) {
              listaIngressos.push({
                id: ticket.id,
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
        setQuantidadeIngressosInicial(listaIngressos.length)
        setParticipantes(listaIngressos.map(() => ({ ...defaultParticipant, paisResidencia: pais })))
        
      } catch (error: any) {
        console.error("Erro ao carregar checkout:", error)
        toast.error("Erro ao carregar dados do checkout")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId, searchParams, router])

  // Update participant field
  const updateParticipante = useCallback((field: keyof ParticipantFormData, value: any) => {
    setParticipantes(prev => {
      const novos = [...prev]
      novos[currentParticipante] = { ...novos[currentParticipante], [field]: value }
      return novos
    })
  }, [currentParticipante])

  // Navigation
  const handleNext = useCallback(async () => {
    const gratuito = isGratuito(ingressosSelecionados)
    if (!validarStep(participante, currentStep, temCamiseta, gratuito, meioPagamento)) return
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      if (currentParticipante < participantes.length - 1) {
        setCurrentParticipante(currentParticipante + 1)
        setCurrentStep(1)
      } else if (currentParticipante === 0 && quantidadeIngressosInicial === 1) {
        if (usuarioLogado) {
          await buscarPerfisSalvos(usuarioLogado)
          if (perfisSalvos.length > 0) {
            setMostrarPopupIncluirParticipantes(true)
          } else {
            handleSubmit()
          }
        } else {
          handleSubmit()
        }
      } else {
        handleSubmit()
      }
    }
  }, [validarStep, participante, currentStep, totalSteps, temCamiseta, meioPagamento, 
      currentParticipante, participantes.length, quantidadeIngressosInicial, usuarioLogado,
      buscarPerfisSalvos, perfisSalvos.length, ingressosSelecionados, isGratuito])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else if (currentParticipante > 0) {
      setCurrentParticipante(currentParticipante - 1)
      setCurrentStep(3)
    }
  }, [currentStep, currentParticipante])

  // Submit wrapper
  const handleSubmit = useCallback(async () => {
    const gratuito = isGratuito(ingressosSelecionados)
    await submitCheckout(
      eventId,
      eventData,
      participantes,
      ingressosSelecionados,
      paisEvento,
      gratuito,
      meioPagamento,
      runningClub,
      () => calcularTotal(ingressosSelecionados, runningClub),
      setSubmitting
    )
  }, [submitCheckout, eventId, eventData, participantes, ingressosSelecionados, 
      paisEvento, meioPagamento, runningClub, calcularTotal, isGratuito])

  return {
    // State
    loading,
    submitting,
    loadingCep,
    eventData,
    eventId,
    ingressosSelecionados,
    currentStep,
    currentParticipante,
    participantes,
    participante,
    meioPagamento,
    temKit,
    temCamiseta,
    paisEvento,
    idioma,
    runningClub,
    usuarioLogado,
    perfisSalvos,
    perfisFiltrados,
    showCpfLogin,
    cpfVerificado,
    cpfUserData,
    verificandoCpf,
    salvarPerfil,
    permiteEdicao,
    mostrarPopupIncluirParticipantes,
    mostrarBuscaParticipantes,
    termoBuscaParticipante,
    participanteAtualEmEdicao,
    quantidadeIngressosInicial,
    perfisSelecionadosPopup,
    totalSteps,
    
    // Setters
    setCurrentStep,
    setCurrentParticipante,
    setMeioPagamento,
    setPermiteEdicao,
    setMostrarPopupIncluirParticipantes,
    setMostrarBuscaParticipantes,
    setTermoBuscaParticipante,
    setParticipanteAtualEmEdicao,
    setPerfisSelecionadosPopup,
    setSalvarPerfil,
    
    // Functions
    t,
    buscarCep: (cep: string, index: number) => buscarCep(cep, index, participantes, setParticipantes),
    updateParticipante,
    verificarCpfCadastrado: (cpf: string) => verificarCpfCadastrado(cpf, participante, usuarioLogado),
    handleCpfLoginSuccess: (userData: any) => handleCpfLoginSuccess(
      userData, currentParticipante, setParticipantes, setUsuarioLogado, 
      () => buscarPerfisSalvos(usuarioLogado)
    ),
    handleCloseCpfLogin: () => handleCloseCpfLogin(participante.cpf),
    buscarPerfisSalvos: () => buscarPerfisSalvos(usuarioLogado),
    calcularTotal: () => calcularTotal(ingressosSelecionados, runningClub),
    isGratuito: () => isGratuito(ingressosSelecionados),
    handleNext,
    handleBack,
    handleSubmit,
    selecionarParticipanteSalvo: (perfil: any) => selecionarParticipanteSalvo(
      perfil, setParticipantes, setCurrentParticipante, setCurrentStep
    ),
  }
}

