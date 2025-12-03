"use client"

import { logger } from "@/lib/utils/logger"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Calendar, MapPin, Search, Loader2, Trophy, Clock, Filter, X, ChevronRight, ChevronLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
  difficulty_level?: string
  race_type?: string
}

const MODALIDADES_ESPORTIVAS = [
  { value: "corrida", label: "Corrida", icon: "🏃" },
  { value: "ciclismo", label: "Ciclismo", icon: "🚴" },
  { value: "triatlo", label: "Triatlo", icon: "🏊" },
  { value: "natacao", label: "Natação", icon: "🏊‍♂️" },
  { value: "caminhada", label: "Caminhada", icon: "🚶" },
  { value: "trail-running", label: "Trail Running", icon: "⛰️" },
  { value: "mountain-bike", label: "Mountain Bike", icon: "🚵" },
  { value: "duatlo", label: "Duatlo", icon: "🏃🚴" },
  { value: "aquatlo", label: "Aquatlo", icon: "🏊🏃" },
  { value: "ciclismo-estrada", label: "Ciclismo de Estrada", icon: "🚴‍♂️" },
  { value: "ciclismo-mtb", label: "Ciclismo MTB", icon: "🚵‍♂️" },
  { value: "outro", label: "Outro", icon: "🎯" },
]

export default function VitrinePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedState, setSelectedState] = useState<string>("all")
  const [featuredIndex, setFeaturedIndex] = useState(0)

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
        logger.error("Erro ao buscar eventos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const stripHtml = (html: string) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#156634] mx-auto mb-4" />
          <p className="text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Simples */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-[#156634] rounded-lg mr-3">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">EveMaster</span>
            </Link>
            <div className="flex items-center gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] border-0 bg-transparent">
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
              <Button variant="ghost" className="text-gray-700">
                Eventos
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Busca Grande */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar experiências"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg border-2 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Banner de Evento em Destaque */}
      {featuredEvents.length > 0 && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="relative">
              {featuredEvents[featuredIndex] && (
                <Link href={`/evento/${featuredEvents[featuredIndex].slug || featuredEvents[featuredIndex].id}`}>
                  <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden group cursor-pointer">
                    {featuredEvents[featuredIndex].banner_url ? (
                      <Image
                        src={featuredEvents[featuredIndex].banner_url}
                        alt={featuredEvents[featuredIndex].name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#156634] to-[#1a7a3e] flex items-center justify-center">
                        <Trophy className="h-24 w-24 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <Badge className="mb-3 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {MODALIDADES_ESPORTIVAS.find((c) => c.value === featuredEvents[featuredIndex].category)?.label || featuredEvents[featuredIndex].category}
                      </Badge>
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 max-w-3xl leading-tight break-words line-clamp-3">
                        {featuredEvents[featuredIndex].name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                        {featuredEvents[featuredIndex].event_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <span>
                              {new Date(featuredEvents[featuredIndex].event_date).toLocaleDateString("pt-BR", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        {(featuredEvents[featuredIndex].location || featuredEvents[featuredIndex].city) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span>
                              {featuredEvents[featuredIndex].location || 
                               `${featuredEvents[featuredIndex].city}${featuredEvents[featuredIndex].state ? ` - ${featuredEvents[featuredIndex].state}` : ""}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Controles do Carrossel */}
              {featuredEvents.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    onClick={prevFeatured}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    onClick={nextFeatured}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  {/* Indicadores */}
                  <div className="flex justify-center gap-2 mt-4">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setFeaturedIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === featuredIndex ? "w-8 bg-[#156634]" : "w-2 bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seção: Explore Categorias */}
      <div className="bg-white border-b py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Explore nossas categorias</h2>
            <Button variant="ghost" className="text-[#156634]">
              Ver tudo
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {MODALIDADES_ESPORTIVAS.slice(0, 6).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value === selectedCategory ? "all" : cat.value)}
                className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                  selectedCategory === cat.value
                    ? "border-[#156634] bg-[#156634]/5"
                    : "border-gray-200 hover:border-[#156634]/50 bg-white"
                }`}
              >
                <span className="text-4xl mb-2">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700 text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      {(hasActiveFilters || searchTerm) && (
        <div className="bg-gray-50 border-b py-4">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  {MODALIDADES_ESPORTIVAS.find((c) => c.value === selectedCategory)?.label || selectedCategory}
                  <button onClick={() => setSelectedCategory("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedState !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  {selectedState}
                  <button onClick={() => setSelectedState("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  Busca: &quot;{searchTerm}&quot;
                  <button onClick={() => setSearchTerm("")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(hasActiveFilters || searchTerm) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar todos
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid de Eventos */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {regularEvents.length === 0 && featuredEvents.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || hasActiveFilters ? "Nenhum evento encontrado" : "Nenhum evento disponível"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || hasActiveFilters
                ? "Tente ajustar os filtros ou buscar com outros termos"
                : "Aguarde novos eventos serem adicionados à vitrine"}
            </p>
            {(searchTerm || hasActiveFilters) && (
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {regularEvents.length} {regularEvents.length === 1 ? "evento encontrado" : "eventos encontrados"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularEvents.map((event) => (
                <Link key={event.id} href={`/evento/${event.slug || event.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 h-full flex flex-col overflow-hidden border border-gray-200 cursor-pointer">
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#156634] to-[#1a7a3e]">
                          <Trophy className="h-12 w-12 text-white/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#156634] transition-colors">
                        {event.name}
                      </h3>
                      {event.event_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="h-4 w-4 text-[#156634]" />
                          <span>
                            {new Date(event.event_date).toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {event.start_time && ` às ${event.start_time}`}
                          </span>
                        </div>
                      )}
                      {(event.location || event.city) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 text-[#156634]" />
                          <span className="truncate">
                            {event.location || `${event.city}${event.state ? `, ${event.state}` : ""}`}
                          </span>
                        </div>
                      )}
                      <div className="mt-auto pt-3 border-t">
                        <Badge variant="outline" className="text-xs">
                          {MODALIDADES_ESPORTIVAS.find((c) => c.value === event.category)?.label || event.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
