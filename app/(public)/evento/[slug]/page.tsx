"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getEventBySlug } from "@/lib/supabase/events"
import { Loader2, Calendar, MapPin, Clock, Users, Share2, Heart, Minus, Plus, Trophy, Package, Building2, Mail, Phone, Globe } from "lucide-react"
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
      ticketsTitle: "Ingressos",
      changeBatch: "Alterar Lote",
      batchLabel: "Lote",
      quantity: "Quantidade",
      selectTickets: "Selecione os ingressos",
      continue: "Continuar",
      termsPhrase: "Ao clicar em continuar você concorda com os",
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
      free: "Gratuito",
      serviceFee: "Taxa de serviço",
      totalLabel: "Total",
      ticketsSoon: "Ingressos em breve",
      ticketSingular: "ingresso",
      ticketPlural: "ingressos",
      languageLabel: "Idioma",
      footerTerms: "Termos de Uso",
      footerPolicy: "Política de Privacidade",
      footerPayment: "Aceitamos todos os cartões, Pix e Boleto",
    },
    es: {
      eventInfo: "Información del Evento",
      description: "Sobre el Evento",
      ticketsTitle: "Entradas",
      changeBatch: "Cambiar Lote",
      batchLabel: "Lote",
      quantity: "Cantidad",
      selectTickets: "Selecciona las entradas",
      continue: "Continuar",
      termsPhrase: "Al continuar aceptas nuestros",
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
      free: "Gratuito",
      serviceFee: "Costo de servicio",
      totalLabel: "Total",
      ticketsSoon: "Entradas próximamente",
      ticketSingular: "entrada",
      ticketPlural: "entradas",
      languageLabel: "Idioma",
      footerTerms: "Términos de Uso",
      footerPolicy: "Política de Privacidad",
      footerPayment: "Aceptamos todas las tarjetas, Pix y Boleto",
    },
    en: {
      eventInfo: "Event Information",
      description: "About the Event",
      ticketsTitle: "Tickets",
      changeBatch: "Change Batch",
      batchLabel: "Batch",
      quantity: "Quantity",
      selectTickets: "Select tickets",
      continue: "Continue",
      termsPhrase: "By continuing you agree to our",
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
      free: "Free",
      serviceFee: "Service fee",
      totalLabel: "Total",
      ticketsSoon: "Tickets coming soon",
      ticketSingular: "ticket",
      ticketPlural: "tickets",
      languageLabel: "Language",
      footerTerms: "Terms of Use",
      footerPolicy: "Privacy Policy",
      footerPayment: "We accept all credit cards, Pix and Boleto",
    },
  }
  const getPlainDescription = () => {
    if (!eventData?.description) return "Evento esportivo da EveMaster"
    return eventData.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 150)
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
        
        setEventData(event)
        
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

  useEffect(() => {
    if (!eventData) return

    const title = `${eventData.name} | EveMaster Eventos Esportivos`
    const description = getPlainDescription()
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const ogImage = eventData.banner_url || `${origin}/images/logo/logo.png`
    const currentUrl = typeof window !== "undefined" ? window.location.href : ""

    document.title = title

    const setMeta = (attr: "name" | "property", key: string, value: string) => {
      let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!meta) {
        meta = document.createElement("meta")
        meta.setAttribute(attr, key)
        document.head.appendChild(meta)
      }
      meta.content = value
    }

    setMeta("name", "description", description)
    setMeta("property", "og:title", title)
    setMeta("property", "og:description", description)
    if (currentUrl) setMeta("property", "og:url", currentUrl)
    setMeta("property", "og:type", "website")
    setMeta("property", "og:image", ogImage)
    setMeta("name", "twitter:card", "summary_large_image")
    setMeta("name", "twitter:title", title)
    setMeta("name", "twitter:description", description)
    setMeta("name", "twitter:image", ogImage)
  }, [eventData])

  const updateTicketQuantity = (ticketId: string, change: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketId] || 0
      const newValue = Math.max(0, current + change)
      if (newValue === 0) {
        const { [ticketId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [ticketId]: newValue }
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
            className="object-cover"
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
      <div className="container mx-auto px-4 -mt-16 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Informações do Evento */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex justify-end mb-4">
                  <Select value={language} onValueChange={(val: "pt" | "es" | "en") => setLanguage(val)}>
                    <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-600 text-sm h-9">
                      <SelectValue placeholder={translations[language].languageLabel} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6">
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-[#156634] rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-medium mb-0.5 md:mb-1">{translations[language].dataEvento}</p>
                      <p className="font-semibold text-sm md:text-base text-gray-900">
                        {eventData.event_date && new Date(eventData.event_date).toLocaleDateString(language === "en" ? "en-US" : language === "es" ? "es-AR" : "pt-BR", {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {eventData.start_time && (
                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-[#156634] rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-medium mb-0.5 md:mb-1">{translations[language].horarioInicio}</p>
                        <p className="font-semibold text-sm md:text-base text-gray-900">{eventData.start_time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors md:col-span-2">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-[#156634] rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-medium mb-0.5 md:mb-1">{translations[language].location}</p>
                      <p className="font-semibold text-sm md:text-base text-gray-900">
                        {eventData.location}
                        {eventData.address && ` - ${eventData.address}`}
                      </p>
                      {eventData.city && eventData.state && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                          {eventData.city} - {eventData.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              
                <Separator className="my-6" />

                {/* Descrição do Evento */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">{translations[language].description}</h2>
                  {eventData.description ? (
                    <div 
                      className="prose prose-gray max-w-none"
                      dangerouslySetInnerHTML={{ __html: eventData.description }}
                    />
                  ) : (
                    <p className="text-muted-foreground">
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

            {/* Card do Local do Evento */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">{translations[language].locationTitle}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#156634] mt-0.5 flex-shrink-0" />
                <div>
                      <p className="font-medium text-gray-900">
                        {eventData.location}
                      </p>
                      {eventData.address && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {eventData.address}
                          {eventData.city && eventData.state && `, ${eventData.city} - ${eventData.state}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mapa do Google Maps */}
                  <div className="w-full h-[400px] rounded-lg overflow-hidden border">
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
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-2">{translations[language].ticketsTitle}</h2>
                  
                  {selectedBatch && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{translations[language].batchLabel}:</span> {selectedBatch.name}
                      </p>
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
                          <div key={ticket.id} className="border rounded-lg p-3 hover:border-[#156634] transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm">{ticket.category}</h3>
                                  {ticket.has_kit && (
                                    <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                                      <Package className="h-3 w-3 mr-1" />
                                      {translations[language].includeKit}
                                    </Badge>
                                  )}
                    </div>
                                <p className="text-xs text-muted-foreground">
                                  {ticket.quantity} {translations[language].available}
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
                                  disabled={(selectedTickets[ticket.id] || 0) >= ticket.quantity}
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
                        className="w-full bg-[#156634] hover:bg-[#1a7a3e] text-white py-6 text-lg"
                        onClick={handleCheckout}
                        disabled={getTotalTickets() === 0}
                      >
                        {getTotalTickets() === 0 ? translations[language].selectTickets : translations[language].continue}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground mt-4">
                        {translations[language].termsPhrase}{' '}
                        <Link href="/termos-de-uso" className="text-[#156634] hover:underline">
                          {translations[language].terms}
                        </Link>
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
                          {eventData.organizer.company_cnpj && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              CNPJ: {eventData.organizer.company_cnpj}
                            </p>
                          )}
                        </div>
              </div>
              
                      {/* Email */}
                      {eventData.organizer.company_email && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-[#156634]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase font-medium mb-0.5">{translations[language].email}</p>
                            <a 
                              href={`mailto:${eventData.organizer.company_email}`}
                              className="text-sm text-[#156634] hover:underline break-all font-medium"
                            >
                              {eventData.organizer.company_email}
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

      {/* Rodapé Simples e Centralizado */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
            {/* Logo com mais opacidade e menor */}
            <div className="opacity-20">
              <Image
                src="/images/logo/logo.png"
                alt="EveMaster"
                width={120}
                height={35}
                className="h-8 w-auto"
              />
            </div>

            {/* Select de Idioma */}
            <Select value={language} onValueChange={(val: "pt" | "es" | "en") => setLanguage(val)}>
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

            {/* Links com separador | */}
            <div className="flex items-center gap-3 text-sm">
              <Link href="/termos-de-uso" className="text-muted-foreground hover:text-[#156634] transition-colors">
                {translations[language].footerTerms}
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/politica-de-privacidade" className="text-muted-foreground hover:text-[#156634] transition-colors">
                {translations[language].footerPolicy}
              </Link>
            </div>

            {/* Formas de Pagamento */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {translations[language].footerPayment}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
