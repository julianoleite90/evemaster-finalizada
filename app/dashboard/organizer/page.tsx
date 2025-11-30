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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { useRouter } from "next/navigation"

export default function OrganizerDashboard() {
  const { canViewDashboard, isPrimary, loading: permissionsLoading } = useUserPermissions()
  const router = useRouter()
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
  const [chartData, setChartData] = useState({
    categorias: [] as Array<{ name: string; value: number; percent: number }>,
    sexos: [] as Array<{ name: string; value: number; percent: number }>,
    idades: [] as Array<{ name: string; value: number; percent: number }>
  })

  useEffect(() => {
    if (permissionsLoading) {
      // Ainda carregando permissões, manter loading
      return
    }
    
    // Permissões carregadas, definir loading como false se não tiver acesso
    if (!isPrimary && !canViewDashboard) {
      toast.error("Você não tem permissão para visualizar o dashboard")
      router.push("/dashboard/organizer/events")
      setLoading(false)
      return
    }
    
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
          router.push("/dashboard/organizer/events")
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
        // Função auxiliar para converter início do dia local para UTC ISO string
        const getStartOfDayUTC = (date: Date) => {
          const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
          // getTime() retorna timestamp UTC que representa o momento local
          // Para obter a string ISO correta, usamos toISOString() que já faz a conversão
          return localDate.toISOString()
        }
        
        const getEndOfDayUTC = (date: Date) => {
          const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
          return localDate.toISOString()
        }
        
        const agora = new Date()
        const inicioHojeUTC = getStartOfDayUTC(agora)
        const fimHojeUTC = getEndOfDayUTC(agora)
        
        const ontem = new Date(agora)
        ontem.setDate(ontem.getDate() - 1)
        const inicioOntemUTC = getStartOfDayUTC(ontem)

        const { data: inscricoesHojeData } = await supabase
          .from("registrations")
          .select("id, created_at")
          .in("event_id", eventIds)
          .gte("created_at", inicioHojeUTC)
          .lt("created_at", fimHojeUTC)

        const { data: inscricoesOntemData } = await supabase
          .from("registrations")
          .select("id, created_at")
          .in("event_id", eventIds)
          .gte("created_at", inicioOntemUTC)
          .lt("created_at", inicioHojeUTC)

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

        // Buscar todas as inscrições para os gráficos
        const { data: todasInscricoes, error: errorInscricoes } = await supabase
          .from("registrations")
          .select("id, ticket_id")
          .in("event_id", eventIds)

        if (errorInscricoes) {
          console.error("❌ [GRAFICOS] Erro ao buscar inscrições:", errorInscricoes)
        }

        console.log("📊 [GRAFICOS] Total de inscrições encontradas:", todasInscricoes?.length || 0)

        // Buscar dados dos atletas - incluindo age também
        const regIdsParaGraficos = todasInscricoes?.map(r => r.id) || []
        const { data: athletesData, error: errorAthletes } = await supabase
          .from("athletes")
          .select("registration_id, gender, birth_date, age")
          .in("registration_id", regIdsParaGraficos)

        if (errorAthletes) {
          console.error("❌ [GRAFICOS] Erro ao buscar atletas:", errorAthletes)
        }

        console.log("📊 [GRAFICOS] Total de atletas encontrados:", athletesData?.length || 0)
        console.log("📊 [GRAFICOS] Amostra de atletas:", athletesData?.slice(0, 3))

        // Buscar categorias dos tickets
        const ticketIdsParaGraficos = todasInscricoes?.map(r => r.ticket_id).filter(Boolean) || []
        const { data: ticketsData, error: errorTickets } = await supabase
          .from("tickets")
          .select("id, category")
          .in("id", ticketIdsParaGraficos)

        if (errorTickets) {
          console.error("❌ [GRAFICOS] Erro ao buscar tickets:", errorTickets)
        }

        const ticketsMap = new Map((ticketsData || []).map(t => [t.id, t]))
        const athletesMap = new Map((athletesData || []).map(a => [a.registration_id, a]))

        // Calcular dados para gráficos
        const categoriasMap = new Map<string, number>()
        const sexosMap = new Map<string, number>()
        const idadesMap = new Map<string, number>()

        let totalComCategoria = 0
        let totalComSexo = 0
        let totalComIdade = 0

        todasInscricoes?.forEach((reg: any) => {
          // Categoria
          const ticket = ticketsMap.get(reg.ticket_id)
          if (ticket?.category) {
            categoriasMap.set(ticket.category, (categoriasMap.get(ticket.category) || 0) + 1)
            totalComCategoria++
          }

          // Gênero e Idade
          const athlete = athletesMap.get(reg.id)
          if (athlete) {
            // Gênero - verificar valores salvos no banco
            if (athlete.gender) {
              let genderLabel = ''
              const genderValue = athlete.gender.toString().trim()
              
              // Verificar valores possíveis salvos no banco
              if (genderValue === 'M' || genderValue === 'Masculino' || genderValue.toLowerCase() === 'masculino') {
                genderLabel = 'Masculino'
              } else if (genderValue === 'F' || genderValue === 'Feminino' || genderValue.toLowerCase() === 'feminino') {
                genderLabel = 'Feminino'
              } else if (genderValue === 'Outro' || genderValue.toLowerCase() === 'outro') {
                genderLabel = 'Outro'
              } else if (genderValue === 'Prefiro não informar' || genderValue.toLowerCase() === 'prefiro não informar' || genderValue.toLowerCase() === 'prefiro nao informar') {
                genderLabel = 'Prefiro não informar'
              } else {
                // Se não reconhecer, usar o valor original
                genderLabel = genderValue
              }
              
              sexosMap.set(genderLabel, (sexosMap.get(genderLabel) || 0) + 1)
              totalComSexo++
            }

            // Idade - tentar usar age primeiro, depois birth_date
            let age: number | null = null
            
            // Primeiro tentar usar o campo age diretamente
            if (athlete.age && athlete.age > 0 && athlete.age <= 120) {
              age = athlete.age
            }
            // Se não tiver age, calcular a partir de birth_date
            else if (athlete.birth_date) {
              try {
                const birthDate = new Date(athlete.birth_date)
                if (!isNaN(birthDate.getTime())) {
                  const today = new Date()
                  age = today.getFullYear() - birthDate.getFullYear()
                  const monthDiff = today.getMonth() - birthDate.getMonth()
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--
                  }
                }
              } catch (error) {
                console.error('Erro ao calcular idade:', error, athlete.birth_date)
              }
            }

            if (age !== null && age >= 0 && age <= 120) {
              let faixaEtaria = ''
              if (age < 18) faixaEtaria = 'Menor de 18'
              else if (age < 25) faixaEtaria = '18-24'
              else if (age < 35) faixaEtaria = '25-34'
              else if (age < 45) faixaEtaria = '35-44'
              else if (age < 55) faixaEtaria = '45-54'
              else if (age < 65) faixaEtaria = '55-64'
              else faixaEtaria = '65+'
              
              idadesMap.set(faixaEtaria, (idadesMap.get(faixaEtaria) || 0) + 1)
              totalComIdade++
            }
          }
        })

        console.log("📊 [GRAFICOS] Estatísticas:", {
          totalInscricoes: todasInscricoes?.length || 0,
          totalComCategoria,
          totalComSexo,
          totalComIdade,
          categorias: Array.from(categoriasMap.entries()),
          sexos: Array.from(sexosMap.entries()),
          idades: Array.from(idadesMap.entries())
        })

        // Converter para arrays com percentuais - usar total válido para cada categoria
        const categoriasData = Array.from(categoriasMap.entries()).map(([name, value]) => ({
          name,
          value,
          percent: totalComCategoria > 0 ? (value / totalComCategoria) : 0
        }))

        const sexosData = Array.from(sexosMap.entries()).map(([name, value]) => ({
          name,
          value,
          percent: totalComSexo > 0 ? (value / totalComSexo) : 0
        }))

        const idadesData = Array.from(idadesMap.entries()).map(([name, value]) => ({
          name,
          value,
          percent: totalComIdade > 0 ? (value / totalComIdade) : 0
        }))

        setChartData({
          categorias: categoriasData,
          sexos: sexosData,
          idades: idadesData
        })

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
        
        const [athletesDataUltimos, ticketsDataUltimos] = await Promise.all([
          supabase
            .from("athletes")
            .select("registration_id, full_name")
            .in("registration_id", regIds),
          supabase
            .from("tickets")
            .select("id, category")
            .in("id", ticketIds)
        ])

        const athletesMapUltimos = new Map((athletesDataUltimos.data || []).map(a => [a.registration_id, a]))
        const ticketsMapUltimos = new Map((ticketsDataUltimos.data || []).map(t => [t.id, t]))

        // Calcular receitas
        const receitaHoje = pagamentosHoje?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0
        const receitaOntem = pagamentosOntem?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0

        // Buscar visualizações dos eventos hoje e ontem
        // Usar as mesmas datas UTC calculadas acima
        const { data: visualizacoesHoje, error: errorViewsHoje } = await supabase
          .from("event_views")
          .select("id")
          .in("event_id", eventIds)
          .gte("viewed_at", inicioHojeUTC)
          .lt("viewed_at", fimHojeUTC)

        if (errorViewsHoje) {
          console.error("❌ [DASHBOARD] Erro ao buscar visualizações hoje:", errorViewsHoje)
        }

        const { data: visualizacoesOntem, error: errorViewsOntem } = await supabase
          .from("event_views")
          .select("id")
          .in("event_id", eventIds)
          .gte("viewed_at", inicioOntemUTC)
          .lt("viewed_at", inicioHojeUTC)

        if (errorViewsOntem) {
          console.error("❌ [DASHBOARD] Erro ao buscar visualizações ontem:", errorViewsOntem)
        }

        // Calcular total de visualizações (últimos 30 dias)
        const trintaDiasAtras = new Date(agora)
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
        const trintaDiasAtrasUTC = getStartOfDayUTC(trintaDiasAtras)
        const { count: totalVisualizacoes, error: errorTotalViews } = await supabase
          .from("event_views")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds)
          .gte("viewed_at", trintaDiasAtrasUTC)

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
          const athlete = athletesMapUltimos.get(reg.id)
          const ticket = ticketsMapUltimos.get(reg.ticket_id)
          
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
  }, [selectedEventId, permissionsLoading, isPrimary, canViewDashboard])

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
              Últimos 30 dias
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

      {/* Gráficos de Pizza */}
      {(chartData.categorias.length > 0 || chartData.sexos.length > 0 || chartData.idades.length > 0) && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Gráfico por Categoria */}
          {chartData.categorias.length > 0 && (
            <Card className="shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#156634]"></div>
                  Inscritos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={chartData.categorias}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ name, percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {chartData.categorias.map((entry, index) => {
                        const colors = ['#156634', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} inscritos (${props.payload.percent.toFixed(1)}%)`,
                        props.payload.name
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color, fontSize: '12px', fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico por Gênero */}
          {chartData.sexos.length > 0 && (
            <Card className="shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Inscritos por Gênero
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={chartData.sexos}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ name, percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {chartData.sexos.map((entry, index) => {
                        const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#10b981']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} inscritos (${props.payload.percent.toFixed(1)}%)`,
                        props.payload.name
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color, fontSize: '12px', fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico por Idade */}
          {chartData.idades.length > 0 && (
            <Card className="shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Inscritos por Idade
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={chartData.idades}
                      cx="50%"
                      cy="45%"
                      labelLine={true}
                      label={({ name, percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {chartData.idades.map((entry, index) => {
                        const colors = ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#22c55e']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} inscritos (${props.payload.percent.toFixed(1)}%)`,
                        props.payload.name
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color, fontSize: '12px', fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
