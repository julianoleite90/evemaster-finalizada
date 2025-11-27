"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Eye, Settings, Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { getOrganizerEvents } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { updateAllEventSlugs } from "@/lib/supabase/update-slugs"

interface Event {
  id: string
  slug?: string
  name: string
  description: string
  date: string
  location: string
  status: "draft" | "active" | "finished" | "cancelled"
  inscritos: number
  capacidade: number | null
  receita: number
  imagem?: string
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [eventos, setEventos] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingSlugs, setUpdatingSlugs] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Buscar usuário atual
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast.error("Você precisa estar logado")
          return
        }

        // Buscar organizador
        let { data: organizer } = await supabase
          .from("organizers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        // Se não encontrou, tentar criar automaticamente
        if (!organizer) {
          const { data: userData } = await supabase
            .from("users")
            .select("role, full_name")
            .eq("id", user.id)
            .maybeSingle()

          const userRole = userData?.role || user.user_metadata?.role
          if (userRole && (userRole.toUpperCase() === "ORGANIZADOR" || userRole.toUpperCase() === "ORGANIZER")) {
            const companyName = userData?.full_name || user.user_metadata?.full_name || "Organizador"
            const { data: newOrganizer } = await supabase
              .from("organizers")
              .insert({
                user_id: user.id,
                company_name: companyName,
                legal_responsible: companyName,
              })
              .select("id")
              .single()

            if (newOrganizer) {
              organizer = newOrganizer
            }
          }
        }

        if (!organizer) {
          // Se ainda não tem perfil, apenas mostrar lista vazia sem erro
          setEventos([])
          setLoading(false)
          return
        }

        // Buscar eventos
        console.log("=== BUSCANDO EVENTOS ===")
        console.log("Organizer ID:", organizer.id)
        const events = await getOrganizerEvents(organizer.id)
        console.log("Eventos encontrados:", events?.length || 0)
        console.log("Eventos:", events)

        // Buscar todas as inscrições e pagamentos de uma vez
        const eventIds = events.map((e: any) => e.id)
        
        const { data: allRegistrations } = await supabase
          .from("registrations")
          .select("id, event_id")
          .in("event_id", eventIds)

        const registrationIds = allRegistrations?.map((r: any) => r.id) || []
        
        const { data: allPayments } = await supabase
          .from("payments")
          .select("amount, registration_id")
          .eq("payment_status", "paid")
          .in("registration_id", registrationIds)

        // Agrupar por evento
        const statsByEvent: Record<string, { inscritos: number; receita: number }> = {}
        
        // Contar inscrições por evento
        allRegistrations?.forEach((reg: any) => {
          if (!statsByEvent[reg.event_id]) {
            statsByEvent[reg.event_id] = { inscritos: 0, receita: 0 }
          }
          statsByEvent[reg.event_id].inscritos++
        })

        // Calcular receita por evento
        allPayments?.forEach((payment: any) => {
          const reg = allRegistrations?.find((r: any) => r.id === payment.registration_id)
          if (reg && statsByEvent[reg.event_id]) {
            statsByEvent[reg.event_id].receita += parseFloat(payment.amount) || 0
          }
        })

        // Converter para o formato esperado
        const eventosFormatados: Event[] = events.map((event: any) => {
          const stats = statsByEvent[event.id] || { inscritos: 0, receita: 0 }
          return {
            id: event.id,
            slug: event.slug,
            name: event.name,
            description: event.description || "",
            date: event.event_date,
            location: event.location || event.address || "Local a definir",
            status: event.status as "draft" | "active" | "finished" | "cancelled",
            inscritos: stats.inscritos,
            capacidade: event.total_capacity,
            receita: stats.receita,
            imagem: event.banner_url,
          }
        })

        setEventos(eventosFormatados)
      } catch (error: any) {
        console.error("Erro ao buscar eventos:", error)
        toast.error("Erro ao carregar eventos")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleUpdateSlugs = async () => {
    try {
      setUpdatingSlugs(true)
      toast.info("Atualizando slugs dos eventos...")
      
      const result = await updateAllEventSlugs()
      
      if (result.success) {
        toast.success(`Slugs atualizados! ${result.updated} eventos processados`)
        // Recarregar eventos
        window.location.reload()
      } else {
        toast.error("Erro ao atualizar slugs")
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error("Erro ao atualizar slugs")
    } finally {
      setUpdatingSlugs(false)
    }
  }

  const getStatusBadge = (status: Event["status"]) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Rascunho</Badge>
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
      case "finished":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Finalizado</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const filterEvents = (events: Event[]) => {
    if (!searchTerm) return events
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const eventosFiltrados = eventos.length > 0 ? filterEvents(eventos) : []
  const eventosRascunho = eventosFiltrados.filter((e) => e.status === "draft")
  const eventosAtivos = eventosFiltrados.filter((e) => e.status === "active")
  const eventosFinalizados = eventosFiltrados.filter((e) => e.status === "finished")
  const eventosCancelados = eventosFiltrados.filter((e) => e.status === "cancelled")

  // Função para remover tags HTML
  const stripHtml = (html: string) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
  }

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-lg transition-all duration-200 flex flex-col h-full border-2 hover:border-[#156634]/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CardTitle className="text-xl font-bold leading-tight pr-2">{event.name}</CardTitle>
              {getStatusBadge(event.status)}
            </div>
            {event.description && (
              <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {stripHtml(event.description)}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pt-0">
        <div className="space-y-3 flex-1 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <Calendar className="h-4 w-4 flex-shrink-0 text-[#156634]" />
            <span className="font-medium">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <MapPin className="h-4 w-4 flex-shrink-0 text-[#156634]" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm py-1">
            <Users className="h-4 w-4 flex-shrink-0 text-[#156634]" />
            <span className="font-semibold text-foreground">
              {event.inscritos.toLocaleString("pt-BR")}
              {event.capacidade && (
                <span className="text-muted-foreground font-normal">
                  {" / "}{event.capacidade.toLocaleString("pt-BR")} inscritos
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm py-1">
            <span className="text-muted-foreground">Receita:</span>
            <span className="font-semibold text-[#156634] text-base">
              {formatCurrency(event.receita)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-auto border-t border-gray-200">
          <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-[#156634]/5 hover:border-[#156634]/30">
            <Link href={`/evento/${event.slug || event.id}`} target="_blank" className="flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Página</span>
              <span className="sm:hidden">Ver</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-[#156634]/5 hover:border-[#156634]/30">
            <Link href={`/dashboard/organizer/events/${event.id}/settings`} className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
              <span className="sm:hidden">Config</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus eventos esportivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdateSlugs}
            disabled={updatingSlugs}
            variant="outline"
            className="flex items-center"
          >
            {updatingSlugs ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            Atualizar URLs
          </Button>
          <Button asChild>
            <Link href="/dashboard/organizer/events/new" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Link>
          </Button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar eventos por nome ou localização..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs por status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({eventosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Rascunhos ({eventosRascunho.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({eventosAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="finished">
            Finalizados ({eventosFinalizados.length})
          </TabsTrigger>
        </TabsList>

        {/* Todos os Eventos */}
        <TabsContent value="all" className="space-y-4">
          {eventosFiltrados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosFiltrados.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Nenhum evento encontrado" : "Nenhum evento criado"}
                </p>
                <Button asChild>
                  <Link href="/dashboard/organizer/events/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Evento
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Eventos Rascunho */}
        <TabsContent value="draft" className="space-y-4">
          {eventosRascunho.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosRascunho.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum rascunho encontrado" : "Nenhum rascunho"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Eventos Ativos */}
        <TabsContent value="active" className="space-y-4">
          {eventosAtivos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosAtivos.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum evento ativo encontrado" : "Nenhum evento ativo"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Eventos Finalizados */}
        <TabsContent value="finished" className="space-y-4">
          {eventosFinalizados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosFinalizados.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum evento finalizado encontrado" : "Nenhum evento finalizado"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
