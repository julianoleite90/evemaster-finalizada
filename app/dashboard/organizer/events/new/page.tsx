"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createEvent } from "@/lib/supabase/events"
import { uploadEventBanner, uploadEventGPX, uploadTicketGPX } from "@/lib/supabase/storage"
import { createClient } from "@/lib/supabase/client"
import { eventLogger as logger } from "@/lib/utils/logger"
import { ModernStepper, Step1EventInfo, Step2Batches, Step3Description } from "./components"
import { MODALIDADES_ESPORTIVAS, DISTANCIAS_PADRAO } from "./constants"
import type { NewEventFormData, Lote } from "./types"

// Estado inicial do formulário
const INITIAL_FORM_DATA: NewEventFormData = {
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

export default function NewEventPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewEventFormData>(INITIAL_FORM_DATA)

  // Handler para upload de arquivos
  const handleFileUpload = (field: "bannerEvento" | "gpxStrava", file: File | null) => {
    setFormData({ ...formData, [field]: file })
    if (file) {
      toast.success(`${field === "bannerEvento" ? "Banner" : "GPX"} carregado!`)
    }
  }

  // Obter categorias disponíveis baseado na modalidade
  const getCategoriasDisponiveis = () => {
    if (formData.categoria === "corrida") {
      const distanciasPadrao = formData.distancias
        .filter(d => d !== "custom")
        .map(d => DISTANCIAS_PADRAO.find(dp => dp.value === d)?.label || d)
      return [...distanciasPadrao, ...formData.distanciasCustom]
    }
    return [formData.categoria]
  }

  // Validação por step
  const validateStep = (step: number): boolean => {
    if (step === 1) {
        if (!formData.nome || !formData.data || !formData.horarioInicio || !formData.categoria) {
          toast.error("Preencha todos os campos obrigatórios")
        return false
        }
        if (formData.categoria === "corrida" && formData.distancias.length === 0) {
        toast.error("Selecione pelo menos uma distância")
        return false
        }
      }
    if (step === 2) {
        if (formData.lotes.length === 0) {
          toast.error("Crie pelo menos um lote")
        return false
        }
      const lotesNaoSalvos = formData.lotes.filter(l => !l.salvo)
        if (lotesNaoSalvos.length > 0) {
          toast.error("Salve todos os lotes antes de continuar")
        return false
      }
    }
    return true
  }

  // Navegar para próximo step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  // Navegar para step anterior
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Submeter formulário
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        toast.error("Você precisa estar logado")
        router.push("/login")
        return
      }

      // Buscar organizador
      let organizer: { id: string } | null = null
      const { data: org } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (org) {
        organizer = org
      } else {
        // Tentar criar organizador
        const { data: newOrg } = await supabase
          .from("organizers")
          .insert({
            user_id: user.id,
            company_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Organizador",
            legal_responsible: user.user_metadata?.full_name || "Responsável",
          })
          .select("id")
          .single()

        if (newOrg) organizer = newOrg
      }

      if (!organizer) {
        toast.error("Perfil de organizador não encontrado")
        return
      }

      // Preparar lotes
      const lotes = formData.lotes.map((lote, index) => {
        let dataFim = lote.dataInicio
        if (index < formData.lotes.length - 1) {
          dataFim = formData.lotes[index + 1].dataInicio
        } else {
          const data = new Date(lote.dataInicio)
          data.setDate(data.getDate() + 15)
          dataFim = data.toISOString().split("T")[0]
        }

        return {
          name: lote.nome,
          start_date: lote.dataInicio,
          start_time: lote.horaInicio,
          end_date: dataFim,
          total_quantity: lote.quantidadeTotal ? parseInt(lote.quantidadeTotal) : null,
          tickets: lote.ingressos.map(ing => {
            const shirtQuantities = Object.entries(ing.quantidadeCamisetasPorTamanho || {}).reduce<Record<string, number>>(
              (acc, [size, value]) => {
                const parsed = parseInt(value, 10)
                if (!Number.isNaN(parsed)) acc[size] = parsed
                return acc
              },
              {}
            )

            return {
              category: ing.categoria,
              price: ing.gratuito ? 0 : parseFloat(ing.valor || "0"),
              is_free: ing.gratuito,
              quantity: ing.quantidade,
              has_kit: ing.possuiKit,
              kit_items: ing.itensKit || [],
              shirt_sizes: ing.tamanhosCamiseta || [],
              shirt_quantities: shirtQuantities,
            }
          }),
        }
      })

      // Preparar distâncias
      const distanciasPadrao = formData.distancias
        .filter(d => d !== "custom")
        .map(d => DISTANCIAS_PADRAO.find(dp => dp.value === d)?.label || d)

      // Preparar endereço
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

      // Criar evento
      const event = await createEvent({
        organizer_id: organizer.id,
        name: formData.nome,
        description: formData.descricao,
        category: formData.categoria,
        language: formData.language,
        event_date: formData.data,
        start_time: formData.horarioInicio,
        end_time: formData.horarioFim || undefined,
        location: localCompleto || "Local a definir",
        difficulty_level: formData.difficulty_level || undefined,
        major_access: formData.major_access,
        major_access_type: formData.major_access ? formData.major_access_type : undefined,
        race_type: formData.race_type || undefined,
        address: enderecoCompleto || "Endereço a definir",
        city: formData.cidade,
        state: formData.estado,
        zip_code: formData.cep,
        distances: distanciasPadrao,
        custom_distances: formData.distanciasCustom,
        quantidade_total: formData.quantidade_total ? parseInt(formData.quantidade_total) : undefined,
        lotes,
        settings: {
          payment_pix_enabled: formData.meiosPagamento.pix,
          payment_credit_card_enabled: formData.meiosPagamento.cartaoCredito,
          payment_boleto_enabled: formData.meiosPagamento.boleto,
          payment_max_installments: formData.meiosPagamento.parcelamento.maxParcelas,
          payment_assume_interest: formData.meiosPagamento.parcelamento.assumirJuros,
        },
      })

      // Upload do banner
      if (formData.bannerEvento && event.id) {
        try {
          const bannerUrl = await uploadEventBanner(formData.bannerEvento, event.id)
          await supabase
            .from("events")
            .update({ banner_url: bannerUrl })
            .eq("id", event.id)
          toast.success("Banner enviado!")
        } catch (error) {
          logger.error("Erro ao fazer upload do banner:", error)
        }
      }

      // Upload do GPX do evento
      if (formData.gpxStrava && event.id) {
        try {
          const gpxUrl = await uploadEventGPX(formData.gpxStrava, event.id)
          await supabase
            .from("events")
            .update({ gpx_file_url: gpxUrl })
            .eq("id", event.id)
        } catch (error) {
          logger.error("Erro ao fazer upload do GPX:", error)
        }
      }

      // Upload GPX dos tickets
      if (event.id) {
        const { data: ticketBatches } = await supabase
            .from("ticket_batches")
          .select(`id, name, tickets(id, category)`)
            .eq("event_id", event.id)

        if (ticketBatches) {
            for (const lote of formData.lotes) {
              for (const ingresso of lote.ingressos) {
                if (ingresso.gpxFile) {
                  const batch = ticketBatches.find((b: any) => b.name === lote.nome)
                  if (batch && (batch as any).tickets) {
                    const ticket = ((batch as any).tickets as any[]).find(
                      (t: any) => t.category === ingresso.categoria
                    )
                    if (ticket) {
                      try {
                        const gpxUrl = await uploadTicketGPX(ingresso.gpxFile, event.id, ticket.id)
                      await supabase
                          .from("tickets")
                          .update({
                            gpx_file_url: gpxUrl,
                          show_route: ingresso.showRoute,
                          show_map: ingresso.showMap,
                          show_elevation: ingresso.showElevation,
                          })
                          .eq("id", ticket.id)
                      } catch (error) {
                      logger.error("Erro ao fazer upload do GPX:", error)
                      }
                    }
                  }
                }
              }
            }
        }
      }

      toast.success("Evento criado com sucesso!")
      const redirectUrl = event.slug ? `/evento/${event.slug}` : `/evento/${event.id}`
      router.push(redirectUrl)
    } catch (error: any) {
      logger.error("Erro ao criar evento:", error)
      toast.error(error.message || "Erro ao criar evento")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Evento</h1>
          <p className="text-muted-foreground">
            Crie um novo evento
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div>
        {/* Stepper */}
        <div className="mb-8">
          <ModernStepper 
            currentStep={currentStep} 
            onStepClick={(step) => {
              if (step < currentStep) setCurrentStep(step)
            }}
          />
                                </div>

        {/* Conteúdo dos Steps */}
        <div className="mb-8">
          {currentStep === 1 && (
            <Step1EventInfo
              formData={formData}
              setFormData={setFormData}
              onFileUpload={handleFileUpload}
            />
          )}

          {currentStep === 2 && (
            <Step2Batches
              formData={formData}
              setFormData={setFormData}
              getCategoriasDisponiveis={getCategoriasDisponiveis}
            />
          )}

          {currentStep === 3 && (
            <Step3Description
              formData={formData}
              setFormData={setFormData}
            />
                                    )}
                                  </div>

        {/* Navegação */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">{currentStep}</span>
              <span>de</span>
              <span className="font-medium text-gray-900">3</span>
            </div>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-[#156634] hover:bg-[#1a7a3e]"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#156634] hover:bg-[#1a7a3e]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                Criar Evento
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}