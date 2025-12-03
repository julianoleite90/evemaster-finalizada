"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { checkoutLogger as logger } from "@/lib/utils/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Shield, Loader2, ChevronRight, ChevronLeft, Check, CreditCard, QrCode, FileText, User, Users, MapPin, Wallet, Info, CheckCircle2, Edit2, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getEventById } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
import EventPixels from "@/components/analytics/EventPixels"
import { CPFLoginInline } from "@/components/auth/CPFLoginInline"
import { CheckoutErrorBoundary } from "@/components/error/CheckoutErrorBoundary"
import Link from "next/link"
import Image from "next/image"
import { OrderSummary, StepIndicator, CheckoutFooter, Step1PersonalData, Step2Address, Step3PaymentAndTerms } from "./components"
import { 
  Participante, 
  participanteVazio, 
  TAMANHOS_CAMISETA, 
  PAISES, 
  normalizarPais,
  Idioma,
  traducoes,
  createTranslator
} from "./types"
import {
  useCheckoutLoading,
  useCheckoutNavigation,
  useCheckoutConfig,
  useCheckoutUI
} from "./hooks"
import {
  formatCPF,
  formatDNI,
  formatDocumento,
  formatTelefone,
  formatCEP,
  mascararEmail,
  calcularTotalPedido,
  isEventoGratuito,
  validarDocumento,
  validarEmail
} from "./utils"

// Componente interno que usa useSearchParams
function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = params.eventId as string

  // Estados de loading (hook)
  const { loading, setLoading, submitting, setSubmitting, loadingCep, setLoadingCep, verificandoCpf, setVerificandoCpf } = useCheckoutLoading()
  
  const [eventData, setEventData] = useState<any>(null)
  const [ingressosSelecionados, setIngressosSelecionados] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [currentParticipante, setCurrentParticipante] = useState(0)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [meioPagamento, setMeioPagamento] = useState("")
  const [temKit, setTemKit] = useState(false)
  const [temCamiseta, setTemCamiseta] = useState(false)
  const [paisEvento, setPaisEvento] = useState("brasil")
  const [idioma, setIdioma] = useState<Idioma>("pt")
  const [runningClub, setRunningClub] = useState<any>(null) // Dados do clube de corrida se houver
  const [affiliateData, setAffiliateData] = useState<{ id: string; commission_type: 'percentage' | 'fixed'; commission_value: number } | null>(null) // Dados do afiliado se houver
  
  // Estados de usuário
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [perfisSalvos, setPerfisSalvos] = useState<any[]>([])
  
  // Estados para login inline por CPF
  const [cpfVerificado, setCpfVerificado] = useState<string | null>(null)
  const [cpfUserData, setCpfUserData] = useState<{ id: string; maskedEmail: string; fullName: string } | null>(null)
  const [salvarPerfil, setSalvarPerfil] = useState<{ [key: number]: boolean }>({})
  
  // Estados de UI (hook)
  const { showCpfLogin, setShowCpfLogin, mostrarSelecaoParticipantes, setMostrarSelecaoParticipantes, mostrarPopupIncluirParticipantes, setMostrarPopupIncluirParticipantes, mostrarBuscaParticipantes, setMostrarBuscaParticipantes, permiteEdicao, setPermiteEdicao } = useCheckoutUI()
  
  // Estados para o fluxo inteligente (parcialmente migrado para hooks)
  const [quantidadeParticipantesAdicionais, setQuantidadeParticipantesAdicionais] = useState(1)
  const [termoBuscaParticipante, setTermoBuscaParticipante] = useState("")
  const [participanteAtualEmEdicao, setParticipanteAtualEmEdicao] = useState<number | null>(null)
  const [quantidadeIngressosInicial, setQuantidadeIngressosInicial] = useState<number>(0)
  const [perfisSelecionadosPopup, setPerfisSelecionadosPopup] = useState<{ perfilId: string, categoriaId: string }[]>([])

  // Tradutor usando traduções centralizadas
  const t = createTranslator(idioma)
  const isBrasil = paisEvento === "brasil"

  // Carregar dados do evento e ingressos
  useEffect(() => {
    const fetchData = async () => {
      // Log inicial para diagnóstico
      logger.log("🔄 [CHECKOUT] Iniciando carregamento do checkout:", {
        eventId,
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        searchParams: {
          lote: searchParams.get("lote"),
          ingressos: searchParams.get("ingressos"),
          club: searchParams.get("club"),
          ref: searchParams.get("ref"),
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        timestamp: new Date().toISOString(),
      })
      
      try {
        setLoading(true)
        const event = await getEventById(eventId)
        
        if (!event) {
          logger.error("❌ [CHECKOUT] Evento não encontrado:", eventId)
          toast.error("Evento não encontrado")
          router.push("/")
          return
        }

        setEventData(event)

        // Definir país do evento e idioma
        const pais = normalizarPais(event.country)
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
              } else {
              }
            } else {
            }
          } else {
          }
        }

        // Verificar se há parâmetro de afiliado (ref)
        const refCode = searchParams.get("ref")
        if (refCode) {
          const supabase = createClient()
          // Buscar afiliado pelo referral_code
          const { data: affiliate, error: affiliateError } = await supabase
            .from("affiliates")
            .select("id, referral_code")
            .eq("referral_code", refCode)
            .maybeSingle()
          
          if (affiliate && !affiliateError) {
            // Buscar comissão configurada para este evento
            const { data: commission, error: commissionError } = await supabase
              .from("event_affiliate_commissions")
              .select("commission_type, commission_value")
              .eq("affiliate_id", affiliate.id)
              .eq("event_id", eventId)
              .maybeSingle()
            
            if (commission && !commissionError) {
              setAffiliateData({
                id: affiliate.id,
                commission_type: commission.commission_type,
                commission_value: commission.commission_value,
              })
              logger.log("🤝 [CHECKOUT] Afiliado identificado:", {
                affiliate_id: affiliate.id,
                refCode,
                commission_type: commission.commission_type,
                commission_value: commission.commission_value,
              })
            }
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

        // Parsear ingressos com tratamento de erro
        let ingressosObj: Record<string, number>
        try {
          ingressosObj = JSON.parse(decodeURIComponent(ingressosParam))
        } catch (parseError) {
          logger.error("❌ [CHECKOUT] Erro ao parsear parâmetro ingressos:", {
            error: parseError,
            ingressosParam,
            decodedParam: decodeURIComponent(ingressosParam || ''),
            url: typeof window !== 'undefined' ? window.location.href : 'N/A'
          })
          toast.error("Erro nos dados dos ingressos. Por favor, selecione novamente.")
          router.push(`/evento/${eventId}`)
          return
        }
        
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
        
        // Salvar quantidade inicial de ingressos
        setQuantidadeIngressosInicial(listaIngressos.length)
        
        // Inicializar participantes com o país do evento (usar o estado já setado)
        setParticipantes(listaIngressos.map(() => ({ 
          ...participanteVazio, 
          paisResidencia: pais 
        })))
        
        logger.log("✅ [CHECKOUT] Dados carregados com sucesso:", {
          eventName: event.name,
          eventId: event.id,
          totalIngressos: listaIngressos.length,
          temKit: verificarKit,
          temCamiseta: verificarCamiseta,
          pais,
          idioma,
        })
        
      } catch (error: any) {
        // Log detalhado para diagnóstico
        logger.error("❌ [CHECKOUT] Erro ao carregar dados do checkout:", {
          error: error?.message || error,
          stack: error?.stack?.substring(0, 500),
          eventId,
          url: typeof window !== 'undefined' ? window.location.href : 'N/A',
          searchParams: {
            lote: searchParams.get("lote"),
            ingressos: searchParams.get("ingressos")?.substring(0, 100),
          },
          timestamp: new Date().toISOString(),
        })
        
        // Enviar erro para o servidor (banco + email)
        try {
          await fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              errorMessage: error?.message || 'Erro ao carregar checkout',
              errorStack: error?.stack,
              errorType: 'registration',
              url: typeof window !== 'undefined' ? window.location.href : null,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
              eventId,
              page: 'checkout-load',
              additionalData: {
                lote: searchParams.get("lote"),
                ingressosParam: searchParams.get("ingressos")?.substring(0, 50),
              },
            }),
          })
        } catch (logError) {
          logger.error('Falha ao logar erro:', logError)
        }
        
        toast.error("Erro ao carregar dados do checkout")
      } finally {
        setLoading(false)
        logger.log("✅ [CHECKOUT] Carregamento finalizado")
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
      logger.error("Erro ao buscar CEP:", error)
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

  // Formatar CPF (Brasil)
  // Verificar se CPF já tem conta cadastrada
  const verificarCpfCadastrado = async (cpf: string) => {
    const participante = participantes[currentParticipante]
    const cleanCPF = cpf.replace(/\D/g, '')
    
    logger.log('🔍 [CPF Check] Verificando CPF:', {
      cpfOriginal: cpf,
      cleanCPF,
      paisResidencia: participante.paisResidencia,
      usuarioLogado: !!usuarioLogado,
      cpfVerificado,
      cleanCPFLength: cleanCPF.length
    })
    
    // Só verificar se for brasileiro e CPF completo
    // Aceitar "brasil" ou vazio/undefined (padrão é Brasil)
    if (participante.paisResidencia && participante.paisResidencia !== "brasil") {
      logger.log('🔍 [CPF Check] Ignorando - país não é Brasil:', participante.paisResidencia)
      return
    }
    
    if (cleanCPF.length !== 11) {
      logger.log('🔍 [CPF Check] Ignorando - CPF incompleto:', cleanCPF.length, 'dígitos')
      return
    }
    
    // Não verificar se já está logado ou se já verificamos este CPF
    if (usuarioLogado) {
      logger.log('🔍 [CPF Check] Ignorando - usuário já logado')
      return
    }
    
    if (cpfVerificado === cleanCPF) {
      logger.log('🔍 [CPF Check] Ignorando - CPF já verificado anteriormente')
      return
    }
    
    try {
      setVerificandoCpf(true)
      logger.log('🔍 [CPF Check] Chamando API...')
      
      const response = await fetch('/api/auth/verificar-cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cleanCPF }),
      })
      
      const data = await response.json()
      logger.log('🔍 [CPF Check] Resposta da API:', data)
      
      if (response.ok && data.exists && data.userData) {
        // CPF encontrado - mostrar bloco inline
        logger.log('✅ [CPF Check] CPF encontrado! Mostrando opção de login...')
        setCpfVerificado(cleanCPF)
        setCpfUserData(data.userData)
        setShowCpfLogin(true)
      } else {
        logger.log('ℹ️ [CPF Check] CPF não encontrado no sistema')
        setShowCpfLogin(false)
      }
    } catch (error) {
      logger.error('❌ [CPF Check] Erro ao verificar CPF:', error)
    } finally {
      setVerificandoCpf(false)
    }
  }

  // Callback quando login por CPF for bem-sucedido
  const handleCpfLoginSuccess = async (userData: any) => {
    // Fechar bloco inline
    setShowCpfLogin(false)
    
    // Atualizar usuário logado
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUsuarioLogado(user)
    }
    
    // Preencher dados do participante atual com os dados do usuário
    const novosParticipantes = [...participantes]
    
    novosParticipantes[currentParticipante] = {
      ...novosParticipantes[currentParticipante],
      nome: userData.fullName || novosParticipantes[currentParticipante].nome,
      email: userData.email || novosParticipantes[currentParticipante].email,
      telefone: userData.phone || novosParticipantes[currentParticipante].telefone,
      cpf: userData.cpf ? formatCPF(userData.cpf) : novosParticipantes[currentParticipante].cpf,
      idade: userData.age?.toString() || novosParticipantes[currentParticipante].idade,
      genero: userData.gender || novosParticipantes[currentParticipante].genero,
      endereco: userData.address || novosParticipantes[currentParticipante].endereco,
      numero: userData.addressNumber || novosParticipantes[currentParticipante].numero,
      complemento: userData.addressComplement || novosParticipantes[currentParticipante].complemento,
      bairro: userData.neighborhood || novosParticipantes[currentParticipante].bairro,
      cidade: userData.city || novosParticipantes[currentParticipante].cidade,
      estado: userData.state || novosParticipantes[currentParticipante].estado,
      cep: userData.zipCode || novosParticipantes[currentParticipante].cep,
      paisResidencia: novosParticipantes[currentParticipante].paisResidencia || "brasil",
    }
    setParticipantes(novosParticipantes)
    
    // Buscar perfis salvos do usuário
    await buscarPerfisSalvos()
    
    toast.success('Dados preenchidos automaticamente!')
  }

  // Callback quando usuário escolher continuar sem login (fechar bloco inline)
  const handleCloseCpfLogin = () => {
    setShowCpfLogin(false)
    // Marcar que já verificamos este CPF para não mostrar novamente
    const participante = participantes[currentParticipante]
    setCpfVerificado(participante.cpf.replace(/\D/g, ''))
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
      logger.error('Erro ao buscar perfis salvos:', error)
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
        if (participantes.length === 0) {
          logger.warn('⚠️ [CHECKOUT] Nenhum participante para criar conta')
          return
        }
        const primeiroParticipante = participantes[0]
        if (!primeiroParticipante?.email) {
          logger.warn('⚠️ [CHECKOUT] Primeiro participante sem email')
          return
        }
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
        logger.error('Erro ao obter userId do principal:', error)
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
          country: p.paisResidencia || paisEvento || 'brasil',
          zip_code: p.cep,
          address: p.endereco,
          address_number: p.numero,
          address_complement: p.complemento,
          neighborhood: p.bairro,
          city: p.cidade,
          state: p.estado,
          shirt_size: p.tamanhoCamiseta,
          emergency_contact_name: p.contatoEmergenciaNome || null,
          emergency_contact_phone: p.contatoEmergenciaTelefone?.replace(/\D/g, "") || null,
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
      logger.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    }
  }

  // Selecionar participante salvo
  // Confirmar inclusão de mais participantes usando perfis salvos
  const confirmarIncluirParticipantes = async () => {
    if (perfisSelecionadosPopup.length === 0) {
      toast.error('Selecione pelo menos 1 perfil salvo')
      return
    }

    // Verificar se todas as categorias foram selecionadas
    const todosTemCategoria = perfisSelecionadosPopup.every(p => p.categoriaId)
    if (!todosTemCategoria) {
      toast.error('Selecione a categoria para todos os perfis selecionados')
      return
    }

    // Buscar detalhes dos ingressos selecionados
    const loteId = searchParams.get("lote")
    const ingressosParam = searchParams.get("ingressos")
    if (!ingressosParam || !loteId || !eventData) {
      toast.error('Erro ao buscar informações dos ingressos')
      return
    }

    let ingressosObj: Record<string, number>
    try {
      ingressosObj = JSON.parse(decodeURIComponent(ingressosParam))
    } catch (parseError) {
      logger.error("❌ [CHECKOUT] Erro ao parsear ingressos (confirmarIncluirParticipantes):", parseError)
      toast.error('Erro nos dados dos ingressos')
      return
    }
    const lote = eventData.ticket_batches?.find((b: any) => b.id === loteId)
    if (!lote) {
      toast.error('Lote não encontrado')
      return
    }

    // Adicionar participantes usando perfis salvos selecionados
    const novosParticipantes = [...participantes]
    const novosIngressos = [...ingressosSelecionados]
    const paisEventoAtual = paisEvento || "brasil"

    perfisSelecionadosPopup.forEach((selecao) => {
      const perfil = perfisSalvos.find(p => p.id === selecao.perfilId)
      if (!perfil) return

      // Buscar ticket da categoria selecionada (pode ser ID ou category)
      const ticket = lote.tickets?.find((t: any) => 
        t.id === selecao.categoriaId || t.category === selecao.categoriaId
      )
      if (!ticket) return

      // Criar participante a partir do perfil salvo
      const novoParticipante: Participante = {
        nome: perfil.full_name || "",
        email: perfil.email || "",
        telefone: perfil.phone || "",
        idade: perfil.age ? String(perfil.age) : "",
        genero: perfil.gender === 'male' ? 'Masculino' : perfil.gender === 'female' ? 'Feminino' : "",
        paisResidencia: perfil.country || paisEventoAtual,
        cep: perfil.zip_code || "",
        endereco: perfil.address || "",
        numero: perfil.address_number || "",
        complemento: perfil.address_complement || "",
        bairro: perfil.neighborhood || "",
        cidade: perfil.city || "",
        estado: perfil.state || "",
        cpf: perfil.cpf ? (perfil.country === "brasil" ? formatCPF(perfil.cpf) : perfil.cpf) : "",
        tamanhoCamiseta: perfil.shirt_size || "",
        aceiteTermo: false,
        contatoEmergenciaNome: perfil.emergency_contact_name || "",
        contatoEmergenciaTelefone: perfil.emergency_contact_phone || "",
      }
      novosParticipantes.push(novoParticipante)

      // Adicionar ingresso correspondente
      novosIngressos.push({
        id: ticket.id,
        categoria: ticket.category,
        valor: ticket.is_free ? 0 : parseFloat(ticket.price || "0"),
        gratuito: ticket.is_free,
        hasKit: ticket.has_kit,
        kitItems: ticket.kit_items || [],
        shirtSizes: ticket.shirt_sizes || [],
      })
    })

    setParticipantes(novosParticipantes)
    setIngressosSelecionados(novosIngressos)
    setMostrarPopupIncluirParticipantes(false)
    setPerfisSelecionadosPopup([])

    // Ir para o primeiro participante adicional para revisão
    setCurrentParticipante(1)
    setCurrentStep(1)
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
    const paisEventoAtual = paisEvento || "brasil"
    novosParticipantes[participanteAtualEmEdicao] = {
      ...participanteVazio,
      nome: perfil.full_name || "",
      email: perfil.email || "",
      telefone: perfil.phone || "",
      idade: perfil.age ? String(perfil.age) : "",
      genero: perfil.gender === 'male' ? 'Masculino' : perfil.gender === 'female' ? 'Feminino' : "",
      paisResidencia: perfil.country || paisEventoAtual,
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
  // Calcular total usando função utilitária
  const calcularTotal = () => calcularTotalPedido(ingressosSelecionados, runningClub)

  // Verificar se é gratuito usando função utilitária
  const isGratuito = () => isEventoGratuito(ingressosSelecionados)

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
      // Validar documento baseado no país
      if (p.paisResidencia === "brasil" && p.cpf.replace(/\D/g, '').length !== 11) {
        toast.error("CPF inválido - deve ter 11 dígitos")
        return false
      }
      if (p.paisResidencia === "argentina" && p.cpf.replace(/\D/g, '').length < 7) {
        toast.error("DNI inválido - deve ter pelo menos 7 dígitos")
        return false
      }
      if (p.paisResidencia !== "brasil" && p.paisResidencia !== "argentina" && !p.cpf) {
        toast.error(idioma === "es" ? "Documento inválido" : idioma === "en" ? "Invalid document" : "Documento inválido")
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
      if (!p.cpf || p.cpf.trim() === "") {
        toast.error(p.paisResidencia === "brasil" ? "CPF é obrigatório" : p.paisResidencia === "argentina" ? "DNI es obligatorio" : idioma === "es" ? "Documento es obligatorio" : "Document is required")
        return false
      }
      if (p.paisResidencia === "brasil" && p.cpf.replace(/\D/g, "").length !== 11) {
        toast.error("CPF inválido - deve ter 11 dígitos")
        return false
      }
      if (p.paisResidencia === "argentina" && p.cpf.replace(/\D/g, "").length < 7) {
        toast.error("DNI inválido - debe tener al menos 7 dígitos")
        return false
      }
      if (temCamiseta && !p.tamanhoCamiseta) {
        toast.error("Selecione o tamanho da camiseta")
        return false
      }
      if (!p.contatoEmergenciaNome || !p.contatoEmergenciaTelefone) {
        toast.error(idioma === "es" ? "Complete el contacto de emergencia" : idioma === "en" ? "Complete emergency contact" : "Preencha o contato de emergência")
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
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Último step do participante atual
      if (currentParticipante < participantes.length - 1) {
        // Próximo participante já existe (tinha 2+ ingressos desde o início)
        // Ir direto para o próximo participante sem popup
        setCurrentParticipante(currentParticipante + 1)
        setCurrentStep(1)
      } else if (currentParticipante === 0 && quantidadeIngressosInicial === 1) {
        // Se for o primeiro participante e tinha apenas 1 ingresso no início
        // Mostrar popup com perfis salvos (se houver usuário logado e perfis salvos)
        if (usuarioLogado) {
          await fetchPerfisSalvos()
          if (perfisSalvos.length > 0) {
            setMostrarPopupIncluirParticipantes(true)
          } else {
            // Não tem perfis salvos, finalizar
            handleSubmit()
          }
        } else {
          // Não está logado, finalizar
          handleSubmit()
        }
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

      // Buscar IP do cliente uma vez para todos os participantes
      let clientIP: string | null = null
      try {
        const ipResponse = await fetch('/api/get-client-info')
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          clientIP = ipData.ip || null
        }
      } catch (error) {
        // Se falhar, continuar sem IP
      }

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
              pais: participante.paisResidencia || paisEvento || 'brasil',
              idade: participante.idade ? parseInt(participante.idade) : null,
              genero: participante.genero === 'Masculino' ? 'male' : participante.genero === 'Feminino' ? 'female' : null,
              emergency_contact_name: participante.contatoEmergenciaNome || null,
              emergency_contact_phone: participante.contatoEmergenciaTelefone?.replace(/\D/g, '') || null,
            }),
          })

          if (!createAccountResponse.ok) {
            const errorData = await createAccountResponse.json().catch(() => ({}))
            logger.error('❌ Erro na API criar-conta-automatica:', createAccountResponse.status, errorData)
            // Continuar tentando buscar/criar usuário manualmente
          } else {
          const accountResult = await createAccountResponse.json()
          
            if (accountResult.userId) {
            userIdsMap.set(participante.email, accountResult.userId)
          } else {
            // Continuar sem user_id (será vinculado pelo email do atleta)
            }
          }
        } catch (accountError) {
          logger.error('Erro ao criar conta para', participante.email, ':', accountError)
          // Não bloquear o fluxo se falhar
        }
      }

      // Salvar perfis de participantes se solicitado
      const primeiroParticipanteEmail = participantes.length > 0 ? participantes[0]?.email : null
      const userIdPrincipal = usuarioLogado?.id || (primeiroParticipanteEmail ? userIdsMap.get(primeiroParticipanteEmail) : null) || null
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
                    country: p.paisResidencia || paisEvento || 'brasil',
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
                logger.error('Erro ao salvar perfil do participante', i, ':', error)
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


        // Garantir disponibilidade do ticket antes de criar inscrição
        const { data: ticketData, error: ticketFetchError } = await supabase
          .from("tickets")
          .select("quantity")
          .eq("id", ingresso.id)
          .single()

        if (ticketFetchError) {
          logger.error("ERRO AO BUSCAR TICKET:", ticketFetchError)
          toast.error("Erro ao validar ticket selecionado")
          throw ticketFetchError
        }

        // Se quantity é null, undefined ou 0, significa ilimitado
        const isUnlimited = !ticketData || ticketData.quantity === null || ticketData.quantity === undefined || ticketData.quantity === 0
        
        if (!isUnlimited && ticketData.quantity <= 0) {
          toast.error("Ingresso esgotado. Selecione outro ticket.")
          throw new Error("Ticket esgotado")
        }

        // Função para detectar dispositivo, navegador e OS
        const detectDeviceInfo = () => {
          if (typeof window === 'undefined') {
            return {
              deviceType: null,
              browser: null,
              os: null,
              userAgent: null,
            }
          }

          const userAgent = navigator.userAgent
          let deviceType: string | null = null
          let browser: string | null = null
          let os: string | null = null

          // Detectar tipo de dispositivo
          if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            deviceType = 'mobile'
          } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            deviceType = 'tablet'
          } else {
            deviceType = 'desktop'
          }

          // Detectar navegador
          if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome'
          } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox'
          } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari'
          } else if (userAgent.includes('Edg')) {
            browser = 'Edge'
          } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
            browser = 'Opera'
          } else {
            browser = 'Other'
          }

          // Detectar OS
          if (userAgent.includes('Windows')) {
            os = 'Windows'
          } else if (userAgent.includes('Mac OS')) {
            os = 'macOS'
          } else if (userAgent.includes('Linux')) {
            os = 'Linux'
          } else if (userAgent.includes('Android')) {
            os = 'Android'
          } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            os = 'iOS'
          } else {
            os = 'Other'
          }

          return { deviceType, browser, os, userAgent }
        }

        // Capturar informações do dispositivo quando o termo foi aceito
        const deviceInfo = detectDeviceInfo()
        
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
          liability_waiver_accepted: p.aceiteTermo || false,
          liability_waiver_timestamp: p.aceiteTermo ? now.toISOString() : null,
          liability_waiver_ip: p.aceiteTermo ? clientIP : null,
          liability_waiver_user_agent: p.aceiteTermo ? deviceInfo.userAgent : null,
          liability_waiver_device_type: p.aceiteTermo ? deviceInfo.deviceType : null,
          liability_waiver_browser: p.aceiteTermo ? deviceInfo.browser : null,
          liability_waiver_os: p.aceiteTermo ? deviceInfo.os : null,
        }
        
        // Preencher athlete_id e buyer_id (obrigatórios) e user_id (opcional)
        // IMPORTANTE: Sempre verificar se o usuário existe na tabela users antes de usar
        let athleteId = null
        
        // Primeiro, buscar por email na tabela users
        const { data: existingUserByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', p.email)
          .maybeSingle()
        
        if (existingUserByEmail) {
          // Usuário já existe na tabela users
          athleteId = existingUserByEmail.id
        } else if (userId) {
          // Verificar se o userId do auth existe na tabela users
          const { data: existingUserById } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle()
          
          if (existingUserById) {
            athleteId = existingUserById.id
          } else {
            // Usuário existe no auth mas não na tabela users - criar registro
            logger.log('[Inscrição] Criando registro na tabela users para userId:', userId)
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: p.email,
                full_name: p.nome,
                role: 'ATLETA',
              })
              .select('id')
              .single()
            
            if (newUser && !userError) {
              athleteId = newUser.id
            } else {
              logger.error("Erro ao criar usuário na tabela users:", userError)
              // Tentar criar sem o ID específico
              const { data: fallbackUser, error: fallbackError } = await supabase
                .from('users')
                .insert({
                  email: p.email,
                  full_name: p.nome,
                  role: 'ATLETA',
                })
                .select('id')
                .single()
              
              if (fallbackUser && !fallbackError) {
                athleteId = fallbackUser.id
              } else {
                logger.error("Erro ao criar usuário fallback:", fallbackError)
                toast.error("Erro ao vincular usuário à inscrição")
                throw new Error("Erro ao criar usuário")
              }
            }
          }
        } else {
          // Não tem userId do auth, criar usuário novo
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
            athleteId = newUser.id
          } else {
            logger.error("Erro ao criar usuário para inscrição:", userError)
            toast.error("Erro ao vincular usuário à inscrição")
            throw new Error("Erro ao criar usuário")
          }
        }
        
        // Definir os IDs obrigatórios
        insertData.athlete_id = athleteId
        insertData.buyer_id = athleteId
        if (userId) {
          insertData.user_id = userId
        }

        const { data: registration, error: regError } = await supabase
          .from("registrations")
          .insert(insertData)
          .select("id, registration_number")
          .single()


        if (regError) {
          logger.error("ERRO INSCRIÇÃO:", JSON.stringify(regError, null, 2))
          toast.error(`Erro ao criar inscrição: ${regError.message}`)
          throw regError
        }

        // Armazenar o número de inscrição criado
        if (registration?.registration_number) {
          registrationNumbers.push(registration.registration_number)
        }

        // 2. Criar atleta vinculado à inscrição
        // Garantir que o país seja salvo corretamente (usar o país do participante, não o padrão)
        const paisParticipante = p.paisResidencia || paisEvento || 'brasil'
        logger.log('🌍 [CHECKOUT] Salvando país do participante:', paisParticipante, 'País do evento:', paisEvento, 'País do participante (p.paisResidencia):', p.paisResidencia)
        
        const athleteData = {
          registration_id: registration.id,
          full_name: p.nome,
          email: p.email,
          phone: p.telefone,
          cpf: p.cpf?.replace(/\D/g, "") || null, // Salvar documento no campo cpf (mesmo para DNI, ID, etc)
          gender: p.genero || null,
          birth_date: null,
          age: p.idade ? parseInt(p.idade) : null,
          country: paisParticipante, // Usar o país do participante, não o padrão
          address: p.endereco || null,
          address_number: p.numero || null,
          address_complement: p.complemento || null,
          neighborhood: p.bairro || null,
          city: p.cidade || null,
          state: p.estado || null,
          zip_code: p.cep?.replace(/\D/g, "") || null,
          emergency_contact_name: p.contatoEmergenciaNome || null,
          emergency_contact_phone: p.contatoEmergenciaTelefone?.replace(/\D/g, "") || null,
        }

        const { data: athlete, error: athleteError } = await supabase
          .from("athletes")
          .insert(athleteData)
          .select("id")
          .single()


        if (athleteError) {
          logger.error("ERRO ATLETA:", JSON.stringify(athleteError, null, 2))
          logger.error("Detalhes do erro:", {
            message: athleteError.message,
            code: athleteError.code,
            details: athleteError.details,
            hint: athleteError.hint,
            cpf: athleteData.cpf,
            email: athleteData.email
          })
          
          // Se o erro for de CPF duplicado, tentar buscar atleta existente
          if (athleteError.code === '23505' || athleteError.message?.includes('duplicate') || athleteError.message?.includes('unique')) {
            logger.log("⚠️ CPF ou email duplicado detectado, tentando buscar atleta existente...")
            if (athleteData.cpf) {
              const { data: existingAthlete } = await supabase
                .from("athletes")
                .select("id")
                .eq("cpf", athleteData.cpf)
                .maybeSingle()
              
              if (existingAthlete) {
                logger.log("✅ Atleta existente encontrado pelo CPF:", existingAthlete.id)
                // Continuar sem bloquear - o atleta já existe
              }
            }
          } else {
            // Outro tipo de erro - não bloqueia, atleta é informação adicional
            logger.warn("⚠️ Erro ao criar atleta (não crítico):", athleteError.message)
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
            logger.log("🏃 [CHECKOUT] Valor original:", ingresso.valor, "Desconto:", descontoAplicado, "Valor final:", valorIngresso)
          }
          
          const taxa = 5
          const valorTotal = valorIngresso + taxa
          
          // Calcular comissão do afiliado se houver
          let affiliateCommission = 0
          if (affiliateData) {
            if (affiliateData.commission_type === 'percentage') {
              affiliateCommission = (valorIngresso * affiliateData.commission_value) / 100
            } else {
              affiliateCommission = affiliateData.commission_value
            }
            logger.log("🤝 [CHECKOUT] Comissão do afiliado calculada:", {
              tipo: affiliateData.commission_type,
              valor_comissao_config: affiliateData.commission_value,
              valor_ingresso: valorIngresso,
              comissao_calculada: affiliateCommission,
            })
          }
          
          const paymentData: any = {
            registration_id: registration.id,
            amount: valorTotal,
            total_amount: valorTotal.toString(),
            discount_amount: descontoAplicado > 0 ? descontoAplicado.toString() : null,
            payment_method: meioPagamento || "pix",
            payment_status: "pending",
            running_club_id: runningClub?.id || null, // Salvar referência ao clube
          }
          
          // Adicionar dados do afiliado se houver
          if (affiliateData) {
            paymentData.affiliate_id = affiliateData.id
            paymentData.affiliate_commission = affiliateCommission.toString()
          }

          const { error: payError } = await supabase
            .from("payments")
            .insert(paymentData)

          if (payError) {
            logger.error("ERRO PAGAMENTO:", JSON.stringify(payError, null, 2))
          }
        }

        // 4. Decrementar quantidade disponível do ticket
        const newQuantity = Math.max(0, (ticketData.quantity || 0) - 1)
        const { error: updateTicketError } = await supabase
          .from("tickets")
          .update({ quantity: newQuantity })
          .eq("id", ingresso.id)

        if (updateTicketError) {
          logger.error("ERRO AO ATUALIZAR QUANTIDADE:", updateTicketError)
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
            logger.error("ERRO AO ATUALIZAR TICKETS_USED DO CLUBE:", updateClubError)
          } else {
            logger.log("✅ [CHECKOUT] Tickets usados do clube atualizado:", runningClub.tickets_used + 1)
          }
        }
      }

      logger.log("=== INSCRIÇÃO CONCLUÍDA COM SUCESSO ===")
      toast.success("Inscrição realizada com sucesso! Contas criadas automaticamente.")

      // Salvar perfis de participantes adicionais marcados para salvar
      if (usuarioLogado) {
        for (let i = 1; i < participantes.length; i++) {
          if (salvarPerfil[i] && participantes[i]?.nome && participantes[i]?.cpf) {
            const p = participantes[i]
            try {
              logger.log(`💾 [CHECKOUT] Salvando perfil do participante ${i}: ${p.nome}`)
              await fetch('/api/participants/salvar-perfil', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: usuarioLogado.id,
                  full_name: p.nome,
                  email: p.email,
                  phone: p.telefone?.replace(/\D/g, '') || null,
                  cpf: p.cpf?.replace(/\D/g, '') || null,
                  country: p.paisResidencia || 'brasil',
                  zip_code: p.cep?.replace(/\D/g, '') || null,
                  address: p.endereco || null,
                  address_number: p.numero || null,
                  address_complement: p.complemento || null,
                  neighborhood: p.bairro || null,
                  city: p.cidade || null,
                  state: p.estado || null,
                  shirt_size: p.tamanhoCamiseta || null,
                  emergency_contact_name: p.contatoEmergenciaNome || null,
                  emergency_contact_phone: p.contatoEmergenciaTelefone?.replace(/\D/g, '') || null,
                }),
              })
              logger.log(`✅ [CHECKOUT] Perfil salvo: ${p.nome}`)
            } catch (saveError) {
              logger.error(`❌ [CHECKOUT] Erro ao salvar perfil ${p.nome}:`, saveError)
            }
          }
        }
      }

      // Sinalizar que o evento foi atualizado para recarregar dados
      try {
        localStorage.setItem(`event_updated_${eventId}`, 'true')
      } catch {
        // localStorage pode estar cheio ou indisponível
      }

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

        logger.log('📧 [Frontend] Enviando emails de confirmação...', {
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
          logger.error('❌ [Frontend] Erro HTTP ao enviar emails:', {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            error: errorText,
          })
        } else {
          const emailResult = await emailResponse.json()
          logger.log('✅ [Frontend] Emails processados:', emailResult)
        }
      } catch (emailError) {
        logger.error('❌ [Frontend] Erro ao enviar emails:', emailError)
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
      
      const obrigadoUrl = `/inscricao/${eventId}/obrigado?resumo=${resumoParam}`
      logger.log('🎉 [CHECKOUT] Inscrição finalizada! Redirecionando para:', obrigadoUrl)
      
      // Redirecionar usando window.location para garantir a navegação
      window.location.href = obrigadoUrl
      return // Importante: não executar o finally que faz setSubmitting(false)
      
    } catch (error: any) {
      logger.error("❌ [CHECKOUT] Erro ao finalizar inscrição:", error)
      
      // Enviar erro para o servidor (banco + email)
      try {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorMessage: error?.message || 'Erro desconhecido ao finalizar inscrição',
            errorStack: error?.stack,
            errorType: 'registration',
            url: typeof window !== 'undefined' ? window.location.href : null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            eventId,
            eventName: eventData?.name,
            page: 'checkout-submit',
            additionalData: {
              participantesCount: participantes.length,
              meioPagamento,
              totalIngressos: ingressosSelecionados.length,
              isGratuito: isGratuito(),
              step: currentStep,
            },
          }),
        })
      } catch (logError) {
        logger.error('Falha ao logar erro:', logError)
      }
      
      toast.error("Erro ao finalizar inscrição. Por favor, tente novamente.")
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

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Formulário */}
          <div className="w-full md:w-2/3">
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
                  <StepIndicator currentStep={currentStep} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                {/* Step 1: Dados Pessoais */}
                {currentStep === 1 && (
                  <Step1PersonalData
                    participante={participante}
                    participantes={participantes}
                    currentParticipante={currentParticipante}
                    usuarioLogado={usuarioLogado}
                    permiteEdicao={permiteEdicao}
                    setPermiteEdicao={setPermiteEdicao}
                    showCpfLogin={showCpfLogin}
                    cpfUserData={cpfUserData}
                    verificandoCpf={verificandoCpf}
                    idioma={idioma}
                    isBrasil={isBrasil}
                    t={t}
                    updateParticipante={updateParticipante}
                    setParticipantes={setParticipantes}
                    verificarCpfCadastrado={verificarCpfCadastrado}
                    handleCpfLoginSuccess={handleCpfLoginSuccess}
                    handleCloseCpfLogin={handleCloseCpfLogin}
                  />
                )}

                {/* Step 2: Endereço */}
                {currentStep === 2 && (
                  <Step2Address
                    participante={participante}
                    currentParticipante={currentParticipante}
                    loadingCep={loadingCep}
                    idioma={idioma}
                    t={t}
                    updateParticipante={updateParticipante}
                    buscarCep={buscarCep}
                  />
                )}

                {/* Step 3: Tamanho Camiseta, Contato de Emergência, Termos e Pagamento */}
                {currentStep === 3 && (
                  <Step3PaymentAndTerms
                    participante={participante}
                    participantes={participantes}
                    currentParticipante={currentParticipante}
                    usuarioLogado={usuarioLogado}
                    salvarPerfil={salvarPerfil}
                    setSalvarPerfil={setSalvarPerfil}
                    temCamiseta={temCamiseta}
                    ingresso={ingresso}
                    meioPagamento={meioPagamento}
                    setMeioPagamento={setMeioPagamento}
                    isGratuito={isGratuito()}
                    idioma={idioma}
                    isBrasil={isBrasil}
                    t={t}
                    updateParticipante={updateParticipante}
                    setParticipantes={setParticipantes}
                    salvarPerfilParticipante={salvarPerfilParticipante}
                  />
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
          <div className="w-full md:w-1/3">
            <OrderSummary
              eventData={eventData}
              ingresso={ingresso}
              ingressosSelecionados={ingressosSelecionados}
              participantes={participantes}
              runningClub={runningClub}
              subtotal={subtotal}
              desconto={desconto}
              taxa={taxa}
              total={total}
              isGratuito={isGratuito()}
              isBrasil={isBrasil}
              idioma={idioma}
              salvarPerfil={salvarPerfil}
              onSalvarPerfilChange={(index, checked) => {
                setSalvarPerfil(prev => ({ ...prev, [index]: checked }))
              }}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Rodapé Profissional */}
      <CheckoutFooter 
        idioma={idioma} 
        onIdiomaChange={setIdioma} 
        t={t} 
      />

      {/* Popup: Selecionar perfis salvos para incluir */}
      <Dialog open={mostrarPopupIncluirParticipantes} onOpenChange={setMostrarPopupIncluirParticipantes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center mb-2">Selecione os participantes adicionais</DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Escolha os perfis salvos que deseja incluir e selecione a categoria de cada um
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            {perfisSalvos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Você não tem perfis salvos ainda.</p>
                <p className="text-sm mt-2">Os perfis serão salvos após completar inscrições.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {perfisSalvos.map((perfil) => {
                  const isSelecionado = perfisSelecionadosPopup.some(p => p.perfilId === perfil.id)
                  const selecaoAtual = perfisSelecionadosPopup.find(p => p.perfilId === perfil.id)
                  
                  // Buscar categorias disponíveis do evento
                  const loteId = searchParams.get("lote")
                  const ingressosParam = searchParams.get("ingressos")
                  let categoriasDisponiveis: any[] = []
                  if (loteId && ingressosParam && eventData) {
                    try {
                    const ingressosObj = JSON.parse(decodeURIComponent(ingressosParam))
                    const lote = eventData.ticket_batches?.find((b: any) => b.id === loteId)
                    if (lote && lote.tickets) {
                      categoriasDisponiveis = lote.tickets.filter((t: any) => {
                        const quantidade = Number(ingressosObj[t.category] || 0)
                        return quantidade > 0
                      })
                      }
                    } catch (parseError) {
                      logger.error("❌ [CHECKOUT] Erro ao parsear categorias:", parseError)
                    }
                  }

                  return (
                    <div
                      key={perfil.id}
                      className={`border rounded-lg p-4 space-y-3 ${
                        isSelecionado ? 'border-[#156634] bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelecionado}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const primeiraCategoria = categoriasDisponiveis[0]
                              setPerfisSelecionadosPopup([
                                ...perfisSelecionadosPopup,
                                { perfilId: perfil.id, categoriaId: primeiraCategoria?.id || primeiraCategoria?.category || '' }
                              ])
                            } else {
                              setPerfisSelecionadosPopup(
                                perfisSelecionadosPopup.filter(p => p.perfilId !== perfil.id)
                              )
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{perfil.full_name || 'Sem nome'}</div>
                          <div className="text-sm text-gray-600">{perfil.email}</div>
                          {perfil.cpf && (
                            <div className="text-xs text-gray-500">
                              {perfil.country === "brasil" ? "CPF" : perfil.country === "argentina" ? "DNI" : "Doc"}: {perfil.cpf}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isSelecionado && (
                        <div className="ml-7 space-y-2">
                          <Label className="text-sm">Categoria do ingresso:</Label>
                          <Select
                            value={selecaoAtual?.categoriaId || ''}
                            onValueChange={(value) => {
                              setPerfisSelecionadosPopup(
                                perfisSelecionadosPopup.map(p =>
                                  p.perfilId === perfil.id ? { ...p, categoriaId: value } : p
                                )
                              )
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasDisponiveis.map((ticket: any) => (
                                <SelectItem key={ticket.id || ticket.category} value={ticket.id || ticket.category || ''}>
                                  {ticket.category} {ticket.is_free ? '(Gratuito)' : `- R$ ${parseFloat(ticket.price || "0").toFixed(2)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarPopupIncluirParticipantes(false)
                  setPerfisSelecionadosPopup([])
                  handleSubmit()
                }}
                className="flex-1"
              >
                Não, finalizar apenas eu
              </Button>
              <Button
                onClick={confirmarIncluirParticipantes}
                disabled={perfisSelecionadosPopup.length === 0}
                className="flex-1 bg-[#156634] hover:bg-[#1a7a3e]"
              >
                Continuar com {perfisSelecionadosPopup.length} participante{perfisSelecionadosPopup.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de busca de participantes salvos OU inserir novo */}
      <Dialog open={mostrarBuscaParticipantes} onOpenChange={setMostrarBuscaParticipantes}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
          {/* Header com gradiente */}
          <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-[#156634] to-emerald-600">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-white">
                  {participanteAtualEmEdicao !== null 
                    ? `Inscrito ${participanteAtualEmEdicao + 1} de ${participantes.length}`
                    : 'Quem vai participar?'}
                </DialogTitle>
                <p className="text-sm text-white/80">
                  {usuarioLogado && perfisSalvos.length > 0
                    ? 'Selecione ou cadastre novo'
                    : 'Cadastre o participante'}
                </p>
              </div>
            </div>
            {/* Decoração */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          
          {usuarioLogado && perfisSalvos.length > 0 ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Campo de busca */}
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    id="buscaParticipante"
                    placeholder="Buscar..."
                    value={termoBuscaParticipante}
                    onChange={(e) => setTermoBuscaParticipante(e.target.value)}
                    className="pl-9 h-9 bg-white text-sm"
                  />
                </div>
              </div>

              {/* Lista de perfis */}
              <div className="flex-1 overflow-y-auto p-3">
                {(termoBuscaParticipante ? perfisFiltrados : perfisSalvos).length > 0 ? (
                  <div className="space-y-2">
                    {(termoBuscaParticipante ? perfisFiltrados : perfisSalvos).map((perfil, idx) => {
                      // Cores diferentes para cada perfil
                      const colors = [
                        'from-blue-500 to-blue-600',
                        'from-purple-500 to-purple-600',
                        'from-pink-500 to-pink-600',
                        'from-orange-500 to-orange-600',
                        'from-teal-500 to-teal-600',
                      ]
                      const colorClass = colors[idx % colors.length]
                      
                      return (
                        <div 
                          key={perfil.id} 
                          onClick={() => selecionarParticipanteSalvo(perfil)}
                          className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-[#156634]/30 hover:shadow-md transition-all duration-200"
                        >
                          {/* Avatar com inicial */}
                          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-base font-bold text-white">
                              {perfil.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 text-sm truncate">{perfil.full_name}</p>
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#156634] flex-shrink-0" />
                            </div>
                            <p className="text-xs text-gray-500 truncate">{perfil.email}</p>
                            {perfil.city && perfil.state && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                📍 {perfil.city}, {perfil.state}
                              </p>
                            )}
                          </div>
                          
                          {/* Botão selecionar */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium text-[#156634] bg-[#156634]/10 px-2 py-1 rounded-full">
                              Usar
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : termoBuscaParticipante ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Nenhum resultado</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tente outro termo ou cadastre novo
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                <User className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">Nenhum cadastro salvo</p>
              <p className="text-sm text-gray-400 mt-1">Cadastre o participante abaixo</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-white flex gap-2">
            <Button
              onClick={criarNovoParticipante}
              className="flex-1 bg-[#156634] hover:bg-[#1a7a3e] h-10"
            >
              <User className="h-4 w-4 mr-2" />
              {usuarioLogado && perfisSalvos.length > 0 
                ? "Cadastrar novo" 
                : "Preencher dados"}
            </Button>
            {participanteAtualEmEdicao !== null && participanteAtualEmEdicao < participantes.length - 1 && (
              <Button
                variant="outline"
                onClick={continuarParaProximoParticipante}
                className="h-10"
              >
                Pular
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

// Loading fallback para o Suspense
function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634] mx-auto mb-4" />
        <p className="text-gray-600">Carregando checkout...</p>
      </div>
    </div>
  )
}

// Componente exportado com Error Boundary e Suspense para useSearchParams
export default function CheckoutPage() {
  // Extrair eventId dos params para passar ao Error Boundary
  const params = useParams()
  const eventId = params?.eventId as string | undefined
  
  // Proteção extra: Evitar erros de removeChild durante desmontagem rápida
  useEffect(() => {
    // Adicionar listener global para erros de DOM não capturados
    const handleDOMError = (event: ErrorEvent) => {
      if (event.message?.includes('removeChild') || event.message?.includes('Node')) {
        logger.warn('⚠️ [CHECKOUT] DOM error capturado (não crítico):', event.message)
        event.preventDefault() // Evita que crasheie a página
      }
    }
    
    window.addEventListener('error', handleDOMError)
    return () => window.removeEventListener('error', handleDOMError)
  }, [])
  
  return (
    <CheckoutErrorBoundary eventId={eventId}>
      <Suspense fallback={<CheckoutLoading />}>
        <CheckoutContent />
      </Suspense>
    </CheckoutErrorBoundary>
  )
}
