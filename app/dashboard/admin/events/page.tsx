"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Calendar, Search, Eye, Edit, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EventsPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          organizer:organizers(
            id,
            company_name,
            user:users(
              id,
              email,
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const search = searchTerm.toLowerCase()
    return (
      event.name?.toLowerCase().includes(search) ||
      event.location?.toLowerCase().includes(search) ||
      event.organizer?.company_name?.toLowerCase().includes(search) ||
      event.organizer?.user?.email?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os eventos da plataforma
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, local ou organizador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                {event.banner_url && (
                  <div className="relative h-32 w-full">
                    <Image
                      src={event.banner_url}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4" />
                      {event.event_date ? new Date(event.event_date).toLocaleDateString("pt-BR") : "Data não definida"}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    <div className="mt-2">
                      Organizador: {event.organizer?.company_name || event.organizer?.user?.full_name || "N/A"}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={event.status === "active" ? "default" : "secondary"}>
                      {event.status === "active" ? "Ativo" : event.status === "draft" ? "Rascunho" : event.status}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/organizer/events/${event.id}/settings`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

