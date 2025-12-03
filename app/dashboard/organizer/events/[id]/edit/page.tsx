"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { eventLogger as logger } from "@/lib/utils/logger"
import { ModernStepper, Step1EventInfo, Step2Batches, Step3Description } from "../../new/components"
import { DISTANCIAS_PADRAO } from "../../new/constants"
import type { NewEventFormData, Lote } from "../../new/types"
import { uploadEventBanner, uploadEventGPX, uploadTicketGPX } from "@/lib/supabase/storage"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewEventFormData>({
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
  })

  // Carregar dados do evento
  useEffect(() => {
    async function loadEvent() {
      try {
        const supabase = createClient()
        
        // Buscar evento
        const { data: event, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single()
        
        if (error) throw error
        if (!event) throw new Error("Evento não encontrado")

        // Buscar lotes e tickets
        const { data: batches } = await supabase
          .from("ticket_batches")
          .select(`
            *,
            tickets (*)
          `)
          .eq("event_id", eventId)
          .order("created_at", { ascending: true })

        // Converter dados do evento para o formato do formulário
        const lotes: Lote[] = (batches || []).map((batch: any) => ({
          id: batch.id,
          nome: batch.name,
          dataInicio: batch.start_date?.split("T")[0] || "",
          horaInicio: batch.start_time || "",
          quantidadeTotal: (batch.total_quantity || 0).toString(),
          salvo: true,
          ingressos: (batch.tickets || []).map((ticket: any) => ({
            categoria: ticket.category,
            valor: ticket.price?.toString() || "0",
            gratuito: ticket.is_free || false,
            quantidade: ticket.quantity || null,
            possuiKit: ticket.has_kit || false,
            itensKit: ticket.kit_items || [],
            tamanhosCamiseta: ticket.shirt_sizes || [],
            quantidadeCamisetasPorTamanho: {},
            gpxFile: null,
            gpxFileUrl: ticket.gpx_file_url || null,
            showRoute: ticket.show_route || false,
            showMap: ticket.show_map || false,
            showElevation: ticket.show_elevation || false,
          })),
        }))

        // Extrair distâncias dos tickets
        const allCategories = lotes.flatMap(l => l.ingressos.map(i => i.categoria))
        const distancias: string[] = []
        const distanciasCustom: string[] = []
        
        allCategories.forEach(cat => {
          const found = DISTANCIAS_PADRAO.find(d => d.label === cat)
          if (found) {
            if (!distancias.includes(found.value)) {
              distancias.push(found.value)
            }
          } else if (cat && !distanciasCustom.includes(cat)) {
            distanciasCustom.push(cat)
          }
        })

        setFormData({
          nome: event.name || "",
          data: event.event_date || "",
          horarioInicio: event.start_time || "",
          horarioFim: event.end_time || "",
          categoria: event.category || "",
          language: event.language || "pt",
          modalidades: [],
          distancias: distancias,
          distanciasCustom: distanciasCustom,
          difficulty_level: event.difficulty_level || "",
          major_access: event.major_access || false,
          major_access_type: event.major_access_type || "",
          race_type: event.race_type || "",
          bannerEvento: null,
          gpxStrava: null,
          pais: "Brasil",
          cep: event.zip_code || "",
          endereco: event.address || "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: event.city || "",
          estado: event.state || "",
          quantidade_total: "",
          lotes,
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
          descricao: event.description || "",
        })
      } catch (error) {
        logger.error("Erro ao carregar evento:", error)
        toast.error("Erro ao carregar evento")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  // Handler para upload de arquivos
  const handleFileUpload = (field: "bannerEvento" | "gpxStrava", file: File | null) => {
    setFormData({ ...formData, [field]: file })
    if (file) {
      toast.success(`${field === "bannerEvento" ? "Banner" : "GPX"} carregado!`)
    }
  }

  // Obter categorias disponíveis
  const getCategoriasDisponiveis = () => {
    if (formData.categoria === "corrida") {
      const distanciasPadrao = formData.distancias
        .filter(d => d !== "custom")
        .map(d => DISTANCIAS_PADRAO.find(dp => dp.value === d)?.label || d)
      return [...distanciasPadrao, ...formData.distanciasCustom]
    }
    return [formData.categoria]
  }

  // Navegação
  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Salvar evento
  const handleSave = async () => {
    try {
      setSubmitting(true)
      const supabase = createClient()

      // Atualizar evento
      const { error: eventError } = await supabase
        .from("events")
        .update({
          name: formData.nome,
          description: formData.descricao,
          category: formData.categoria,
          language: formData.language,
          event_date: formData.data,
          start_time: formData.horarioInicio,
          end_time: formData.horarioFim || null,
          difficulty_level: formData.difficulty_level || null,
          major_access: formData.major_access,
          major_access_type: formData.major_access ? formData.major_access_type : null,
          race_type: formData.race_type || null,
          city: formData.cidade,
          state: formData.estado,
          zip_code: formData.cep,
          address: formData.endereco,
        })
        .eq("id", eventId)

      if (eventError) throw eventError

      // Upload do banner se houver novo
      if (formData.bannerEvento) {
        try {
          const bannerUrl = await uploadEventBanner(formData.bannerEvento, eventId)
          await supabase
            .from("events")
            .update({ banner_url: bannerUrl })
            .eq("id", eventId)
        } catch (error) {
          logger.error("Erro ao fazer upload do banner:", error)
        }
      }

      // Atualizar lotes e tickets
      for (const lote of formData.lotes) {
        if (lote.id && !lote.id.startsWith("temp_")) {
          // Atualizar lote existente
          await supabase
            .from("ticket_batches")
            .update({
              name: lote.nome,
              start_date: lote.dataInicio,
              start_time: lote.horaInicio,
              total_quantity: parseInt(lote.quantidadeTotal) || null,
            })
            .eq("id", lote.id)

          // Atualizar tickets do lote
          for (const ingresso of lote.ingressos) {
            // Os tickets serão gerenciados pela página de settings
          }
        }
      }

      toast.success("Evento atualizado com sucesso!")
      router.push(`/dashboard/organizer/events/${eventId}/settings`)
    } catch (error: any) {
      logger.error("Erro ao salvar evento:", error)
      toast.error(error.message || "Erro ao salvar evento")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Evento</h1>
          <p className="text-muted-foreground">
            {formData.nome || "Carregando..."}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={submitting}
          className="bg-[#156634] hover:bg-[#1a7a3e]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <div>
        {/* Stepper */}
        <div className="mb-8">
          <ModernStepper 
            currentStep={currentStep} 
            onStepClick={(step) => setCurrentStep(step)}
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
                onClick={handleSave}
                disabled={submitting}
                className="bg-[#156634] hover:bg-[#1a7a3e]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Evento
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
