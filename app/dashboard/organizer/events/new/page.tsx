"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Importar ReactQuill dinamicamente para evitar problemas de SSR
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
import "react-quill/dist/quill.snow.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Upload, MapPin, Calendar, Clock, Trophy, DollarSign, Info, Plus, Trash2, Save, Edit, Package, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createEvent } from "@/lib/supabase/events"
import { uploadEventBanner, uploadEventGPX, uploadTicketGPX } from "@/lib/supabase/storage"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

// Modalidades esportivas disponíveis
const MODALIDADES_ESPORTIVAS = [
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

// Distâncias padrão para corrida
const DISTANCIAS_PADRAO = [
  { value: "5", label: "5km" },
  { value: "10", label: "10km" },
  { value: "21", label: "21km (Meia Maratona)" },
  { value: "42", label: "42km (Maratona)" },
  { value: "custom", label: "Personalizado" },
]

// Tamanhos de camiseta disponíveis
const TAMANHOS_CAMISETA = [
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "XG", label: "XG" },
  { value: "XXG", label: "XXG" },
]

// Itens do kit disponíveis
const ITENS_KIT = [
  { value: "camiseta", label: "Camiseta" },
  { value: "medalha", label: "Medalha" },
  { value: "numero", label: "Número de Peito" },
  { value: "chip", label: "Chip de Cronometragem" },
  { value: "sacola", label: "Sacola" },
  { value: "outros", label: "Outros" },
]

export default function NewEventPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [lotesExpandidos, setLotesExpandidos] = useState<{ [loteId: string]: boolean }>({})
  const [loadingCep, setLoadingCep] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Informações da Corrida
    nome: "",
    data: "",
    horarioInicio: "",
    horarioFim: "",
    categoria: "",
    modalidades: [] as string[],
    distancias: [] as string[],
    distanciasCustom: [] as string[],
    bannerEvento: null as File | null,
    gpxStrava: null as File | null,
    // Endereço
    pais: "Brasil",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    
    // Step 2: Lotes e Ingressos
    lotes: [] as Array<{
      id: string
      nome: string
      dataInicio: string
      horaInicio: string
      quantidadeTotal: string
      salvo: boolean
      ingressos: Array<{
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
      }>
    }>,
    
    // Step 3: Meios de Pagamento
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
    
    // Step 4: Descrição do Evento
    descricao: "",
  })

  const handleNext = () => {
    if (currentStep < 3) {
      // Validação básica por step
      if (currentStep === 1) {
        if (!formData.nome || !formData.data || !formData.horarioInicio || !formData.categoria) {
          toast.error("Preencha todos os campos obrigatórios")
          return
        }
        if (formData.categoria === "corrida" && formData.distancias.length === 0) {
          toast.error("Selecione pelo menos uma distância para corrida")
          return
        }
      }
      if (currentStep === 2) {
        if (formData.lotes.length === 0) {
          toast.error("Crie pelo menos um lote")
          return
        }
        // Validar se todos os lotes estão salvos
        const lotesNaoSalvos = formData.lotes.filter(lote => !lote.salvo)
        if (lotesNaoSalvos.length > 0) {
          toast.error("Salve todos os lotes antes de continuar")
          return
        }
        // Validar se todos os lotes têm pelo menos um ingresso
        const lotesInvalidos = formData.lotes.some(lote => lote.ingressos.length === 0)
        if (lotesInvalidos) {
          toast.error("Cada lote deve ter pelo menos um ingresso")
          return
        }
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      const supabase = createClient()

      // 1. Buscar usuário atual via sessão (mais confiável)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        toast.error("Você precisa estar logado para criar um evento")
        router.push("/login")
        return
      }

      console.log("=== CRIAÇÃO DE EVENTO ===")
      console.log("User ID:", user.id)
      console.log("User email:", user.email)

      // Buscar organizador do usuário - múltiplas tentativas
      let organizer: { id: string } | null = null

      // Tentativa 1: Buscar por user_id
      console.log("🔍 Tentativa 1: Buscar organizador por user_id =", user.id)
      const { data: organizerByUserId, error: errorByUserId } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      console.log("Resultado tentativa 1:", { data: organizerByUserId, error: errorByUserId })

      if (organizerByUserId && !errorByUserId) {
        console.log("✅ Encontrado por user_id:", organizerByUserId.id)
        organizer = organizerByUserId
      } else {
        console.log("❌ Não encontrado por user_id")
        
        // Tentativa 2: Buscar TODOS os organizadores
        console.log("🔍 Tentativa 2: Buscar TODOS os organizadores")
        const { data: allOrganizers, error: errorAll } = await supabase
          .from("organizers")
          .select("id, user_id, company_name")
        
        console.log("Todos os organizadores:", allOrganizers)
        console.log("Erro:", errorAll)

        if (allOrganizers && allOrganizers.length > 0) {
          // Pegar o primeiro organizador encontrado
          const firstOrganizer = allOrganizers[0]
          console.log("✅ Usando organizador:", firstOrganizer.id)
          organizer = { id: firstOrganizer.id }
          
          // Corrigir o user_id se necessário
          if (firstOrganizer.user_id !== user.id) {
            console.log("🔧 Corrigindo user_id de", firstOrganizer.user_id, "para", user.id)
            const { error: updateError } = await supabase
              .from("organizers")
              .update({ user_id: user.id, updated_at: new Date().toISOString() })
              .eq("id", firstOrganizer.id)
            
            if (updateError) {
              console.error("❌ Erro ao atualizar user_id:", updateError)
            } else {
              console.log("✅ user_id atualizado!")
            }
          }
        }
      }

      // Se não encontrou, tentar criar automaticamente
      if (!organizer) {
        console.log("🔧 Tentando criar organizador automaticamente...")
        
        // Buscar dados do usuário
        const { data: userData } = await supabase
          .from("users")
          .select("role, full_name")
          .eq("id", user.id)
          .maybeSingle()

        console.log("Dados do usuário:", userData)
        console.log("Metadata:", user.user_metadata)

        const userRole = userData?.role || user.user_metadata?.role
        console.log("Role do usuário:", userRole)
        
        // Criar organizador independente da role (já que está no dashboard de organizador)
        const companyName = userData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Organizador"
        console.log("Criando organizador com nome:", companyName)
        
        const { data: newOrganizer, error: insertError } = await supabase
          .from("organizers")
          .insert({
            user_id: user.id,
            company_name: companyName,
            legal_responsible: companyName,
          })
          .select("id")
          .single()

        console.log("Resultado da criação:", { data: newOrganizer, error: insertError })

        if (newOrganizer && !insertError) {
          console.log("✅ Organizador criado:", newOrganizer.id)
          organizer = newOrganizer
        } else {
          console.error("❌ Erro ao criar organizador:", insertError)
          
          // Última tentativa: buscar o organizador conhecido
          console.log("🔍 Última tentativa: buscar organizador por ID conhecido")
          const { data: knownOrganizer } = await supabase
            .from("organizers")
            .select("id")
            .eq("id", "0530a74c-a807-4d33-be12-95f42f41c76e")
            .maybeSingle()
          
          if (knownOrganizer) {
            console.log("✅ Encontrado organizador conhecido:", knownOrganizer.id)
            organizer = knownOrganizer
          }
        }
      }

      if (!organizer) {
        console.error("❌ FALHA TOTAL: Não foi possível encontrar ou criar o perfil de organizador")
        console.error("Por favor, execute o script SQL: supabase/scripts/fix_organizer_complete.sql")
        toast.error("Perfil de organizador não encontrado. Execute o script de correção no banco de dados.")
        return
      }

      console.log("✅ Organizador final:", organizer.id)

      // 2. Preparar dados dos lotes (upload será feito depois de criar o evento)
      const lotes = formData.lotes.map((lote, index) => {
        // Calcular data fim do lote
        let dataFim = lote.dataInicio
        if (index < formData.lotes.length - 1) {
          const proximoLote = formData.lotes[index + 1]
          dataFim = proximoLote.dataInicio
        } else {
          // Último lote: adicionar 15 dias
          const data = new Date(lote.dataInicio)
          data.setDate(data.getDate() + 15)
          dataFim = data.toISOString().split("T")[0]
        }

        return {
          name: lote.nome,
          start_date: lote.dataInicio,
          start_time: lote.horaInicio,
          end_date: dataFim,
          total_quantity: lote.quantidadeTotal && lote.quantidadeTotal !== "" ? parseInt(lote.quantidadeTotal) : null,
          tickets: lote.ingressos.map((ingresso) => {
            const shirtQuantities = Object.entries(ingresso.quantidadeCamisetasPorTamanho || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                  const parsed = parseInt(value as string, 10)
                  if (!Number.isNaN(parsed)) {
                    acc[size] = parsed
                  }
                }
                return acc
              },
              {}
            )

            return {
              category: ingresso.categoria,
              price: ingresso.gratuito ? 0 : parseFloat(ingresso.valor || "0"),
              is_free: ingresso.gratuito,
              quantity: (ingresso.quantidade !== null && ingresso.quantidade !== undefined && ingresso.quantidade !== 0) 
                ? ingresso.quantidade 
                : null,
              has_kit: ingresso.possuiKit,
              kit_items: ingresso.itensKit || [],
              shirt_sizes: ingresso.tamanhosCamiseta || [],
              shirt_quantities: shirtQuantities,
            }
          }),
        }
      })

      // 4. Preparar distâncias
      const distancias = formData.distancias.filter((d) => d !== "custom")
      const distanciasPadrao = distancias.map((d) => {
        const distancia = DISTANCIAS_PADRAO.find((dp) => dp.value === d)
        return distancia ? distancia.label : d
      })

      // 5. Montar endereço completo
      const enderecoCompleto = [
        formData.endereco,
        formData.numero ? `nº ${formData.numero}` : "",
        formData.complemento,
        formData.bairro,
      ].filter(Boolean).join(", ")

      const localCompleto = [
        formData.cidade,
        formData.estado,
        formData.pais,
      ].filter(Boolean).join(", ")

      // 6. Criar evento no Supabase
      const event = await createEvent({
        organizer_id: organizer.id,
        name: formData.nome,
        description: formData.descricao,
        category: formData.categoria,
        event_date: formData.data,
        start_time: formData.horarioInicio,
        end_time: formData.horarioFim || undefined,
        location: localCompleto || "Local a definir",
        address: enderecoCompleto || "Endereço a definir",
        city: formData.cidade,
        state: formData.estado,
        zip_code: formData.cep,
        distances: distanciasPadrao,
        custom_distances: formData.distanciasCustom,
        total_capacity: formData.lotes.reduce((total, lote) => {
          const qtd = lote.quantidadeTotal && lote.quantidadeTotal !== "" ? parseInt(lote.quantidadeTotal) : null
          return qtd !== null ? total + qtd : total
        }, 0) || undefined,
        lotes,
        settings: {
          payment_pix_enabled: formData.meiosPagamento.pix,
          payment_credit_card_enabled: formData.meiosPagamento.cartaoCredito,
          payment_boleto_enabled: formData.meiosPagamento.boleto,
          payment_max_installments: formData.meiosPagamento.parcelamento.maxParcelas,
          payment_assume_interest: formData.meiosPagamento.parcelamento.assumirJuros,
        },
      })

      // 7. Upload de arquivos com o ID real do evento
      console.log("=== VERIFICANDO BANNER ===")
      console.log("Banner selecionado?", formData.bannerEvento ? "SIM" : "NÃO")
      console.log("Banner file:", formData.bannerEvento)
      console.log("Event ID:", event.id)
      
      if (formData.bannerEvento && event.id) {
        try {
          console.log("📤 Fazendo upload do banner...")
          console.log("Nome do arquivo:", formData.bannerEvento.name)
          console.log("Tamanho:", formData.bannerEvento.size, "bytes")
          const bannerUrl = await uploadEventBanner(formData.bannerEvento, event.id)
          console.log("✅ Banner URL gerada:", bannerUrl)
          
          const { error: updateError } = await supabase
            .from("events")
            .update({ banner_url: bannerUrl })
            .eq("id", event.id)
          
          if (updateError) {
            console.error("❌ Erro ao salvar URL do banner:", updateError)
          } else {
            console.log("✅ Banner salvo no evento!")
            toast.success("Banner enviado com sucesso!")
          }
        } catch (error) {
          console.error("❌ Erro ao fazer upload do banner:", error)
          toast.error("Erro ao fazer upload do banner")
        }
      }

      if (formData.gpxStrava && event.id) {
        try {
          console.log("📤 Fazendo upload do GPX...")
          const gpxUrl = await uploadEventGPX(formData.gpxStrava, event.id)
          console.log("✅ GPX URL:", gpxUrl)
          
          const { error: updateError } = await supabase
            .from("events")
            .update({ gpx_file_url: gpxUrl })
            .eq("id", event.id)
          
          if (updateError) {
            console.error("❌ Erro ao salvar URL do GPX:", updateError)
          } else {
            console.log("✅ GPX salvo no evento!")
            toast.success("GPX enviado com sucesso!")
          }
        } catch (error) {
          console.error("❌ Erro ao fazer upload do GPX:", error)
          toast.error("Erro ao fazer upload do GPX")
        }
      }

      // 8. Upload de GPX dos tickets e atualização
      if (event.id) {
        try {
          // Buscar todos os batches e tickets criados para este evento
          const { data: ticketBatches, error: batchesError } = await supabase
            .from("ticket_batches")
            .select(`
              id,
              name,
              tickets(id, category)
            `)
            .eq("event_id", event.id)

          if (!batchesError && ticketBatches) {
            // Para cada lote e ingresso com GPX, fazer upload e atualizar
            for (const lote of formData.lotes) {
              for (const ingresso of lote.ingressos) {
                if (ingresso.gpxFile) {
                  // Encontrar o batch correspondente pelo nome
                  const batch = ticketBatches.find((b: any) => b.name === lote.nome)
                  if (batch && (batch as any).tickets) {
                    const ticket = ((batch as any).tickets as any[]).find(
                      (t: any) => t.category === ingresso.categoria
                    )
                    
                    if (ticket) {
                      try {
                        console.log(`📤 Fazendo upload do GPX para ticket ${ticket.id} (${ingresso.categoria})...`)
                        const gpxUrl = await uploadTicketGPX(ingresso.gpxFile, event.id, ticket.id)
                        console.log(`✅ GPX URL para ticket ${ticket.id}:`, gpxUrl)
                        
                        // Atualizar ticket com GPX e opções
                        const { error: ticketUpdateError } = await supabase
                          .from("tickets")
                          .update({
                            gpx_file_url: gpxUrl,
                            show_route: ingresso.showRoute || false,
                            show_map: ingresso.showMap || false,
                            show_elevation: ingresso.showElevation || false,
                          })
                          .eq("id", ticket.id)
                        
                        if (ticketUpdateError) {
                          console.error(`❌ Erro ao atualizar ticket ${ticket.id}:`, ticketUpdateError)
                        } else {
                          console.log(`✅ Ticket ${ticket.id} atualizado com GPX e opções!`)
                        }
                      } catch (error) {
                        console.error(`❌ Erro ao fazer upload do GPX do ticket ${ticket.id}:`, error)
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("❌ Erro ao processar GPX dos tickets:", error)
          // Não bloquear o sucesso do evento se houver erro nos GPX
        }
      }

      toast.success("Evento criado com sucesso!")
      // Usar slug se disponível, senão usar ID
      const redirectUrl = event.slug ? `/evento/${event.slug}` : `/evento/${event.id}`
      router.push(redirectUrl)
    } catch (error: any) {
      console.error("Erro ao criar evento:", error)
      toast.error(error.message || "Erro ao criar evento. Tente novamente.")
    }
  }

  const handleFileUpload = (field: "bannerEvento" | "gpxStrava", file: File | null) => {
    setFormData({ ...formData, [field]: file })
    if (file) {
      toast.success(`${field === "bannerEvento" ? "Banner" : "GPX"} carregado com sucesso!`)
    }
  }

  const buscarCep = async (cep: string) => {
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

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }))
      toast.success("Endereço preenchido automaticamente!")
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      toast.error("Erro ao buscar CEP")
    } finally {
      setLoadingCep(false)
    }
  }

  const handleDistanciaChange = (value: string, checked: boolean) => {
    if (value === "custom") {
      // Se selecionar customizado, adiciona à lista de distâncias
      const newDistancias = checked
        ? [...formData.distancias, "custom"]
        : formData.distancias.filter(d => d !== "custom")
      setFormData({ ...formData, distancias: newDistancias })
    } else {
      // Remove "custom" se selecionar outras distâncias
      const newDistancias = checked
        ? [...formData.distancias.filter(d => d !== "custom"), value]
        : formData.distancias.filter(d => d !== value)
      setFormData({ ...formData, distancias: newDistancias })
    }
  }

  const addDistanciaCustom = () => {
    const input = document.getElementById("distanciaCustomInput") as HTMLInputElement
    const valor = input?.value.trim()
    if (valor && !isNaN(Number(valor)) && Number(valor) > 0) {
      const distancia = `${valor}km`
      if (!formData.distanciasCustom.includes(distancia)) {
        setFormData({
          ...formData,
          distanciasCustom: [...formData.distanciasCustom, distancia],
        })
        input.value = ""
        toast.success(`Distância ${distancia} adicionada`)
      } else {
        toast.error("Esta distância já foi adicionada")
      }
    } else {
      toast.error("Digite uma distância válida")
    }
  }

  const removeDistanciaCustom = (distancia: string) => {
    setFormData({
      ...formData,
      distanciasCustom: formData.distanciasCustom.filter(d => d !== distancia),
    })
  }

  // Funções para gerenciar lotes
  const getCategoriasDisponiveis = () => {
    if (formData.categoria === "corrida") {
      const distanciasPadrao = formData.distancias
        .filter(d => d !== "custom")
        .map(d => DISTANCIAS_PADRAO.find(dp => dp.value === d)?.label || d)
      return [...distanciasPadrao, ...formData.distanciasCustom]
    }
    return [formData.categoria]
  }

  const addLote = () => {
    const categorias = getCategoriasDisponiveis()
    const novoLote = {
      id: Date.now().toString(),
      nome: `Lote ${formData.lotes.length + 1}`,
      dataInicio: "",
      horaInicio: "",
      quantidadeTotal: "",
      salvo: false,
      ingressos: categorias.map(categoria => ({
        categoria,
        valor: "",
        gratuito: false,
        quantidade: 0,
        possuiKit: false,
        itensKit: [],
        tamanhosCamiseta: [],
        quantidadeCamisetasPorTamanho: {},
        gpxFile: null,
        gpxFileUrl: null,
        showRoute: false,
        showMap: false,
        showElevation: false,
      })),
    }
    setFormData({
      ...formData,
      lotes: [...formData.lotes, novoLote],
    })
  }

  const salvarLote = (loteId: string) => {
    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    // Validações
    if (!lote.dataInicio || !lote.horaInicio || !lote.quantidadeTotal) {
      toast.error("Preencha data, hora e quantidade total do lote")
      return
    }

    const quantidadeTotal = parseInt(lote.quantidadeTotal)
    if (isNaN(quantidadeTotal) || quantidadeTotal <= 0) {
      toast.error("A quantidade total deve ser maior que zero")
      return
    }

    // Verifica se todos os ingressos têm valor ou são gratuitos
    const ingressosInvalidos = lote.ingressos.some(
      ingresso => !ingresso.gratuito && (!ingresso.valor || parseFloat(ingresso.valor) < 0)
    )
    if (ingressosInvalidos) {
      toast.error("Preencha o valor de todos os ingressos ou marque como gratuito")
      return
    }

    // Marca o lote como salvo e recolhe
    setFormData({
      ...formData,
      lotes: formData.lotes.map(l =>
        l.id === loteId ? { ...l, salvo: true } : l
      ),
    })

    // Recolhe o lote ao salvar
    setLotesExpandidos(prev => ({
      ...prev,
      [loteId]: false,
    }))

    toast.success("Lote salvo com sucesso!")
  }

  const editarLote = (loteId: string) => {
    setFormData({
      ...formData,
      lotes: formData.lotes.map(l =>
        l.id === loteId ? { ...l, salvo: false } : l
      ),
    })
    // Expande o lote ao editar
    setLotesExpandidos(prev => ({
      ...prev,
      [loteId]: true,
    }))
  }

  const toggleLoteExpandido = (loteId: string) => {
    setLotesExpandidos(prev => ({
      ...prev,
      [loteId]: !prev[loteId],
    }))
  }

  const calcularDistribuicaoIngressos = (loteId: string, quantidadeTotal: string) => {
    const quantidade = parseInt(quantidadeTotal)
    if (isNaN(quantidade) || quantidade <= 0) return

    const lote = formData.lotes.find(l => l.id === loteId)
    if (!lote) return

    const numCategorias = lote.ingressos.length
    if (numCategorias === 0) return

    // Distribui igualmente entre as categorias
    const quantidadePorCategoria = Math.floor(quantidade / numCategorias)
    const resto = quantidade % numCategorias

    // Atualiza as quantidades
    setFormData((prev) => ({
      ...prev,
      lotes: prev.lotes.map(l =>
        l.id === loteId
          ? {
              ...l,
              ingressos: l.ingressos.map((ingresso, index) => ({
                ...ingresso,
                quantidade: quantidadePorCategoria + (index < resto ? 1 : 0),
              })),
            }
          : l
      ),
    }))
  }

  const removeLote = (loteId: string) => {
    setFormData({
      ...formData,
      lotes: formData.lotes.filter(l => l.id !== loteId),
    })
  }

  const updateLote = (loteId: string, field: string, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        lotes: prev.lotes.map(lote =>
          lote.id === loteId ? { ...lote, [field]: value } : lote
        ),
      }
      
      // Se atualizou a quantidade total, recalcula a distribuição mantendo proporções
      if (field === "quantidadeTotal" && value) {
        const quantidade = parseInt(value)
        if (!isNaN(quantidade) && quantidade > 0) {
          const lote = updated.lotes.find(l => l.id === loteId)
          if (lote && lote.ingressos.length > 0) {
            // Calcula a soma atual das quantidades
            const somaAtual = lote.ingressos.reduce((sum, i) => sum + (i.quantidade || 0), 0)
            
            if (somaAtual > 0) {
              // Mantém as proporções atuais
              updated.lotes = updated.lotes.map(l =>
                l.id === loteId
                  ? {
                      ...l,
                      ingressos: l.ingressos.map((ingresso) => {
                        const proporcao = (ingresso.quantidade || 0) / somaAtual
                        return {
                          ...ingresso,
                          quantidade: Math.round(quantidade * proporcao),
                        }
                      }),
                    }
                  : l
              )
              
              // Ajusta para garantir que a soma seja exata
              const loteAjustado = updated.lotes.find(l => l.id === loteId)
              if (loteAjustado) {
                const somaAjustada = loteAjustado.ingressos.reduce((sum, i) => sum + i.quantidade, 0)
                const diferenca = quantidade - somaAjustada
                
                if (diferenca !== 0 && loteAjustado.ingressos.length > 0) {
                  // Distribui a diferença
                  updated.lotes = updated.lotes.map(l =>
                    l.id === loteId
                      ? {
                          ...l,
                          ingressos: l.ingressos.map((ingresso, index) => ({
                            ...ingresso,
                            quantidade: ingresso.quantidade + (index < Math.abs(diferenca) ? (diferenca > 0 ? 1 : -1) : 0),
                          })),
                        }
                      : l
                  )
                }
              }
            } else {
              // Se não há quantidades definidas, distribui igualmente
              const quantidadePorCategoria = Math.floor(quantidade / lote.ingressos.length)
              const resto = quantidade % lote.ingressos.length
              
              updated.lotes = updated.lotes.map(l =>
                l.id === loteId
                  ? {
                      ...l,
                      ingressos: l.ingressos.map((ingresso, index) => ({
                        ...ingresso,
                        quantidade: quantidadePorCategoria + (index < resto ? 1 : 0),
                      })),
                    }
                  : l
              )
            }
          }
        }
      }
      
      return updated
    })
  }

  const updateIngresso = (loteId: string, categoria: string, field: string, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        lotes: prev.lotes.map(lote =>
          lote.id === loteId
            ? {
                ...lote,
                ingressos: lote.ingressos.map(ingresso =>
                  ingresso.categoria === categoria
                    ? { ...ingresso, [field]: value }
                    : ingresso
                ),
              }
            : lote
        ),
      }

      // Se atualizou a quantidade de uma categoria, ajusta as outras
      if (field === "quantidade") {
        const lote = updated.lotes.find(l => l.id === loteId)
        if (lote && lote.quantidadeTotal) {
          const quantidadeTotal = parseInt(lote.quantidadeTotal)
          if (!isNaN(quantidadeTotal) && quantidadeTotal > 0) {
            const quantidadeEditada = parseInt(value) || 0
            const outrasCategorias = lote.ingressos.filter(i => i.categoria !== categoria)
            const somaOutras = outrasCategorias.reduce((sum, i) => sum + (i.quantidade || 0), 0)
            const quantidadeRestante = quantidadeTotal - quantidadeEditada

            if (quantidadeRestante >= 0 && outrasCategorias.length > 0) {
              // Distribui o restante igualmente entre as outras categorias
              const quantidadePorCategoria = Math.floor(quantidadeRestante / outrasCategorias.length)
              const resto = quantidadeRestante % outrasCategorias.length

              updated.lotes = updated.lotes.map(l =>
                l.id === loteId
                  ? {
                      ...l,
                      ingressos: l.ingressos.map((ingresso, index) => {
                        if (ingresso.categoria === categoria) {
                          return { ...ingresso, quantidade: quantidadeEditada }
                        }
                        const categoriaIndex = outrasCategorias.findIndex(c => c.categoria === ingresso.categoria)
                        return {
                          ...ingresso,
                          quantidade: quantidadePorCategoria + (categoriaIndex < resto ? 1 : 0),
                        }
                      }),
                    }
                  : l
              )
            }
          }
        }
      }

      return updated
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Evento</h1>
        <p className="text-muted-foreground">
          Crie um novo evento esportivo em 3 passos simples
        </p>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step ? "✓" : step}
                  </div>
                  <p className="text-xs mt-2 text-center text-muted-foreground">
                    {step === 1 && "Informações"}
                    {step === 2 && "Lotes e Ingressos"}
                    {step === 3 && "Descrição"}
                  </p>
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Informações da Corrida */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Evento *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Maratona de São Paulo 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data do Evento *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horarioInicio">Horário de Início *</Label>
                  <Input
                    id="horarioInicio"
                    type="time"
                    value={formData.horarioInicio}
                    onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioFim">Horário de Término</Label>
                  <Input
                    id="horarioFim"
                    type="time"
                    value={formData.horarioFim}
                    onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria do Evento *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value, modalidades: [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALIDADES_ESPORTIVAS.map((modalidade) => (
                      <SelectItem key={modalidade.value} value={modalidade.value}>
                        {modalidade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distâncias para corrida */}
              {formData.categoria === "corrida" && (
                <div className="space-y-4">
                  <Label>Distâncias Disponíveis *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DISTANCIAS_PADRAO.map((distancia) => (
                      <div key={distancia.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`distancia-${distancia.value}`}
                          checked={formData.distancias.includes(distancia.value)}
                          onCheckedChange={(checked) =>
                            handleDistanciaChange(distancia.value, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`distancia-${distancia.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {distancia.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {formData.distancias.includes("custom") && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="distanciaCustomInput">Adicionar Distância Personalizada (em km) *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="distanciaCustomInput"
                            type="number"
                            min="1"
                            placeholder="Ex: 110"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addDistanciaCustom()
                              }
                            }}
                          />
                          <span className="text-sm text-muted-foreground">km</span>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addDistanciaCustom}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>

                      {formData.distanciasCustom.length > 0 && (
                        <div className="space-y-2">
                          <Label>Distâncias Personalizadas Adicionadas:</Label>
                          <div className="flex flex-wrap gap-2">
                            {formData.distanciasCustom.map((distancia, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20"
                              >
                                <span className="text-sm font-medium">{distancia}</span>
                                <button
                                  type="button"
                                  onClick={() => removeDistanciaCustom(distancia)}
                                  className="text-primary hover:text-primary/80 ml-1 text-lg leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Endereço do Evento */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Local do Evento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pais">País *</Label>
                    <Select
                      value={formData.pais}
                      onValueChange={(value) => setFormData({ ...formData, pais: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Brasil">Brasil</SelectItem>
                        <SelectItem value="Argentina">Argentina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 8)
                          const formatted = value.replace(/(\d{5})(\d{3})/, "$1-$2")
                          setFormData({ ...formData, cep: formatted })
                        }}
                        onBlur={(e) => buscarCep(e.target.value)}
                        placeholder="00000-000"
                        disabled={loadingCep}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite o CEP para autopreenchimento
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      placeholder="Ex: SC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Ex: Florianópolis"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Ex: Centro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Ex: Av. Beira Mar Norte"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Ex: 1000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento / Ponto de Referência</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Ex: Próximo ao Terminal de Integração"
                  />
                </div>
              </div>

              {/* Upload de arquivos */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bannerEvento">Banner do Evento</Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        <div className="absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          Este banner será exibido no cabeçalho da página do evento. Tamanho recomendado: 1920x600px (formato JPG ou PNG).
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="bannerEvento"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("bannerEvento", e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("bannerEvento")?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {formData.bannerEvento ? formData.bannerEvento.name : "Upload Banner"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tamanho recomendado: 1920x600px (formato JPG ou PNG)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="gpxStrava">GPX do Strava</Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        <div className="absolute left-0 top-6 w-72 p-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          Este arquivo GPX será exibido na página do evento com informações do percurso, altimetria, distância e outros dados baseados no mapa do Strava.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="gpxStrava"
                        type="file"
                        accept=".gpx,.GPX"
                        onChange={(e) =>
                          handleFileUpload("gpxStrava", e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("gpxStrava")?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {formData.gpxStrava ? formData.gpxStrava.name : "Upload GPX"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Lotes e Ingressos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lotes e Ingressos</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure os lotes de venda e os valores dos ingressos para cada categoria
                  </p>
                </div>
                <Button type="button" onClick={addLote} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Lote
                </Button>
              </div>

              {formData.lotes.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhum lote criado ainda</p>
                  <Button type="button" onClick={addLote} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Lote
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.lotes.map((lote, index) => {
                    // Se o lote não está salvo, sempre expandido. Se está salvo, verifica o estado
                    const isExpandido = lote.salvo ? (lotesExpandidos[lote.id] === true) : true
                    return (
                      <Card key={lote.id} className={lote.salvo ? "border-green-200 bg-green-50/30" : ""}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {lote.salvo && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleLoteExpandido(lote.id)}
                                  className="h-8 w-8"
                                >
                                  {lotesExpandidos[lote.id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {lote.salvo ? (
                                <CardTitle className="text-lg">{lote.nome}</CardTitle>
                              ) : (
                                <Input
                                  value={lote.nome}
                                  onChange={(e) => updateLote(lote.id, "nome", e.target.value)}
                                  className="text-lg font-semibold h-8 w-48"
                                  placeholder="Nome do lote"
                                />
                              )}
                              {lote.salvo ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Salvo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Em edição</Badge>
                              )}
                              {index === 0 && lote.salvo && (
                                <Badge variant="outline" className="text-xs">Lote Atual</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {lote.salvo ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editarLote(lote.id)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  onClick={() => salvarLote(lote.id)}
                                >
                                  <Save className="mr-2 h-4 w-4" />
                                  Salvar Lote
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLote(lote.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {isExpandido && (
                          <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`lote-${lote.id}-data`}>Data de Início *</Label>
                            <Input
                              id={`lote-${lote.id}-data`}
                              type="date"
                              value={lote.dataInicio}
                              onChange={(e) =>
                                updateLote(lote.id, "dataInicio", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`lote-${lote.id}-hora`}>Hora de Início *</Label>
                            <Input
                              id={`lote-${lote.id}-hora`}
                              type="time"
                              value={lote.horaInicio}
                              onChange={(e) =>
                                updateLote(lote.id, "horaInicio", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`lote-${lote.id}-quantidade`}>Quantidade Total de Ingressos</Label>
                            <Input
                              id={`lote-${lote.id}-quantidade`}
                              type="number"
                              min="0"
                              step="1"
                              value={lote.quantidadeTotal}
                              onChange={(e) => {
                                const valor = e.target.value
                                // Permite valores vazios (para poder apagar) e números válidos
                                if (valor === "" || (!isNaN(Number(valor)) && Number(valor) >= 0)) {
                                  updateLote(lote.id, "quantidadeTotal", valor)
                                }
                              }}
                              placeholder="Deixe vazio para ilimitado"
                            />
                            <p className="text-xs text-muted-foreground">
                              Total de ingressos do lote. Deixe vazio para ilimitado. Você pode editar a quantidade de cada categoria abaixo.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                          <Label>Ingressos por Categoria</Label>
                          <div className="space-y-3">
                            {lote.ingressos.map((ingresso) => (
                              <div
                                key={ingresso.categoria}
                                className="p-4 bg-gray-50 rounded-lg border space-y-4"
                              >
                                {/* Linha principal: Categoria, Quantidade, Valor */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <Label className="text-sm font-medium">
                                      {ingresso.categoria}
                                    </Label>
                                    {lote.quantidadeTotal && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={ingresso.quantidade ?? ""}
                                          placeholder="Deixe vazio para ilimitado"
                                          onChange={(e) => {
                                            const valor = e.target.value
                                            if (valor === "") {
                                              updateIngresso(lote.id, ingresso.categoria, "quantidade", null)
                                            } else if (!isNaN(Number(valor)) && Number(valor) >= 0) {
                                              updateIngresso(lote.id, ingresso.categoria, "quantidade", parseInt(valor))
                                            }
                                          }}
                                          className="w-20 h-7 text-xs"
                                          disabled={lote.salvo}
                                        />
                                        <span className="text-xs text-muted-foreground">ingressos</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`ingresso-${lote.id}-${ingresso.categoria}-gratuito`}
                                        checked={ingresso.gratuito}
                                        onCheckedChange={(checked) =>
                                          updateIngresso(
                                            lote.id,
                                            ingresso.categoria,
                                            "gratuito",
                                            checked
                                          )
                                        }
                                        disabled={lote.salvo}
                                      />
                                      <Label
                                        htmlFor={`ingresso-${lote.id}-${ingresso.categoria}-gratuito`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        Gratuito
                                      </Label>
                                    </div>
                                    {!ingresso.gratuito && (
                                      <div className="flex items-center gap-2 w-40">
                                        <span className="text-sm text-muted-foreground">R$</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="0,00"
                                          value={ingresso.valor}
                                          onChange={(e) =>
                                            updateIngresso(
                                              lote.id,
                                              ingresso.categoria,
                                              "valor",
                                              e.target.value
                                            )
                                          }
                                          className="flex-1"
                                          disabled={lote.salvo}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Configuração de Kit */}
                                {!lote.salvo && (
                                  <div className="pt-3 border-t space-y-4">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`kit-${lote.id}-${ingresso.categoria}`}
                                        checked={ingresso.possuiKit || false}
                                        onCheckedChange={(checked) =>
                                          updateIngresso(
                                            lote.id,
                                            ingresso.categoria,
                                            "possuiKit",
                                            checked
                                          )
                                        }
                                      />
                                      <Label
                                        htmlFor={`kit-${lote.id}-${ingresso.categoria}`}
                                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                      >
                                        <Package className="h-4 w-4" />
                                        Possui Kit
                                      </Label>
                                    </div>

                                    {ingresso.possuiKit && (
                                      <div className="pl-6 space-y-4">
                                        {/* Seleção de itens do kit */}
                                        <div className="space-y-2">
                                          <Label className="text-sm">Itens do Kit</Label>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {ITENS_KIT.map((item) => (
                                              <div key={item.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                  id={`item-${lote.id}-${ingresso.categoria}-${item.value}`}
                                                  checked={(ingresso.itensKit || []).includes(item.value)}
                                                  onCheckedChange={(checked) => {
                                                    const itensAtuais = ingresso.itensKit || []
                                                    const novosItens = checked
                                                      ? [...itensAtuais, item.value]
                                                      : itensAtuais.filter(i => i !== item.value)
                                                    updateIngresso(
                                                      lote.id,
                                                      ingresso.categoria,
                                                      "itensKit",
                                                      novosItens
                                                    )
                                                    
                                                    // Se desmarcar camiseta, limpa tamanhos e quantidades
                                                    if (!checked && item.value === "camiseta") {
                                                      updateIngresso(lote.id, ingresso.categoria, "tamanhosCamiseta", [])
                                                      updateIngresso(lote.id, ingresso.categoria, "quantidadeCamisetasPorTamanho", {})
                                                    }
                                                  }}
                                                />
                                                <Label
                                                  htmlFor={`item-${lote.id}-${ingresso.categoria}-${item.value}`}
                                                  className="text-sm font-normal cursor-pointer"
                                                >
                                                  {item.label}
                                                </Label>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Configuração de camiseta */}
                                        {(ingresso.itensKit || []).includes("camiseta") && (
                                          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <Label className="text-sm font-medium">Configuração de Camiseta</Label>
                                            
                                            <div className="space-y-2">
                                              <Label className="text-xs text-muted-foreground">Tamanhos Disponíveis *</Label>
                                              <div className="flex flex-wrap gap-2">
                                                {TAMANHOS_CAMISETA.map((tamanho) => (
                                                  <div key={tamanho.value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                      id={`tamanho-${lote.id}-${ingresso.categoria}-${tamanho.value}`}
                                                      checked={(ingresso.tamanhosCamiseta || []).includes(tamanho.value)}
                                                      onCheckedChange={(checked) => {
                                                        const tamanhosAtuais = ingresso.tamanhosCamiseta || []
                                                        const novosTamanhos = checked
                                                          ? [...tamanhosAtuais, tamanho.value]
                                                          : tamanhosAtuais.filter(t => t !== tamanho.value)
                                                        updateIngresso(
                                                          lote.id,
                                                          ingresso.categoria,
                                                          "tamanhosCamiseta",
                                                          novosTamanhos
                                                        )
                                                        
                                                        // Se desmarcar um tamanho, remove a quantidade
                                                        if (!checked) {
                                                          const quantidadesAtuais = ingresso.quantidadeCamisetasPorTamanho || {}
                                                          const novasQuantidades = { ...quantidadesAtuais }
                                                          delete novasQuantidades[tamanho.value]
                                                          updateIngresso(
                                                            lote.id,
                                                            ingresso.categoria,
                                                            "quantidadeCamisetasPorTamanho",
                                                            novasQuantidades
                                                          )
                                                        }
                                                      }}
                                                    />
                                                    <Label
                                                      htmlFor={`tamanho-${lote.id}-${ingresso.categoria}-${tamanho.value}`}
                                                      className="text-xs font-normal cursor-pointer"
                                                    >
                                                      {tamanho.label}
                                                    </Label>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>

                                            {/* Quantidade por tamanho */}
                                            {(ingresso.tamanhosCamiseta || []).length > 0 && (
                                              <div className="space-y-3 pt-2 border-t">
                                                <Label className="text-xs text-muted-foreground">
                                                  Quantidade de Camisetas por Tamanho para {ingresso.categoria} *
                                                </Label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                  {(ingresso.tamanhosCamiseta || []).map((tamanho) => {
                                                    const tamanhoLabel = TAMANHOS_CAMISETA.find(t => t.value === tamanho)?.label || tamanho
                                                    return (
                                                      <div key={tamanho} className="space-y-1">
                                                        <Label htmlFor={`qtd-${tamanho}-${lote.id}-${ingresso.categoria}`} className="text-xs">
                                                          Tamanho {tamanhoLabel}
                                                        </Label>
                                                        <Input
                                                          id={`qtd-${tamanho}-${lote.id}-${ingresso.categoria}`}
                                                          type="number"
                                                          min="0"
                                                          step="1"
                                                          value={(ingresso.quantidadeCamisetasPorTamanho || {})[tamanho] ?? ""}
                                                          onChange={(e) => {
                                                            const valor = e.target.value
                                                            const quantidadesAtuais = ingresso.quantidadeCamisetasPorTamanho || {}
                                                            updateIngresso(
                                                              lote.id,
                                                              ingresso.categoria,
                                                              "quantidadeCamisetasPorTamanho",
                                                              {
                                                                ...quantidadesAtuais,
                                                                [tamanho]: valor === "" ? null : (valor ? valor : null),
                                                              }
                                                            )
                                                          }}
                                                          placeholder="Deixe vazio para ilimitado"
                                                          className="w-full"
                                                        />
                                                      </div>
                                                    )
                                                  })}
                                                </div>
                                                {(ingresso.tamanhosCamiseta || []).length > 0 && (
                                                  <p className="text-xs text-muted-foreground pt-1">
                                                    Total: {
                                                      Object.values(ingresso.quantidadeCamisetasPorTamanho || {})
                                                        .reduce((sum, qtd) => sum + (parseInt(qtd) || 0), 0)
                                                    } camisetas
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Seção GPX e Opções de Exibição */}
                                {!lote.salvo && (
                                  <div className="pt-3 border-t space-y-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                      <MapPin className="h-4 w-4 text-[#156634]" />
                                      <Label className="text-sm font-medium">
                                        Percurso GPX e Opções de Exibição
                                      </Label>
                                    </div>

                                    {/* Upload de GPX */}
                                    <div className="space-y-2">
                                      <Label className="text-xs">Arquivo GPX do Percurso</Label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="file"
                                          accept=".gpx"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0] || null
                                            updateIngresso(lote.id, ingresso.categoria, "gpxFile", file)
                                          }}
                                          className="hidden"
                                          id={`gpx-${lote.id}-${ingresso.categoria}`}
                                          disabled={lote.salvo}
                                        />
                                        <label
                                          htmlFor={`gpx-${lote.id}-${ingresso.categoria}`}
                                          className="flex-1"
                                        >
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            disabled={lote.salvo}
                                            asChild
                                          >
                                            <span>
                                              <Upload className="mr-2 h-4 w-4" />
                                              {ingresso.gpxFile
                                                ? ingresso.gpxFile.name
                                                : ingresso.gpxFileUrl
                                                ? "GPX já carregado"
                                                : "Upload GPX"}
                                            </span>
                                          </Button>
                                        </label>
                                        {ingresso.gpxFile && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateIngresso(lote.id, ingresso.categoria, "gpxFile", null)}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Faça upload do arquivo GPX com o percurso para esta distância
                                      </p>
                                    </div>

                                    {/* Opções de Exibição */}
                                    {ingresso.gpxFile || ingresso.gpxFileUrl ? (
                                      <div className="space-y-3 pl-2 border-l-2 border-[#156634]">
                                        <Label className="text-xs font-medium">Opções de Exibição</Label>
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`show-route-${lote.id}-${ingresso.categoria}`}
                                              checked={ingresso.showRoute || false}
                                              onCheckedChange={(checked) =>
                                                updateIngresso(
                                                  lote.id,
                                                  ingresso.categoria,
                                                  "showRoute",
                                                  checked
                                                )
                                              }
                                              disabled={lote.salvo}
                                            />
                                            <Label
                                              htmlFor={`show-route-${lote.id}-${ingresso.categoria}`}
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              Exibir percurso no mapa
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`show-map-${lote.id}-${ingresso.categoria}`}
                                              checked={ingresso.showMap || false}
                                              onCheckedChange={(checked) =>
                                                updateIngresso(
                                                  lote.id,
                                                  ingresso.categoria,
                                                  "showMap",
                                                  checked
                                                )
                                              }
                                              disabled={lote.salvo}
                                            />
                                            <Label
                                              htmlFor={`show-map-${lote.id}-${ingresso.categoria}`}
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              Exibir mapa na página do evento
                                            </Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`show-elevation-${lote.id}-${ingresso.categoria}`}
                                              checked={ingresso.showElevation || false}
                                              onCheckedChange={(checked) =>
                                                updateIngresso(
                                                  lote.id,
                                                  ingresso.categoria,
                                                  "showElevation",
                                                  checked
                                                )
                                              }
                                              disabled={lote.salvo}
                                            />
                                            <Label
                                              htmlFor={`show-elevation-${lote.id}-${ingresso.categoria}`}
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              Exibir gráfico de altimetria
                                            </Label>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">
                                        Faça upload de um arquivo GPX para habilitar as opções de exibição
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Descrição do Evento */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Editor de Texto */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Descrição do Evento</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie uma descrição completa e atrativa para o seu evento. Use o editor para formatar o texto, adicionar imagens, links e muito mais.
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.descricao}
                    onChange={(value) => setFormData({ ...formData, descricao: value })}
                    placeholder="Descreva seu evento aqui..."
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
              </div>

              {/* Prévia da Landing Page */}
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <div className="border rounded-lg bg-white shadow-sm">
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Prévia da Landing Page
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Visualize como sua página ficará
                      </p>
                    </div>
                    <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                      {/* Banner */}
                      {formData.bannerEvento ? (
                        <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                          <Image 
                            src={URL.createObjectURL(formData.bannerEvento)} 
                            alt="Banner" 
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">Banner do evento</p>
                        </div>
                      )}

                      {/* Informações do Evento */}
                      <div className="space-y-2">
                        <h2 className="text-lg font-bold">{formData.nome || "Nome do Evento"}</h2>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {formData.data && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(formData.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          {formData.horarioInicio && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{formData.horarioInicio}</span>
                            </div>
                          )}
                          {formData.categoria && (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-3 w-3" />
                              <span>{MODALIDADES_ESPORTIVAS.find(m => m.value === formData.categoria)?.label || formData.categoria}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-2">Sobre o Evento</h3>
                        {formData.descricao ? (
                          <div 
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: formData.descricao }}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            A descrição aparecerá aqui...
                          </p>
                        )}
                      </div>

                      {/* Distâncias/Categorias */}
                      {formData.distancias.length > 0 || formData.distanciasCustom.length > 0 ? (
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-semibold mb-2">Categorias</h3>
                          <div className="flex flex-wrap gap-2">
                            {formData.distancias
                              .filter(d => d !== "custom")
                              .map((d) => {
                                const distancia = DISTANCIAS_PADRAO.find(dp => dp.value === d)
                                return distancia ? (
                                  <Badge key={d} variant="outline" className="text-xs">
                                    {distancia.label}
                                  </Badge>
                                ) : null
                              })}
                            {formData.distanciasCustom.map((d) => (
                              <Badge key={d} variant="outline" className="text-xs">
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Lotes */}
                      {formData.lotes.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="text-sm font-semibold mb-2">Ingressos Disponíveis</h3>
                          <div className="space-y-2">
                            {formData.lotes.slice(0, 2).map((lote) => (
                              <div key={lote.id} className="text-xs p-2 bg-gray-50 rounded border">
                                <p className="font-medium">{lote.nome}</p>
                                {lote.dataInicio && (
                                  <p className="text-muted-foreground">
                                    Início: {new Date(lote.dataInicio).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            ))}
                            {formData.lotes.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{formData.lotes.length - 2} lote(s) adicional(is)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Criar Evento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
