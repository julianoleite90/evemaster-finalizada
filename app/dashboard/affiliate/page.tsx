"use client"

import { logger } from "@/lib/utils/logger"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Users, Copy, ExternalLink, Calendar, MapPin, Link2, Tag, Eye, MousePointerClick } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Event {
  id: string
  name: string
  slug: string
  event_date: string
  banner_image_url?: string
  description?: string
  location?: string
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  organizer?: {
    id: string
    company_name: string
  }
}

interface Stats {
  total_clicks: number
  total_conversions: number
  total_revenue: number
  total_commission: number
  conversion_rate: number
}

export default function AffiliateDashboard() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats>({
    total_clicks: 0,
    total_conversions: 0,
    total_revenue: 0,
    total_commission: 0,
    conversion_rate: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Buscar eventos
      const eventsRes = await fetch('/api/affiliate/events')
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      // Buscar estatísticas
      const statsRes = await fetch('/api/affiliate/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      logger.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#156634] mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Afiliado</h1>
        <p className="text-muted-foreground">
          Acompanhe suas conversões e ganhos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total ganho
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_conversions}</div>
            <p className="text-xs text-muted-foreground">
              Inscrições geradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clicks}</div>
            <p className="text-xs text-muted-foreground">
              Cliques nos links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.conversion_rate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_clicks > 0 
                ? `${stats.total_conversions} de ${stats.total_clicks} cliques`
                : 'Sem dados ainda'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Eventos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meus Eventos</CardTitle>
          <CardDescription>
                Eventos onde você é afiliado
          </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/affiliate/links">
                  <Link2 className="h-4 w-4 mr-2" />
                  Meus Links
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/affiliate/coupons">
                  <Tag className="h-4 w-4 mr-2" />
                  Meus Cupons
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Você ainda não é afiliado de nenhum evento.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde um convite de um organizador.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  {event.banner_image_url && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={event.banner_image_url}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
          </div>
                  )}
          <CardHeader>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription className="space-y-1">
                      {event.event_date && (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Comissão:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {event.commission_type === 'percentage'
                            ? `${event.commission_value}%`
                            : `R$ ${event.commission_value.toFixed(2)}`}
                        </Badge>
                </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/affiliate/links?event_id=${event.id}`}>
                            <Link2 className="h-3 w-3 mr-1" />
                            Criar Link
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/affiliate/coupons?event_id=${event.id}`}>
                            <Tag className="h-3 w-3 mr-1" />
                            Criar Cupom
                          </Link>
                        </Button>
              </div>
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link href={`/evento/${event.slug || event.id}`} target="_blank">
                          Ver Evento
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

      {/* Ações Rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Atalhos para tarefas comuns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/affiliate/links">
                  <Link2 className="h-4 w-4 mr-2" />
                  Gerenciar Links
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/affiliate/coupons">
                  <Tag className="h-4 w-4 mr-2" />
                  Gerenciar Cupons
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/affiliate/reports">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Visão geral do seu desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receita Gerada:</span>
                <span className="font-semibold">
                  R$ {stats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sua Comissão:</span>
                <span className="font-semibold text-green-600">
                  R$ {stats.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Eventos Ativos:</span>
                <span className="font-semibold">{events.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
