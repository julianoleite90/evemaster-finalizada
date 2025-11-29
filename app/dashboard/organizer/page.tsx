"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, TrendingUp, Plus, Eye, ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/stats-card"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrganizerDashboard() {
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [events, setEvents] = useState<any[]>([])
  const [stats, setStats] = useState({
    inscricoesHoje: 0,
    inscricoesOntem: 0,
    receitaHoje: 0,
    receitaOntem: 0,
    acessosLanding: 0,
    comparativoDia: {
      visualizacoes: 0,
      conversoes: 0,
      taxaConversao: 0
    }
  })
  const [ultimosInscritos, setUltimosInscritos] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Você precisa estar logado")
          return
        }

        // Verificar acesso (organizador principal OU membro de organização)
        const access = await getOrganizerAccess(supabase, user.id)
        
        if (!access) {
          console.error("❌ [DASHBOARD] Usuário não tem acesso ao dashboard do organizador")
          toast.error("Você não tem permissão para acessar este dashboard")
          setLoading(false)
          return
        }

        const organizerId = access.organizerId
        console.log("✅ [DASHBOARD] Acesso autorizado. Organizer ID:", organizerId, "É principal:", access.isPrimary)

        // Buscar eventos do organizador
        const { data: eventsData } = await supabase
          .from("events")
          .select("id, name, slug")
          .eq("organizer_id", organizerId)
          .order("created_at", { ascending: false })

        setEvents(eventsData || [])

        // Filtrar por evento selecionado
        const eventIds = selectedEventId === "all" 
          ? (eventsData?.map(e => e.id) || [])
          : [selectedEventId]

        if (eventIds.length === 0) {
          setLoading(false)
          return
        }

        // Buscar inscrições dos últimos 7 dias
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const ontem = new Date(hoje)
        ontem.setDate(ontem.getDate() - 1)

        const { data: inscricoesHojeData } = await supabase
          .from("registrations")
          .select("id, created_at")
          .in("event_id", eventIds)
          .gte("created_at", hoje.toISOString())

        const { data: inscricoesOntemData } = await supabase
          .from("registrations")
          .select("id, created_at")
          .in("event_id", eventIds)
          .gte("created_at", ontem.toISOString())
          .lt("created_at", hoje.toISOString())

        // Buscar pagamentos
        const { data: pagamentosHoje } = await supabase
          .from("payments")
          .select("total_amount")
          .in("registration_id", inscricoesHojeData?.map(i => i.id) || [])
          .eq("payment_status", "paid")

        const { data: pagamentosOntem } = await supabase
          .from("payments")
          .select("total_amount")
          .in("registration_id", inscricoesOntemData?.map(i => i.id) || [])
          .eq("payment_status", "paid")

        // Buscar últimas inscrições
        const { data: ultimasInscricoes } = await supabase
          .from("registrations")
          .select(`
            id,
            registration_number,
            created_at,
            event_id,
            ticket_id,
            events:event_id (
              name
            )
          `)
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })
          .limit(6)

        // Buscar dados relacionados
        const regIds = ultimasInscricoes?.map(r => r.id) || []
        const ticketIds = ultimasInscricoes?.map(r => r.ticket_id).filter(Boolean) || []
        
        const [athletesData, ticketsData] = await Promise.all([
          supabase
            .from("athletes")
            .select("registration_id, full_name")
            .in("registration_id", regIds),
          supabase
            .from("tickets")
            .select("id, category")
            .in("id", ticketIds)
        ])

        const athletesMap = new Map((athletesData.data || []).map(a => [a.registration_id, a]))
        const ticketsMap = new Map((ticketsData.data || []).map(t => [t.id, t]))

        // Calcular receitas
        const receitaHoje = pagamentosHoje?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0
        const receitaOntem = pagamentosOntem?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0

        // Buscar visualizações dos eventos hoje e ontem
        const { data: visualizacoesHoje, error: errorViewsHoje } = await supabase
          .from("event_views")
          .select("id")
          .in("event_id", eventIds)
          .gte("viewed_at", hoje.toISOString())

        if (errorViewsHoje) {
          console.error("❌ [DASHBOARD] Erro ao buscar visualizações hoje:", errorViewsHoje)
        }

        const { data: visualizacoesOntem, error: errorViewsOntem } = await supabase
          .from("event_views")
          .select("id")
          .in("event_id", eventIds)
          .gte("viewed_at", ontem.toISOString())
          .lt("viewed_at", hoje.toISOString())

        if (errorViewsOntem) {
          console.error("❌ [DASHBOARD] Erro ao buscar visualizações ontem:", errorViewsOntem)
        }

        // Calcular total de visualizações (últimos 30 dias)
        const trintaDiasAtras = new Date(hoje)
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
        const { count: totalVisualizacoes, error: errorTotalViews } = await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds)
          .gte("viewed_at", trintaDiasAtras.toISOString())

        if (errorTotalViews) {
          console.error("❌ [DASHBOARD] Erro ao buscar total de visualizações:", errorTotalViews)
        }

        console.log("📊 [DASHBOARD] Estatísticas de visualizações:", {
          eventIds,
          visualizacoesHoje: visualizacoesHoje?.length || 0,
          visualizacoesOntem: visualizacoesOntem?.length || 0,
          totalVisualizacoes: totalVisualizacoes || 0
        })

        // Calcular taxa de conversão (inscrições / visualizações)
        const visualizacoesHojeCount = visualizacoesHoje?.length || 0
        const conversoesHoje = inscricoesHojeData?.length || 0
        const taxaConversao = visualizacoesHojeCount > 0 
          ? ((conversoesHoje / visualizacoesHojeCount) * 100)
          : 0

        // Formatar últimas inscrições
        const inscricoesFormatadas = ultimasInscricoes?.map((reg: any) => {
          const athlete = athletesMap.get(reg.id)
          const ticket = ticketsMap.get(reg.ticket_id)
          
          return {
            id: reg.id,
            nome: athlete?.full_name || "N/A",
            evento: reg.events?.name || "N/A",
            categoria: ticket?.category || "N/A",
            data: reg.created_at
          }
        }) || []

        setStats({
          inscricoesHoje: inscricoesHojeData?.length || 0,
          inscricoesOntem: inscricoesOntemData?.length || 0,
          receitaHoje,
          receitaOntem,
          acessosLanding: totalVisualizacoes || 0,
          comparativoDia: {
            visualizacoes: visualizacoesHojeCount,
            conversoes: conversoesHoje,
            taxaConversao: Number(taxaConversao.toFixed(2))
          }
        })

        setUltimosInscritos(inscricoesFormatadas)
      } catch (error: any) {
        console.error("Erro ao buscar dados:", error)
        toast.error("Erro ao carregar dados do dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedEventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos seus eventos e inscrições
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {events.length > 0 && (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filtrar por evento" />
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
          )}
        <Button asChild>
          <Link href="/dashboard/organizer/events/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Link>
        </Button>
        </div>
      </div>

      {/* Stats Grid - Comparativo Diário */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Inscrições Hoje"
          currentValue={stats.inscricoesHoje}
          previousValue={stats.inscricoesOntem}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        
        <StatsCard
          title="Receita Hoje"
          currentValue={stats.receitaHoje}
          previousValue={stats.receitaOntem}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          formatType="currency"
        />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acessos Landing Page</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acessosLanding.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visualizações hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comparativo do Dia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visualizações</span>
                <span className="text-sm font-medium">{stats.comparativoDia.visualizacoes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversões</span>
                <span className="text-sm font-medium">{stats.comparativoDia.conversoes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa</span>
                <span className="text-sm font-medium text-green-600/90">{stats.comparativoDia.taxaConversao}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Inscritos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimos Inscritos</CardTitle>
              <CardDescription>
                Lista dos inscritos mais recentes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/organizer/registrations" className="flex items-center">
                Ver todos
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ultimosInscritos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma inscrição ainda</p>
              <p className="text-sm mt-2">Crie um evento para começar a receber inscrições</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nº Inscrição</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Evento</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosInscritos.map((inscrito, index) => (
                    <tr key={inscrito.id || index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-muted-foreground">#{inscrito.id?.substring(0, 8)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{inscrito.nome}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{inscrito.evento}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {inscrito.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(inscrito.data).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
