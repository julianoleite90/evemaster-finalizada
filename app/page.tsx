"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { 
  Calendar, 
  MapPin, 
  Search, 
  Loader2, 
  Trophy, 
  ChevronRight, 
  ChevronLeft,
  X,
  Filter,
  Footprints,
  Bike,
  Waves,
  Mountain,
  Activity,
  Route,
  ChevronDown
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Event {
  id: string
  name: string
  description: string
  category: string
  event_date: string
  start_time: string
  location: string
  city: string
  state: string
  banner_url: string | null
  slug: string
  status: string
}

const MODALIDADES_ESPORTIVAS = [
  { value: "corrida", label: "Corrida", icon: Footprints },
  { value: "ciclismo", label: "Ciclismo", icon: Bike },
  { value: "triatlo", label: "Triatlo", icon: Activity },
  { value: "natacao", label: "Natação", icon: Waves },
  { value: "caminhada", label: "Caminhada", icon: Footprints },
  { value: "trail-running", label: "Trail Running", icon: Mountain },
  { value: "mountain-bike", label: "Mountain Bike", icon: Bike },
  { value: "duatlo", label: "Duatlo", icon: Activity },
  { value: "aquatlo", label: "Aquatlo", icon: Waves },
  { value: "ciclismo-estrada", label: "Ciclismo de Estrada", icon: Bike },
  { value: "ciclismo-mtb", label: "Ciclismo MTB", icon: Bike },
  { value: "outro", label: "Outro", icon: Route },
]

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedState, setSelectedState] = useState<string>("all")
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [language, setLanguage] = useState<"pt" | "es" | "en">("pt")
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("status", "active")
          .eq("show_in_showcase", true)
          .order("event_date", { ascending: true })

        if (error) throw error

        setEvents(data || [])
      } catch (error) {
        console.error("Erro ao buscar eventos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const uniqueStates = useMemo(() => {
    const states = new Set<string>()
    events.forEach((event) => {
      if (event.state) states.add(event.state)
    })
    return Array.from(states).sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        event.name?.toLowerCase().includes(search) ||
        event.description?.toLowerCase().includes(search) ||
        event.location?.toLowerCase().includes(search) ||
        event.city?.toLowerCase().includes(search) ||
        event.category?.toLowerCase().includes(search)

      const matchesCategory = selectedCategory === "all" || event.category === selectedCategory
      const matchesState = selectedState === "all" || event.state === selectedState

      return matchesSearch && matchesCategory && matchesState
    })
  }, [events, searchTerm, selectedCategory, selectedState])

  const featuredEvents = filteredEvents.slice(0, 5)
  const regularEvents = filteredEvents.slice(5)

  // Auto-play do slider
  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length <= 1) return

    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, featuredEvents.length])

  // Agrupar eventos por categoria
  const eventsByCategory = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    filteredEvents.forEach((event) => {
      const category = event.category || "outro"
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(event)
    })
    return grouped
  }, [filteredEvents])

  const hasActiveFilters = selectedCategory !== "all" || selectedState !== "all"

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedState("all")
    setSearchTerm("")
  }

  const nextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)
  }

  const prevFeatured = () => {
    setFeaturedIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)
  }

  // Função para formatar data sem problemas de timezone
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    // Parse a data no formato YYYY-MM-DD como data local (não UTC)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Função para formatar data completa com dia da semana
  const formatDateFull = (dateString: string, timeString?: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "short",
    }
    
    let formatted = date.toLocaleDateString("pt-BR", options)
    if (timeString) {
      formatted += ` às ${timeString}`
    }
    return formatted
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#156634]/85 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Igual ao Checkout */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo/logo.png"
                alt="Logo EveMaster"
                width={126}
                height={36}
                className="h-6 md:h-8 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/login">
                <Button className="bg-[#156634]/95 hover:bg-[#156634] text-white text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Slider de Eventos em Destaque - Menor */}
      {featuredEvents.length > 0 && (
        <div className="relative overflow-hidden w-full bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div 
              className="relative h-[308px] md:h-[320px] w-full overflow-hidden rounded-xl"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
            <div 
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${featuredIndex * 100}%)` }}
            >
              {featuredEvents.map((event, index) => (
                <Link 
                  key={event.id} 
                  href={`/evento/${event.slug || event.id}`}
                  className="min-w-full h-full relative block group cursor-pointer"
                >
                  {event.banner_url ? (
                    <Image
                      src={event.banner_url}
                      alt={event.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#156634] via-[#1a7a3e] to-[#0f4d24] flex items-center justify-center">
                      <Trophy className="h-32 w-32 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  
                  {/* Conteúdo do slide - Menor */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                    <Badge className="mb-2 bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs px-2 py-1">
                      {MODALIDADES_ESPORTIVAS.find((c) => c.value === event.category)?.label || event.category}
                    </Badge>
                    <h2 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">
                      {event.name}
                    </h2>
                  </div>
                </Link>
              ))}
            </div>

            {featuredEvents.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-lg z-10 h-10 w-10 rounded-full"
                  onClick={(e) => {
                    e.preventDefault()
                    prevFeatured()
                    setIsAutoPlaying(false)
                    setTimeout(() => setIsAutoPlaying(true), 3000)
                  }}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-900" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-lg z-10 h-10 w-10 rounded-full"
                  onClick={(e) => {
                    e.preventDefault()
                    nextFeatured()
                    setIsAutoPlaying(false)
                    setTimeout(() => setIsAutoPlaying(true), 3000)
                  }}
                >
                  <ChevronRight className="h-5 w-5 text-gray-900" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex justify-center gap-1.5 z-10">
                  {featuredEvents.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault()
                        setFeaturedIndex(index)
                        setIsAutoPlaying(false)
                        setTimeout(() => setIsAutoPlaying(true), 3000)
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        index === featuredIndex 
                          ? "w-6 bg-white" 
                          : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            </div>
            
            {/* Detalhes do evento abaixo do slider */}
            {featuredEvents[featuredIndex] && (
              <div className="mt-[18px] md:mt-4 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {featuredEvents[featuredIndex].name}
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  {featuredEvents[featuredIndex].location || featuredEvents[featuredIndex].city ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-[#156634]/85" />
                      <span>
                        {featuredEvents[featuredIndex].location || 
                         `${featuredEvents[featuredIndex].city}${featuredEvents[featuredIndex].state ? ` - ${featuredEvents[featuredIndex].state}` : ""}`}
                      </span>
                    </div>
                  ) : null}
                        {featuredEvents[featuredIndex].event_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-[#156634]/85" />
                            <span>
                              {formatDateFull(featuredEvents[featuredIndex].event_date, featuredEvents[featuredIndex].start_time)}
                            </span>
                          </div>
                        )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra de Busca - Seção própria com fundo branco */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-[#156634]/85" />
              <Input
                type="text"
                placeholder="Buscar desafios"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base border-2 border-[#156634]/10 rounded-lg bg-white shadow-sm focus:border-[#156634]/40 focus:ring-2 focus:ring-[#156634]/10"
              />
            </div>
            <Button className="bg-[#156634]/95 hover:bg-[#156634] text-white text-sm md:text-base h-10 md:h-12 px-4 md:px-6 shadow-md hover:shadow-lg transition-all flex-shrink-0">
              Buscar
            </Button>
            <div className="hidden md:block">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-auto min-w-[160px] h-12 text-base border-2 border-[#156634]/10 rounded-lg bg-white shadow-sm focus:border-[#156634]/40">
                  <SelectValue placeholder="Qualquer lugar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer lugar</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Seções de Eventos por Categoria - Estilo Sympla */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {Object.entries(eventsByCategory).map(([category, categoryEvents]) => {
          const categoryInfo = MODALIDADES_ESPORTIVAS.find((c) => c.value === category)
          if (!categoryInfo || categoryEvents.length === 0) return null

          return (
            <div key={category} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{categoryInfo.label}</h2>
                <Link href={`/vitrine?categoria=${category}`}>
                  <Button variant="ghost" className="text-xs md:text-sm text-[#156634]/95 hover:text-[#156634] px-2 md:px-4 py-1 md:py-2">
                    <span className="hidden sm:inline">Ver tudo</span>
                    <span className="sm:hidden">Ver</span>
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryEvents.slice(0, 4).map((event) => (
                  <Link key={event.id} href={`/evento/${event.slug || event.id}`}>
                    <Card className="group hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-[#156634]/60 rounded-xl bg-white">
                      <div className="relative h-56 md:h-64 w-full overflow-hidden bg-gray-100 rounded-t-xl">
                        {event.banner_url ? (
                          <Image
                            src={event.banner_url}
                            alt={event.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#156634] to-[#1a7a3e]">
                            <Trophy className="h-16 w-16 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-[#156634]/95 transition-colors leading-tight">
                          {event.name}
                        </h3>
                        {event.location || event.city ? (
                          <div className="mb-3 flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-[#156634]/85 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                              <span className="font-medium text-gray-900">{event.location || event.city}</span>
                              {event.state && <span className="text-gray-500">, {event.state}</span>}
                            </p>
                          </div>
                        ) : null}
                        {event.event_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-[#156634]/85 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                              <span className="font-medium text-gray-900">{formatDate(event.event_date)}</span>
                              {event.start_time && <span className="text-gray-500"> às {event.start_time}</span>}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}

        {/* Seção: Todos os Eventos */}
        {regularEvents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Todos os eventos</h2>
              <Link href="/vitrine">
                <Button variant="ghost" className="text-sm text-[#156634]/95 hover:text-[#156634]">
                  Ver tudo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularEvents.map((event) => {
                const categoryInfo = MODALIDADES_ESPORTIVAS.find((c) => c.value === event.category)
                const CategoryIcon = categoryInfo?.icon || Route
                
                return (
                  <Link key={event.id} href={`/evento/${event.slug || event.id}`}>
                    <Card className="group hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-[#156634]/60 rounded-xl bg-white">
                      <div className="relative h-56 md:h-64 w-full overflow-hidden bg-gray-100 rounded-t-xl">
                        {event.banner_url ? (
                          <Image
                            src={event.banner_url}
                            alt={event.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#156634] to-[#1a7a3e]">
                            <Trophy className="h-16 w-16 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-[#156634]/95 transition-colors leading-tight">
                          {event.name}
                        </h3>
                        {event.location || event.city ? (
                          <div className="mb-3 flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-[#156634]/85 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                              <span className="font-medium text-gray-900">{event.location || event.city}</span>
                              {event.state && <span className="text-gray-500">, {event.state}</span>}
                            </p>
                          </div>
                        ) : null}
                        {event.event_date && (
                          <div className="flex items-start gap-2 mb-4">
                            <Calendar className="h-4 w-4 text-[#156634]/85 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                              <span className="font-medium text-gray-900">{formatDate(event.event_date)}</span>
                              {event.start_time && <span className="text-gray-500"> às {event.start_time}</span>}
                            </p>
                          </div>
                        )}
                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs flex items-center gap-1.5 px-2.5 py-1 border-gray-200">
                            <CategoryIcon className="h-3.5 w-3.5 text-[#156634]/85" />
                            <span className="font-medium">{categoryInfo?.label || event.category}</span>
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-[#156634]/85 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || hasActiveFilters ? "Nenhum evento encontrado" : "Nenhum evento disponível"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || hasActiveFilters
                ? "Tente ajustar os filtros ou buscar com outros termos"
                : "Aguarde novos eventos serem adicionados à vitrine"}
            </p>
            {(searchTerm || hasActiveFilters) && (
              <Button onClick={clearFilters} variant="outline" className="text-sm">
                Limpar Filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Rodapé Profissional */}
      <footer className="bg-gray-50/60 border-t border-gray-100 mt-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-10 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-6 lg:gap-8 mb-6 md:mb-8">
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

              <div className="col-span-2 md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                <h3 className="text-xs font-medium text-gray-600">
                  Meios de Pagamento Aceitos
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
                  <span className="text-[#156634]/95">Parcelamento em até 12x</span> no cartão
                </p>
              </div>

              <div className="col-span-1 md:col-span-1 space-y-3 flex flex-col items-center md:items-start md:ml-[20%]">
                <h3 className="text-xs font-medium text-gray-600">
                  Legal
                </h3>
                <div className="flex flex-col gap-1.5">
                  <Link 
                    href="/termos-de-uso" 
                    className="text-xs text-gray-500 hover:text-[#156634]/95 transition-colors text-center md:text-left"
                  >
                    Termos de Uso
                  </Link>
                  <Link 
                    href="/politica-de-privacidade" 
                    className="text-xs text-gray-500 hover:text-[#156634]/95 transition-colors text-center md:text-left"
                  >
                    Política de Privacidade
                  </Link>
                </div>
              </div>

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

            <Separator className="my-6 opacity-30" />

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
