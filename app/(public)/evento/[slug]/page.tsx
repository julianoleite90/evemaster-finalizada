"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getEventBySlug } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Calendar, MapPin, Clock, Users, Share2, Heart, Minus, Plus, Trophy, Package, Building2, Mail, Phone, Globe, Route, Mountain, Activity } from "lucide-react"
import dynamic from "next/dynamic"

const GPXMapViewer = dynamic(() => import("@/components/event/GPXMapViewer"), { ssr: false })
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import Link from "next/link"

export default function EventoLandingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [eventData, setEventData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({})
  const [language, setLanguage] = useState<"pt" | "es" | "en">("pt")
  const translations = {
    pt: {
      eventInfo: "Informações do Evento",
      description: "Sobre o Evento",
      ticketsTitle: "Inscreva-se",
      changeBatch: "Alterar Lote",
      batchLabel: "Lote",
      quantity: "Quantidade",
      selectTickets: "Selecione os ingressos",
      continue: "Continuar",
      termsPhrase: "Ambiente 100% seguro",
      terms: "termos de uso",
      organizer: "Organizador",
      email: "Email",
      phone: "Telefone",
      noOrganizer: "Informações do organizador não disponíveis.",
      includeKit: "Inclui Kit",
      locationTitle: "Local do Evento",
      dataEvento: "Data do Evento",
      horarioInicio: "Horário de Início",
      location: "Localização",
      available: "disponíveis",
      unlimited: "Ilimitado",
      free: "Gratuito",
      serviceFee: "Taxa de serviço",
      totalLabel: "Total",
      ticketsSoon: "Ingressos em breve",
      ticketSingular: "ingresso",
      ticketPlural: "ingressos",
      languageLabel: "Idioma",
      footerTerms: "Termos de Uso",
      footerPolicy: "Política de Privacidade",
      footerPayment: "Meios de Pagamento Aceitos",
    },
    es: {
      eventInfo: "Información del Evento",
      description: "Sobre el Evento",
      ticketsTitle: "Inscríbete",
      changeBatch: "Cambiar Lote",
      batchLabel: "Lote",
      quantity: "Cantidad",
      selectTickets: "Selecciona las entradas",
      continue: "Continuar",
      termsPhrase: "Ambiente 100% seguro",
      terms: "términos de uso",
      organizer: "Organizador",
      email: "Correo",
      phone: "Teléfono",
      noOrganizer: "Información del organizador no disponible.",
      includeKit: "Incluye Kit",
      locationTitle: "Ubicación del Evento",
      dataEvento: "Fecha del Evento",
      horarioInicio: "Horario de Inicio",
      location: "Ubicación",
      available: "disponibles",
      unlimited: "Ilimitado",
      free: "Gratuito",
      serviceFee: "Costo de servicio",
      totalLabel: "Total",
      ticketsSoon: "Entradas próximamente",
      ticketSingular: "entrada",
      ticketPlural: "entradas",
      languageLabel: "Idioma",
      footerTerms: "Términos de Uso",
      footerPolicy: "Política de Privacidad",
      footerPayment: "Medios de Pago Aceptados",
    },
    en: {
      eventInfo: "Event Information",
      description: "About the Event",
      ticketsTitle: "Sign Up",
      changeBatch: "Change Batch",
      batchLabel: "Batch",
      quantity: "Quantity",
      selectTickets: "Select tickets",
      continue: "Continue",
      termsPhrase: "100% secure environment",
      terms: "terms of use",
      organizer: "Organizer",
      email: "Email",
      phone: "Phone",
      noOrganizer: "Organizer information not available.",
      includeKit: "Includes Kit",
      locationTitle: "Event Location",
      dataEvento: "Event Date",
      horarioInicio: "Start Time",
      location: "Location",
      available: "available",
      unlimited: "Unlimited",
      free: "Free",
      serviceFee: "Service fee",
      totalLabel: "Total",
      ticketsSoon: "Tickets coming soon",
      ticketSingular: "ticket",
      ticketPlural: "tickets",
      languageLabel: "Language",
      footerTerms: "Terms of Use",
      footerPolicy: "Privacy Policy",
      footerPayment: "Accepted Payment Methods",
    },
  }

  // Função para formatar data sem problemas de timezone
  const formatEventDate = (dateString: string, locale: string = "pt-BR") => {
    if (!dateString) return ""
    // Parse a data no formato YYYY-MM-DD como data local (não UTC)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    
    const localeMap: { [key: string]: string } = {
      "pt": "pt-BR",
      "es": "es-AR",
      "en": "en-US"
    }
    
    return date.toLocaleDateString(localeMap[locale] || locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return
      
      try {
        setLoading(true)
        setError(null)
        const event = await getEventBySlug(slug)

        if (!event) {
          setError("Evento não encontrado")
          setLoading(false)
          return
        }
        
        // Garantir que o email esteja presente no organizador antes de setar o estado
        if (event.organizer) {
          console.log("🔍 Organizador recebido no componente:", {
            company_name: event.organizer.company_name,
            user_id: event.organizer.user_id,
            company_email: event.organizer.company_email,
            email: event.organizer.email
          })
          
          // Se não tiver email, tentar buscar novamente APENAS da tabela users
          if (!event.organizer.company_email && !event.organizer.email && event.organizer.user_id) {
            console.log("⚠️ Organizador sem email, tentando buscar novamente do user_id:", event.organizer.user_id)
            const supabase = createClient()
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("email")
              .eq("id", event.organizer.user_id)
              .single()
            
            console.log("📧 Resultado busca email no componente:", { user, error: userError?.message })
            
            // VALIDAÇÃO CRÍTICA: Não usar email errado
            if (user && user.email === "julianodesouzaleite@gmail.com") {
              console.log("❌ [CRÍTICO] Email errado encontrado! O user_id do organizador está apontando para o usuário errado.")
              console.log("❌ [CRÍTICO] user_id do organizador:", event.organizer.user_id)
              console.log("❌ [CRÍTICO] Email encontrado (ERRADO):", user.email)
              console.log("❌ [CRÍTICO] Email esperado: fabianobraun@gmail.com")
              console.log("❌ [CRÍTICO] NÃO vamos adicionar este email ao organizador")
              // Não adicionar o email errado
            } else if (user && user.email) {
              event.organizer.email = user.email
              event.organizer.company_email = user.email
              console.log("✅ Email adicionado no componente:", user.email)
            } else {
              console.log("⚠️ Email não encontrado para user_id:", event.organizer.user_id, "Erro:", userError?.message)
            }
          }
          
          // Criar uma cópia do objeto para garantir reatividade
          event.organizer = { ...event.organizer }
          console.log("📋 Organizador após processamento:", {
            company_email: event.organizer.company_email,
            email: event.organizer.email
          })
        }
        
        setEventData({ ...event })
        
        // Debug: verificar dados do organizador
        if (event.organizer) {
          console.log("📋 Dados do organizador (no componente):", {
            company_name: event.organizer.company_name,
            full_name: event.organizer.full_name,
            company_cnpj: event.organizer.company_cnpj,
            company_email: event.organizer.company_email,
            email: event.organizer.email,
            company_phone: event.organizer.company_phone,
            user_id: event.organizer.user_id,
            organizer_completo: event.organizer
          })
        }
        
        // Selecionar primeiro lote ativo por padrão
        if (event.ticket_batches && event.ticket_batches.length > 0) {
          setSelectedBatch(event.ticket_batches[0])
        }
      } catch (error: any) {
        console.error("Erro ao buscar evento:", error)
        setError(error.message || "Erro ao carregar evento")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [slug])

  // Metadata é gerado no layout.tsx (server-side)
  // Apenas atualizamos o título da página para melhor UX
  useEffect(() => {
    if (eventData) {
      document.title = `${eventData.name} | EveMaster plataforma para eventos esportivos`
    }
  }, [eventData])

  const updateTicketQuantity = (ticketId: string, change: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketId] || 0
      const ticket = selectedBatch?.tickets?.find((t: any) => t.id === ticketId)
      
      // Se o ticket tem quantidade ilimitada (null, 0 ou undefined), permitir qualquer quantidade
      const isUnlimited = !ticket || ticket.quantity === null || ticket.quantity === undefined || ticket.quantity === 0
      
      if (!isUnlimited) {
        // Se tem limite, validar
        const maxQuantity = ticket.quantity || 0
        const newValue = Math.max(0, Math.min(maxQuantity, current + change))
        if (newValue === 0) {
          const { [ticketId]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [ticketId]: newValue }
      } else {
        // Ilimitado: permitir qualquer quantidade positiva
        const newValue = Math.max(0, current + change)
        if (newValue === 0) {
          const { [ticketId]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [ticketId]: newValue }
      }
    })
  }

  const getTotalPrice = () => {
    if (!selectedBatch) return 0
    let total = 0
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = selectedBatch.tickets?.find((t: any) => t.id === ticketId)
      if (ticket && !ticket.is_free) {
        total += ticket.price * quantity
      }
    })
    return total
  }

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  }

  const isEventFree = () => {
    if (!selectedBatch || !selectedBatch.tickets) return false
    return selectedBatch.tickets.every((ticket: any) => ticket.is_free)
  }

  const handleCheckout = () => {
    if (getTotalTickets() === 0) return
    
    const ticketsParam = encodeURIComponent(JSON.stringify(
      Object.entries(selectedTickets).reduce((acc, [ticketId, qty]) => {
        const ticket = selectedBatch.tickets?.find((t: any) => t.id === ticketId)
        if (ticket) {
          acc[ticket.category] = qty
        }
        return acc
      }, {} as any)
    ))
    
    router.push(`/inscricao/${eventData.id}?lote=${selectedBatch.id}&ingressos=${ticketsParam}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#156634] mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Voltar para a página inicial</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative w-full h-[380px] md:h-[550px] bg-gradient-to-r from-[#156634] to-[#1a7a3e]">
        {eventData.banner_url ? (
          <Image
            src={eventData.banner_url}
            alt={eventData.name}
            fill
            className="object-cover object-[center_60%] md:object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
              {eventData.name}
            </h1>
          </div>
        )}
      </div>
              
      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 -mt-10 md:-mt-16 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Informações do Evento */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {eventData.name}
                  </h1>
                  {eventData.category && (
                    <Badge className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
                      <Trophy className="h-3 w-3 mr-1" />
                      {eventData.category.charAt(0).toUpperCase() + eventData.category.slice(1)}
                    </Badge>
                  )}
                </div>

                {/* Informações Principais - Layout Melhorado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className="flex items-start gap-2.5 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-[#156634] rounded-lg flex items-center justify-center shadow-sm">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wide">{translations[language].dataEvento}</p>
                      <p className="font-bold text-xs md:text-sm text-gray-900 leading-tight">
                        {eventData.event_date && formatEventDate(eventData.event_date, language)}
                      </p>
                    </div>
                  </div>

                  {eventData.start_time && (
                    <div className="flex items-start gap-2.5 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-[#156634] rounded-lg flex items-center justify-center shadow-sm">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wide">{translations[language].horarioInicio}</p>
                        <p className="font-bold text-xs md:text-sm text-gray-900 leading-tight">{eventData.start_time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors md:col-span-2 border border-gray-200">
                    <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-[#156634] rounded-lg flex items-center justify-center shadow-sm">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wide">{translations[language].location}</p>
                      <p className="font-bold text-xs md:text-sm text-gray-900 leading-snug mb-1">
                        {eventData.location}
                        {eventData.address && ` - ${eventData.address}`}
                      </p>
                      {eventData.city && eventData.state && (
                        <p className="text-[10px] md:text-xs text-gray-600 mt-0.5">
                          {eventData.city} - {eventData.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              
                <Separator className="my-8" />

                {/* Descrição do Evento */}
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{translations[language].description}</h2>
                  {eventData.description ? (
                    <div 
                      className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-ul:mb-4 prose-ol:text-gray-700 prose-ol:mb-4 prose-li:mb-2 prose-a:text-[#156634] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
                      dangerouslySetInnerHTML={{ __html: eventData.description }}
                    />
                  ) : (
                    <p className="text-gray-600 text-base leading-relaxed">
                      {language === "es"
                        ? "Información detallada sobre el evento próximamente."
                        : language === "en"
                        ? "Detailed event information coming soon."
                        : "Informações detalhadas sobre o evento em breve."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bloco: Mapas GPX (Percurso e Altimetria) - Apenas para ingressos selecionados */}
            {(() => {
              // Buscar ingressos selecionados que têm GPX e mapa habilitado
              const selectedTicketsWithGPX: any[] = []
              
              if (selectedBatch && selectedTickets) {
                Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
                  if (quantity > 0) {
                    const ticket = selectedBatch.tickets?.find((t: any) => t.id === ticketId)
                    if (ticket && ticket.gpx_file_url && ticket.show_map) {
                      selectedTicketsWithGPX.push(ticket)
                    }
                  }
                })
              }
              
              if (selectedTicketsWithGPX.length === 0) return null
              
              return (
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Route className="h-6 w-6 text-[#156634]" />
                      Percurso e Altimetria
                    </h2>
                    
                    <div className="space-y-6">
                      {selectedTicketsWithGPX.map((ticket: any, index: number) => (
                        <div key={ticket.id || index} className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Trophy className="h-5 w-5 text-[#156634]" />
                            <h3 className="text-xl font-semibold text-gray-900">
                              {ticket.category}
                            </h3>
                          </div>
                          
                          {/* Mapa com Percurso e Altimetria Integrados */}
                          {(ticket.show_route || ticket.show_elevation) && (
                            <GPXMapViewer
                              gpxUrl={ticket.gpx_file_url}
                              category={ticket.category}
                              showRoute={ticket.show_route}
                              showElevation={ticket.show_elevation}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Bloco: Local do Evento (sempre exibido por último, independente) */}
            <Card>
              <CardContent className="p-4 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-[#156634]" />
                  Local do Evento
                </h2>
                
                <div className="space-y-3 md:space-y-4">
                  {/* Informações do Local */}
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                    <div className="flex items-start gap-2 md:gap-3">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-[#156634] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 md:space-y-2">
                        {eventData.city && eventData.state && (
                          <p className="font-semibold text-gray-900 text-sm md:text-base">
                            {eventData.city}, {eventData.state}
                          </p>
                        )}
                      {eventData.address && (
                          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                          {eventData.address}
                          </p>
                        )}
                        {eventData.location && (
                          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            {eventData.location}
                        </p>
                      )}
                      </div>
                    </div>
                  </div>

                  {/* Mapa do Google Maps (sempre, sem GPX) */}
                  <div className="w-full h-[250px] md:h-[400px] rounded-lg overflow-hidden border">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${eventData.location}${eventData.address ? ', ' + eventData.address : ''}${eventData.city && eventData.state ? ', ' + eventData.city + ' - ' + eventData.state : ''}`
                      )}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Sidebar de Ingressos */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="border-2 border-[#156634]/20 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#156634] rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900">{translations[language].ticketsTitle}</h2>
                  </div>
                  
                  {selectedBatch && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{translations[language].batchLabel}:</span> {selectedBatch.name}
                      </p>
                      {selectedBatch.tickets && (
                        <p className="text-xs text-gray-600 mt-1.5">
                          {selectedBatch.total_quantity === null || selectedBatch.total_quantity === undefined
                            ? translations[language].unlimited || "Ilimitado"
                            : `${selectedBatch.total_quantity} ${translations[language].available}`}
                        </p>
                      )}
                </div>
              )}
              
                  {selectedBatch && selectedBatch.tickets && selectedBatch.tickets.length > 0 ? (
                    <>
                      {/* Seleção de Lote */}
                      {eventData.ticket_batches && eventData.ticket_batches.length > 1 && (
                        <div className="mb-4">
                          <label className="text-sm font-medium mb-2 block">{translations[language].changeBatch}</label>
                          <select
                            className="w-full p-2 border rounded-md text-sm"
                            value={selectedBatch.id}
                            onChange={(e) => {
                              const batch = eventData.ticket_batches.find((b: any) => b.id === e.target.value)
                              setSelectedBatch(batch)
                              setSelectedTickets({})
                            }}
                          >
                  {eventData.ticket_batches.map((batch: any) => (
                              <option key={batch.id} value={batch.id}>
                                {batch.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Lista de Ingressos */}
                      <div className="space-y-3 mb-6">
                        {selectedBatch.tickets.map((ticket: any) => (
                          <div key={ticket.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-[#156634] hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm">{ticket.category}</h3>
                                  {ticket.has_kit && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-green-50 border-green-300 text-green-700">
                                      <Package className="h-2.5 w-2.5 mr-0.5" />
                                      {translations[language].includeKit}
                                    </Badge>
                                  )}
                    </div>
                                <p className="text-xs text-muted-foreground">
                                  {ticket.quantity === null || ticket.quantity === undefined || ticket.quantity === 0
                                    ? translations[language].unlimited
                                    : `${ticket.quantity} ${translations[language].available}`}
                                </p>
                </div>
                              <div className="text-right">
                                {ticket.is_free ? (
                                  <span className="text-sm font-bold text-green-600">{translations[language].free}</span>
                                ) : (
                                  <span className="text-sm font-bold text-[#156634]">
                                    R$ {ticket.price.toFixed(2)}
                                  </span>
              )}
            </div>
          </div>

                            {/* Seletor de Quantidade */}
                            <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{translations[language].quantity}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateTicketQuantity(ticket.id, -1)}
                                  disabled={!selectedTickets[ticket.id]}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">
                                  {selectedTickets[ticket.id] || 0}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateTicketQuantity(ticket.id, 1)}
                                  disabled={
                                    ticket.quantity !== null && 
                                    ticket.quantity !== undefined && 
                                    ticket.quantity > 0 && 
                                    (selectedTickets[ticket.id] || 0) >= ticket.quantity
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
        </div>
      </div>
    </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      {/* Total */}
                      {getTotalTickets() > 0 && (
                        <>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {getTotalTickets()} {getTotalTickets() === 1 ? translations[language].ticketSingular : translations[language].ticketPlural}
                              </span>
                              <span className="font-medium">
                                {isEventFree() ? translations[language].free : `R$ ${getTotalPrice().toFixed(2)}`}
                              </span>
        </div>
                            {!isEventFree() && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{translations[language].serviceFee}</span>
                                <span className="font-medium">
                                  R$ {(getTotalTickets() * 5).toFixed(2)}
                                </span>
      </div>
                            )}
        </div>

                          <Separator className="my-4" />

                          <div className="flex justify-between items-center mb-6">
                            <span className="text-lg font-bold">{translations[language].totalLabel}</span>
                            <span className="text-2xl font-bold text-[#156634]">
                              {isEventFree() ? translations[language].free : `R$ ${(getTotalPrice() + (getTotalTickets() * 5)).toFixed(2)}`}
                            </span>
      </div>
                        </>
                      )}

                      {/* Botão de Compra */}
                      <Button
                        className="w-full bg-[#156634] hover:bg-[#1a7a3e] text-white py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={handleCheckout}
                        disabled={getTotalTickets() === 0}
                      >
                        {getTotalTickets() === 0 ? translations[language].selectTickets : translations[language].continue}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground mt-4">
                        {translations[language].termsPhrase}
                      </p>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {translations[language].ticketsSoon}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Bloco Sobre o Organizador - Abaixo dos Ingressos */}
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-4">{translations[language].organizer}</h2>
                  
                  {eventData.organizer ? (
            <div className="space-y-4">
                      {/* Nome da Empresa */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#156634] rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{translations[language].organizer}</p>
                          <p className="font-semibold text-sm text-gray-900">
                            {eventData.organizer.company_name || eventData.organizer.full_name}
                          </p>
                        </div>
              </div>
              
                      {/* CNPJ */}
                      {(eventData.organizer.company_cnpj || eventData.organizer.cnpj) && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-[#156634]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">CNPJ</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {eventData.organizer.company_cnpj || eventData.organizer.cnpj}
                            </p>
                        </div>
              </div>
                      )}
              
                      {/* Email */}
                      {(eventData.organizer?.company_email || eventData.organizer?.email) && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-[#156634]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{translations[language].email}</p>
                            <a 
                              href={`mailto:${eventData.organizer.company_email || eventData.organizer.email}`}
                              className="text-sm text-[#156634] hover:underline break-all font-medium"
                            >
                              {eventData.organizer.company_email || eventData.organizer.email}
                            </a>
                          </div>
                </div>
              )}
              
                      {/* Telefone */}
                      {eventData.organizer.company_phone && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-5 w-5 text-[#156634]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{translations[language].phone}</p>
                            <a 
                              href={`tel:${eventData.organizer.company_phone}`}
                              className="text-sm text-[#156634] hover:underline font-medium"
                            >
                              {eventData.organizer.company_phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {translations[language].noOrganizer}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Profissional */}
      <footer className="bg-gray-50/50 border-t border-gray-100 mt-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-10 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Grid Principal */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 text-center md:text-left">
              {/* Coluna 1: Logo e Descrição */}
              <div className="space-y-3 flex flex-col items-center md:items-start">
                <div>
                  <Image
                    src="/images/logo/logo.png"
                    alt="EveMaster"
                    width={140}
                    height={40}
                    className="h-8 w-auto opacity-80"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                  Ingressos para eventos esportivos. 
                  Corridas, maratonas, triatlon e ciclismo.
                </p>
              </div>

              {/* Coluna 2: Formas de Pagamento */}
              <div className="space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600">
                  {translations[language].footerPayment}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Image
                    src="/images/ic-payment-visa.svg"
                    alt="Visa"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-master-card.svg"
                    alt="Mastercard"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-elo.svg"
                    alt="Elo"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-american-express.svg"
                    alt="American Express"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-hipercard.svg"
                    alt="Hipercard"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-pix.svg"
                    alt="Pix"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <Image
                    src="/images/ic-payment-boleto.svg"
                    alt="Boleto"
                    width={40}
                    height={25}
                    className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-[#156634]">Parcelamento em até 12x</span> no cartão de crédito
                </p>
              </div>

              {/* Coluna 3: Links Legais */}
              <div className="space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600">
                  Legal
                </h3>
                <div className="flex flex-col gap-1.5">
                  <Link 
                    href="/termos-de-uso" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors"
                  >
                    {translations[language].footerTerms}
                  </Link>
                  <Link 
                    href="/politica-de-privacidade" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors"
                  >
                    {translations[language].footerPolicy}
                  </Link>
                </div>
              </div>

              {/* Coluna 4: Idioma */}
              <div className="space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600">
                  Idioma
                </h3>
                <Select value={language} onValueChange={(val: "pt" | "es" | "en") => setLanguage(val)}>
                  <SelectTrigger className="w-full md:w-[140px] bg-white border-gray-200 text-gray-600 text-xs h-9">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span>{language === "pt" ? "🇧🇷" : language === "es" ? "🇦🇷" : "🇺🇸"}</span>
                        <span className="text-xs">{language === "pt" ? "Português" : language === "es" ? "Español" : "English"}</span>
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <div className="text-center md:text-left">
                <p className="mb-0.5">
                  © {new Date().getFullYear()} EveMaster. Todos os direitos reservados.
                </p>
                <p className="text-gray-400">
                  Fulsale LTDA - CNPJ: 00.000.000/0001-00
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
