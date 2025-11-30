"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, MousePointerClick, Users, DollarSign, Loader2, Calendar } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Stats {
  total_clicks: number
  total_conversions: number
  total_revenue: number
  total_commission: number
  conversion_rate: number
  clicks_by_date: Array<{ date: string; count: number }>
  conversions_by_date: Array<{ date: string; count: number }>
  clicks_by_link: Array<{ link_id: string; title: string; short_code: string; clicks: number }>
  conversions: Array<{
    id: string
    converted_at: string
    conversion_value: number
    commission_earned: number
    athlete_name: string
  }>
}

interface Event {
  id: string
  name: string
}

export default function AffiliateReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [selectedEventId, selectedLinkId])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/affiliate/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedEventId !== 'all') {
        params.append('event_id', selectedEventId)
      }
      if (selectedLinkId !== 'all') {
        params.append('link_id', selectedLinkId)
      }

      const res = await fetch(`/api/affiliate/stats?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  // Preparar dados para gráficos
  const clicksChartData = stats.clicks_by_date.map(item => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    cliques: item.count,
  }))

  const conversionsChartData = stats.conversions_by_date.map(item => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    conversoes: item.count,
  }))

  const combinedChartData = stats.clicks_by_date.map(item => {
    const conversion = stats.conversions_by_date.find(c => c.date === item.date)
    return {
      date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
      cliques: item.count,
      conversoes: conversion?.count || 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho dos seus links e cupons
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clicks}</div>
            <p className="text-xs text-muted-foreground">
              Cliques registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_conversions}</div>
            <p className="text-xs text-muted-foreground">
              Taxa: {stats.conversion_rate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total em vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Seus ganhos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliques ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução de cliques nos seus links</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clicksChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cliques" 
                  stroke="#156634" 
                  strokeWidth={2}
                  name="Cliques"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliques vs Conversões</CardTitle>
            <CardDescription>Comparação entre cliques e conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={combinedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cliques" fill="#3b82f6" name="Cliques" />
                <Bar dataKey="conversoes" fill="#22c55e" name="Conversões" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Link */}
      {stats.clicks_by_link.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Link</CardTitle>
            <CardDescription>Cliques por link de divulgação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.clicks_by_link.map((link) => (
                <div key={link.link_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{link.title}</p>
                    <p className="text-sm text-muted-foreground font-mono">{link.short_code}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{link.clicks}</p>
                      <p className="text-xs text-muted-foreground">Cliques</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversões Recentes */}
      {stats.conversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversões Recentes</CardTitle>
            <CardDescription>Últimas inscrições geradas pelos seus links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.conversions.slice(0, 10).map((conversion) => (
                <div key={conversion.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{conversion.athlete_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(conversion.converted_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        R$ {conversion.conversion_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                      <p className="text-sm text-muted-foreground">Valor</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        R$ {conversion.commission_earned?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                      <p className="text-sm text-muted-foreground">Comissão</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

