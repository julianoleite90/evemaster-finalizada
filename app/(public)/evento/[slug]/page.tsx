"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getEventBySlug } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Calendar, MapPin, Clock, Users, Share2, Heart, Minus, Plus, Trophy, Package, Building2, Mail, Phone, Globe, Route, Mountain, Activity, Facebook, Twitter, Linkedin, MessageCircle, Gauge, Award, Footprints, Map } from "lucide-react"
import dynamic from "next/dynamic"

const GPXMapViewer = dynamic(() => import("@/components/event/GPXMapViewer"), { ssr: false })
import EventPixels from "@/components/analytics/EventPixels"
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
  const [error, setError] = useState<string | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({})
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [language, setLanguage] = useState<"pt" | "es" | "en">("pt")
  const [showShareMenu, setShowShareMenu] = useState(false)
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

  // Fechar menu de compartilhamento ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('.share-menu-container')) {
          setShowShareMenu(false)
        }
      }
    }

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showShareMenu])

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return
      
      try {
        setError(null)
        const event = await getEventBySlug(slug)

        if (!event) {
          setError("Evento não encontrado")
          return
        }
        
        // Criar uma cópia do objeto para garantir reatividade
        if (event.organizer) {
          event.organizer = { ...event.organizer }
        }
        
        // Mapear event_images para images
        const eventDataWithImages = {
          ...event,
          images: event.event_images || []
        }
        
        setEventData(eventDataWithImages)
        
        // Registrar visualização do evento
        if (event.id) {
          const supabase = createClient()
          // Registrar visualização de forma assíncrona (não bloquear renderização)
          ;(async () => {
            try {
              const { data, error } = await supabase
                .from('event_views')
                .insert({
                  event_id: event.id,
                  user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
                  referrer: typeof window !== 'undefined' ? document.referrer || null : null
                })
              
              if (error) {
                console.error('❌ [TRACKING] Erro ao registrar visualização:', error)
                console.error('❌ [TRACKING] Detalhes:', { event_id: event.id, error_code: error.code, error_message: error.message })
              } else {
                console.log('✅ [TRACKING] Visualização registrada com sucesso:', data)
              }
            } catch (err) {
              console.error('❌ [TRACKING] Erro ao registrar visualização (catch):', err)
            }
          })()
        }
        
        // Usar idioma do evento como padrão, se disponível
        if (event.language && (event.language === 'pt' || event.language === 'es' || event.language === 'en')) {
          setLanguage(event.language)
        }
        
        // Selecionar primeiro lote ativo por padrão
        if (event.ticket_batches && event.ticket_batches.length > 0) {
          setSelectedBatch(event.ticket_batches[0])
        }
        
        // Carregar dados completos do organizador de forma não-bloqueante (após renderizar)
        if (event.organizer && ((!event.organizer.company_cnpj && !event.organizer.cnpj) || 
            !event.organizer.company_phone || 
            (!event.organizer.company_email && !event.organizer.email && event.organizer.user_id))) {
          // Fazer em background, sem bloquear a renderização
          setTimeout(async () => {
            const supabase = createClient()
            
            // Buscar organizador completo novamente
            const { data: fullOrganizer } = await supabase
              .from("organizers")
              .select("id, company_name, full_name, company_cnpj, company_phone, user_id")
              .eq("id", event.organizer.id || event.organizer_id)
              .single()
            
            if (fullOrganizer) {
              // Atualizar estado sem bloquear
              setEventData((prev: any) => ({
                ...prev,
                organizer: {
                  ...prev.organizer,
                  company_cnpj: fullOrganizer.company_cnpj || prev.organizer.company_cnpj,
                  company_phone: fullOrganizer.company_phone || prev.organizer.company_phone,
                  user_id: fullOrganizer.user_id || prev.organizer.user_id
                }
              }))
            }
            
            // Se não tiver email, tentar buscar novamente APENAS da tabela users
            const currentOrganizer = fullOrganizer || event.organizer
            if (!currentOrganizer.company_email && !currentOrganizer.email && currentOrganizer.user_id) {
              const { data: user } = await supabase
              .from("users")
              .select("email")
                .eq("id", currentOrganizer.user_id)
              .single()
            
            // VALIDAÇÃO CRÍTICA: Não usar email errado
              if (user && user.email && user.email !== "julianodesouzaleite@gmail.com") {
                setEventData((prev: any) => ({
                  ...prev,
                  organizer: {
                    ...prev.organizer,
                    email: user.email,
                    company_email: user.email
                  }
                }))
              }
            }
          }, 0)
        }
      } catch (error: any) {
        setError(error.message || "Erro ao carregar evento")
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

  if (error && !eventData) {
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

  // Se não tem dados ainda, mostrar página vazia (será preenchida quando carregar)
  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
        <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#156634] mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando evento...</p>
          </div>
        </div>
      </div>
    )
  }

  // Extrair dados dos pixels do event_settings
  const eventSettings = eventData.event_settings?.[0] || {}
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
    <div className="min-h-screen bg-gray-50">
      {/* Pixels de Rastreamento */}
      <EventPixels
        googleAnalyticsId={googleAnalyticsId}
        googleTagManagerId={googleTagManagerId}
        facebookPixelId={facebookPixelId}
      />
      
      {/* Banner */}
      <div className="relative w-full aspect-[21/11] md:aspect-[21/6] bg-gray-100 overflow-hidden">
        {eventData.banner_url ? (
          <Image
            src={eventData.banner_url}
            alt={eventData.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1920px"
            quality={90}
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#156634] to-[#1a7a3e]">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
              {eventData.name}
            </h1>
          </div>
        )}
      </div>
              
      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 -mt-9 md:-mt-16 pb-16 relative z-10">
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
                  <div className="flex flex-wrap items-center gap-2">
                    {eventData.category && (
                      <Badge className="bg-gray-400/90 hover:bg-gray-500 text-white">
                        <Footprints className="h-3 w-3 mr-1" />
                        {eventData.category.charAt(0).toUpperCase() + eventData.category.slice(1)}
                      </Badge>
                    )}
                    {eventData.difficulty_level && (
                      <Badge className="bg-gray-400/90 hover:bg-gray-500 text-white">
                        <Gauge className="h-3 w-3 mr-1" />
                        {eventData.difficulty_level}
                      </Badge>
                    )}
                    {eventData.race_type && (
                      <Badge className="bg-gray-400/90 hover:bg-gray-500 text-white">
                        <Map className="h-3 w-3 mr-1" />
                        {eventData.race_type === 'asfalto' 
                          ? (language === 'pt' ? 'Asfalto' : language === 'en' ? 'Asphalt' : 'Asfalto')
                          : eventData.race_type === 'trail'
                          ? (language === 'pt' ? 'Trail' : language === 'en' ? 'Trail' : 'Trail')
                          : (language === 'pt' ? 'Misto' : language === 'en' ? 'Mixed' : 'Mixto')
                        }
                      </Badge>
                    )}
                    {eventData.major_access && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-md">
                        <Award className="h-3 w-3 mr-1" />
                        {eventData.major_access_type || (language === 'pt' ? 'Prova Major' : language === 'en' ? 'Major Race' : 'Prueba Major')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Informações Principais - Layout Melhorado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className="flex items-start gap-2.5 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-[#156634]/95 rounded-lg flex items-center justify-center shadow-sm">
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
                      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-[#156634]/95 rounded-lg flex items-center justify-center shadow-sm">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs text-gray-500 uppercase font-semibold mb-1 tracking-wide">{translations[language].horarioInicio}</p>
                        <p className="font-bold text-xs md:text-sm text-gray-900 leading-tight">{eventData.start_time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors md:col-span-2 border border-gray-200">
                    <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-[#156634]/95 rounded-lg flex items-center justify-center shadow-sm">
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

                {/* Galeria de Imagens */}
                {eventData.images && eventData.images.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">Galeria de Imagens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {eventData.images.map((img: any, index: number) => (
                        <div key={img.id || index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                          <Image
                            src={img.image_url}
                            alt={`Imagem ${index + 1} do evento`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                            <Trophy className="h-5 w-5 text-[#156634]/85" />
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
                          {eventData.address}{eventData.address_number ? `, ${eventData.address_number}` : ''}
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
                        `${eventData.location || ''}${eventData.address ? ', ' + eventData.address : ''}${eventData.address_number ? ', ' + eventData.address_number : ''}${eventData.city && eventData.state ? ', ' + eventData.city + ' - ' + eventData.state : ''}`
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
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{translations[language].ticketsTitle}</h2>
                  </div>
                  
                  {selectedBatch && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 mb-1.5">
                        <span className="font-semibold text-gray-900">{translations[language].batchLabel}:</span> {selectedBatch.name}
                      </p>
                      {selectedBatch.tickets && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium text-gray-700">
                            {language === 'pt' ? 'Disponíveis: ' : language === 'en' ? 'Available: ' : 'Disponibles: '}
                          </span>
                          {selectedBatch.total_quantity === null || selectedBatch.total_quantity === undefined
                            ? translations[language].unlimited || "Ilimitado"
                            : selectedBatch.total_quantity}
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
                          <div 
                            key={ticket.id} 
                            onClick={() => setSelectedTicketId(ticket.id === selectedTicketId ? null : ticket.id)}
                            className={`border-2 rounded-lg p-4 bg-white hover:shadow-md transition-all cursor-pointer ${
                              selectedTicketId === ticket.id 
                                ? 'border-[#156634] bg-green-50/30 shadow-md' 
                                : 'border-gray-200 hover:border-[#156634]'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-1.5">
                                  {language === 'pt' ? 'Ingresso: ' : language === 'en' ? 'Ticket: ' : 'Entrada: '}
                                  {ticket.category}
                                </h3>
                                {ticket.has_kit && ticket.kit_items && ticket.kit_items.length > 0 && (
                                  <p className="text-xs text-gray-600 mb-1.5">
                                    <span className="font-medium text-gray-700">
                                      {language === 'pt' ? 'Inclui: ' : language === 'en' ? 'Includes: ' : 'Incluye: '}
                                    </span>
                                    {ticket.kit_items.join(', ')}
                                </p>
                                )}
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
                        <div className="flex-shrink-0 w-10 h-10 bg-[#156634]/95 rounded-lg flex items-center justify-center">
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
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-[#156634]/85" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">CNPJ</p>
                          <p className="text-sm text-gray-900 font-semibold">
                            {eventData.organizer.company_cnpj || eventData.organizer.cnpj || (language === 'pt' ? 'Não informado' : language === 'en' ? 'Not provided' : 'No proporcionado')}
                            </p>
                        </div>
              </div>
              
                      {/* Email */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-[#156634]/85" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{translations[language].email}</p>
                          {eventData.organizer?.company_email || eventData.organizer?.email ? (
                            <a 
                              href={`mailto:${eventData.organizer.company_email || eventData.organizer.email}`}
                              className="text-sm text-gray-900 hover:text-[#156634]/95 hover:underline break-all font-semibold"
                            >
                              {eventData.organizer.company_email || eventData.organizer.email}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-900 font-semibold">
                              {language === 'pt' ? 'Não informado' : language === 'en' ? 'Not provided' : 'No proporcionado'}
                            </p>
                          )}
                          </div>
                </div>
              
                      {/* Telefone */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-5 w-5 text-[#156634]/85" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{translations[language].phone}</p>
                          {eventData.organizer.company_phone ? (
                            <a 
                              href={`tel:${eventData.organizer.company_phone}`}
                              className="text-sm text-gray-900 hover:text-[#156634]/95 hover:underline font-semibold"
                            >
                              {eventData.organizer.company_phone}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-900 font-semibold">
                              {language === 'pt' ? 'Não informado' : language === 'en' ? 'Not provided' : 'No proporcionado'}
                            </p>
                          )}
                          </div>
                        </div>
              
                      {/* Eventos realizados no último ano */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-[#156634]/85" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">
                            {language === 'pt' ? 'Eventos Realizados' : language === 'en' ? 'Events Held' : 'Eventos Realizados'}
                          </p>
                          <p className="text-sm text-gray-900 font-semibold">
                            {eventData.organizer.events_last_year !== undefined 
                              ? (language === 'pt' 
                                  ? `${eventData.organizer.events_last_year} evento${eventData.organizer.events_last_year !== 1 ? 's' : ''} no último ano`
                                  : language === 'en'
                                  ? `${eventData.organizer.events_last_year} event${eventData.organizer.events_last_year !== 1 ? 's' : ''} in the last year`
                                  : `${eventData.organizer.events_last_year} evento${eventData.organizer.events_last_year !== 1 ? 's' : ''} en el último año`
                                )
                              : (language === 'pt' ? 'Não informado' : language === 'en' ? 'Not provided' : 'No proporcionado')
                            }
                          </p>
                        </div>
                      </div>
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

      {/* Seção de Compartilhamento */}
      <div className="bg-white py-8 md:py-16 border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {/* Texto */}
              <p className="text-sm md:text-lg lg:text-xl text-gray-800 leading-relaxed text-center md:text-left flex-1">
                {language === 'pt' 
                  ? (
                      <>
                        <span className="text-gray-900 tracking-tight font-semibold">Compartilhe esse evento</span>
                        {' '}e{' '}
                        <span className="text-[#156634]/95 tracking-tight font-semibold">estimule o movimento</span>
                        {' '}com outras pessoas
                      </>
                    )
                  : language === 'en'
                  ? (
                      <>
                        <span className="text-gray-900 tracking-tight font-semibold">Share this event</span>
                        {' '}and{' '}
                        <span className="text-[#156634]/95 tracking-tight font-semibold">encourage movement</span>
                        {' '}with others
                      </>
                    )
                  : (
                      <>
                        <span className="text-gray-900 tracking-tight font-semibold">Comparte este evento</span>
                        {' '}y{' '}
                        <span className="text-[#156634]/95 tracking-tight font-semibold">fomenta el movimiento</span>
                        {' '}con otras personas
                      </>
                    )
                }
              </p>
              
              {/* Botão */}
              <div className="relative inline-block share-menu-container w-full md:w-auto">
                <Button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="bg-[#156634]/95 hover:bg-[#156634] text-white w-full md:w-auto px-6 md:px-8 py-4 md:py-6 text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                  {language === 'pt' ? 'Compartilhar' : language === 'en' ? 'Share' : 'Compartir'}
                </Button>
                
                {/* Menu de Redes Sociais */}
                {showShareMenu && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[220px] z-50 share-menu-container">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Facebook */}
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 p-3 rounded-md hover:bg-gray-50 transition-colors"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <Facebook className="h-5 w-5 text-[#1877F2]" />
                        <span className="text-xs font-medium text-gray-700">Facebook</span>
                      </a>
                      
                      {/* Twitter/X */}
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(eventData?.name || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 p-3 rounded-md hover:bg-gray-50 transition-colors"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                        <span className="text-xs font-medium text-gray-700">Twitter</span>
                      </a>
                      
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent((eventData?.name || '') + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 p-3 rounded-md hover:bg-gray-50 transition-colors"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <MessageCircle className="h-5 w-5 text-[#25D366]" />
                        <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                      </a>
                      
                      {/* LinkedIn */}
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 p-3 rounded-md hover:bg-gray-50 transition-colors"
                        onClick={() => setShowShareMenu(false)}
                      >
                        <Linkedin className="h-5 w-5 text-[#0077B5]" />
                        <span className="text-xs font-medium text-gray-700">LinkedIn</span>
                      </a>
                    </div>
                    
                    {/* Botão Copiar Link */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(window.location.href)
                            setShowShareMenu(false)
                          }
                        }}
                      >
                        {language === 'pt' ? 'Copiar Link' : language === 'en' ? 'Copy Link' : 'Copiar Enlace'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                  {translations[language].footerPayment}
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
                {translations[language].footerTerms}
              </Link>
                  <Link 
                    href="/politica-de-privacidade" 
                    className="text-xs text-gray-500 hover:text-[#156634] transition-colors text-center md:text-left"
                  >
                {translations[language].footerPolicy}
              </Link>
                </div>
              </div>

              {/* Coluna 4: Idioma */}
              <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600 hidden md:block">
                  Idioma
                </h3>
                <Select value={language} onValueChange={(val: "pt" | "es" | "en") => setLanguage(val)}>
                  <SelectTrigger className="w-full max-w-[140px] md:w-[140px] bg-white border-gray-200 text-gray-600 text-xs h-8 md:h-9">
                    <SelectValue asChild>
                      <span className="flex items-center">
                        <span className="text-sm">{language === "pt" ? "🇧🇷" : language === "es" ? "🇦🇷" : "🇺🇸"}</span>
                        <span className="text-xs hidden sm:inline ml-[5px]">{language === "pt" ? "Português" : language === "es" ? "Español" : "English"}</span>
                        <span className="text-xs sm:hidden ml-[5px]">{language === "pt" ? "PT" : language === "es" ? "ES" : "EN"}</span>
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
    </div>
  )
}
