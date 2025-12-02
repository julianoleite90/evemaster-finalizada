"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, TrendingUp, Plus, Eye, ArrowUpRight, Loader2, MoveRight, X } from "lucide-react"
import Link from "next/link"
import { StatsCard } from "@/components/dashboard/stats-card"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { useRouter } from "next/navigation"
import { parallelQueries } from "@/lib/supabase/query-safe"
import { DashboardErrorBoundary } from "@/components/error/DashboardErrorBoundary"

function OrganizerDashboardContent() {
  const { canViewDashboard, isPrimary, loading: permissionsLoading } = useUserPermissions()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [showFilterTip, setShowFilterTip] = useState(true)
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
  const [lineChartData, setLineChartData] = useState<Array<{ date: string; inscricoes: number; acessos: number }>>([])

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

        // Buscar eventos do organizador (com banner para exibição no filtro)
        // Excluir eventos em rascunho (draft)
        const { data: eventsData } = await supabase
          .from("events")
          .select("id, name, slug, banner_url, event_date, status")
          .eq("organizer_id", organizerId)
          .neq("status", "draft")
          .order("event_date", { ascending: false })

        // Filtrar eventos de teste/musta
        const filteredEvents = eventsData?.filter(e => e.name && !e.name.toLowerCase().includes('musta')) || []
        setEvents(filteredEvents)

        // Filtrar por evento selecionado
        const eventIds = selectedEventId === "all" 
          ? filteredEvents.map(e => e.id)
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

        // OTIMIZAÇÃO: Buscar dados em paralelo com parallelQueries (não crasheia se uma falhar)
        const { data: registrationsData, errors: regErrors } = await parallelQueries({
          inscricoesHoje: () => supabase
            .from("registrations")
            .select("id, created_at")
            .in("event_id", eventIds)
            .gte("created_at", inicioHojeUTC)
            .lt("created_at", fimHojeUTC)
            .limit(500),
          inscricoesOntem: () => supabase
            .from("registrations")
            .select("id, created_at")
            .in("event_id", eventIds)
            .gte("created_at", inicioOntemUTC)
            .lt("created_at", inicioHojeUTC)
            .limit(500),
          todasInscricoes: () => supabase
            .from("registrations")
            .select("id, ticket_id")
            .in("event_id", eventIds)
            .limit(1000)
        }, { timeout: 15000, retries: 1 })

        const inscricoesHojeData = registrationsData.inscricoesHoje || []
        const inscricoesOntemData = registrationsData.inscricoesOntem || []
        const todasInscricoes = registrationsData.todasInscricoes || []

        if (Object.keys(regErrors).length > 0) {
          console.warn("⚠️ [DASHBOARD] Algumas queries de inscrições falharam:", regErrors)
        }

        // Buscar pagamentos em paralelo
        const { data: paymentsData } = await parallelQueries({
          pagamentosHoje: () => supabase
            .from("payments")
            .select("total_amount")
            .in("registration_id", inscricoesHojeData?.map(i => i.id) || [])
            .eq("payment_status", "paid")
            .limit(500),
          pagamentosOntem: () => supabase
            .from("payments")
            .select("total_amount")
            .in("registration_id", inscricoesOntemData?.map(i => i.id) || [])
            .eq("payment_status", "paid")
            .limit(500)
        }, { timeout: 10000 })

        const pagamentosHoje = paymentsData.pagamentosHoje || []
        const pagamentosOntem = paymentsData.pagamentosOntem || []

        // Buscar dados de atletas e tickets com parallelQueries
        const regIdsParaGraficos = todasInscricoes?.map(r => r.id) || []
        const ticketIdsParaGraficos = todasInscricoes?.map(r => r.ticket_id).filter(Boolean) || []

        const { data: chartData, errors: chartErrors } = await parallelQueries({
          athletes: () => supabase
            .from("athletes")
            .select("registration_id, gender, birth_date, age")
            .in("registration_id", regIdsParaGraficos)
            .limit(1000),
          tickets: () => supabase
            .from("tickets")
            .select("id, category")
            .in("id", ticketIdsParaGraficos)
            .limit(1000)
        }, { timeout: 10000, retries: 1 })

        if (Object.keys(chartErrors).length > 0) {
          console.warn("⚠️ [DASHBOARD] Erros ao buscar dados de gráficos:", chartErrors)
        }

        const athletesData = chartData.athletes || []
        const ticketsData = chartData.tickets || []

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

        // Buscar dados para gráfico de linha (últimos 7 dias)
        const seteDiasAtras = new Date(agora)
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 6) // 7 dias incluindo hoje
        const seteDiasAtrasUTC = getStartOfDayUTC(seteDiasAtras)

        const { data: inscricoesUltimos7Dias } = await supabase
          .from("registrations")
          .select("id, created_at")
          .in("event_id", eventIds)
          .gte("created_at", seteDiasAtrasUTC)

        // Buscar acessos à landing page dos últimos 7 dias
        const { data: acessosUltimos7Dias } = await supabase
          .from("event_views")
          .select("id, viewed_at")
          .in("event_id", eventIds)
          .gte("viewed_at", seteDiasAtrasUTC)

        // Agrupar por dia
        const diasMap = new Map<string, { inscricoes: number; acessos: number }>()
        
        // Inicializar todos os 7 dias
        for (let i = 6; i >= 0; i--) {
          const data = new Date(agora)
          data.setDate(data.getDate() - i)
          const key = data.toISOString().split('T')[0]
          diasMap.set(key, { inscricoes: 0, acessos: 0 })
        }

        // Contar inscrições por dia
        inscricoesUltimos7Dias?.forEach(reg => {
          const dia = new Date(reg.created_at).toISOString().split('T')[0]
          const current = diasMap.get(dia)
          if (current) {
            current.inscricoes++
          }
        })

        // Contar acessos por dia
        acessosUltimos7Dias?.forEach(acesso => {
          const dia = new Date(acesso.viewed_at).toISOString().split('T')[0]
          const current = diasMap.get(dia)
          if (current) {
            current.acessos++
          }
        })

        // Converter para array ordenado
        const lineData = Array.from(diasMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, data]) => ({
            date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
            inscricoes: data.inscricoes,
            acessos: data.acessos
          }))

        setLineChartData(lineData)

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
        
        const { data: lastRegData } = await parallelQueries({
          athletes: () => supabase
            .from("athletes")
            .select("registration_id, full_name")
            .in("registration_id", regIds)
            .limit(10),
          tickets: () => supabase
            .from("tickets")
            .select("id, category")
            .in("id", ticketIds)
            .limit(10)
        }, { timeout: 8000 })

        const athletesMapUltimos = new Map((lastRegData.athletes || []).map(a => [a.registration_id, a]))
        const ticketsMapUltimos = new Map((lastRegData.tickets || []).map(t => [t.id, t]))

        // Calcular receitas
        const receitaHoje = pagamentosHoje?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0
        const receitaOntem = pagamentosOntem?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0

        // OTIMIZAÇÃO: Buscar visualizações com parallelQueries
        const trintaDiasAtras = new Date(agora)
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
        const trintaDiasAtrasUTC = getStartOfDayUTC(trintaDiasAtras)

        const { data: viewsData, errors: viewsErrors } = await parallelQueries({
          viewsHoje: () => supabase
            .from("event_views")
            .select("id")
            .in("event_id", eventIds)
            .gte("viewed_at", inicioHojeUTC)
            .lt("viewed_at", fimHojeUTC)
            .limit(1000),
          viewsOntem: () => supabase
            .from("event_views")
            .select("id")
            .in("event_id", eventIds)
            .gte("viewed_at", inicioOntemUTC)
            .lt("viewed_at", inicioHojeUTC)
            .limit(1000),
          totalViews: () => supabase
            .from("event_views")
            .select("*", { count: "exact", head: true })
            .in("event_id", eventIds)
            .gte("viewed_at", trintaDiasAtrasUTC)
        }, { timeout: 10000 })

        const visualizacoesHoje = viewsData.viewsHoje || []
        const visualizacoesOntem = viewsData.viewsOntem || []
        const totalVisualizacoes = viewsData.totalViews?.count || 0

        if (Object.keys(viewsErrors).length > 0) {
          console.warn("⚠️ [DASHBOARD] Erros ao buscar visualizações:", viewsErrors)
        }
        if (errorViewsOntem) console.error("❌ [DASHBOARD] Erro visualizações ontem:", errorViewsOntem)
        if (errorTotalViews) console.error("❌ [DASHBOARD] Erro total visualizações:", errorTotalViews)

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
            registration_number: reg.registration_number,
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
          {events.filter(e => e.name && !e.name.toLowerCase().includes('musta')).length > 0 && (
            <>
              {/* Notificação animada à esquerda */}
              {showFilterTip && (
                <div className="hidden md:flex items-center gap-1 animate-bounce">
                  <div className="bg-[#156634]/5 border border-[#156634]/10 text-[#156634] text-xs px-2 py-1 rounded flex items-center gap-1.5">
                    <span className="font-medium">Filtre por evento</span>
                    <MoveRight className="w-3.5 h-3.5" />
                  </div>
                  <button 
                    onClick={() => setShowFilterTip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full md:w-[260px] h-9">
                  <SelectValue placeholder="Filtrar por evento" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px] w-[280px]">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3 h-3 text-gray-500" />
                      </div>
                      <span className="text-sm">Todos</span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {events.filter(e => e.name && !e.name.toLowerCase().includes('musta')).length}
                      </span>
                    </div>
                  </SelectItem>
                  {events
                    .filter(event => event.name && !event.name.toLowerCase().includes('musta'))
                    .map((event) => (
                    <SelectItem key={event.id} value={event.id} title={event.name}>
                      <div className="flex items-center gap-2 group/item">
                        {event.banner_url ? (
                          <img 
                            src={event.banner_url} 
                            alt="" 
                            className="w-5 h-5 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded bg-[#156634]/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-3 h-3 text-[#156634]" />
                          </div>
                        )}
                        <span className="text-sm truncate max-w-[190px]" title={event.name}>{event.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
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

      {/* Gráficos - Layout: Pizzas à esquerda, Linha à direita */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bloco com 3 Gráficos de Pizza */}
        {(chartData.categorias.length > 0 || chartData.sexos.length > 0 || chartData.idades.length > 0) && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Distribuição de Inscritos</CardTitle>
              <CardDescription>Categoria, Gênero e Faixa Etária</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Pizza - Categoria */}
                {chartData.categorias.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Categoria</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={chartData.categorias}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          innerRadius={20}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {chartData.categorias.map((entry, index) => {
                            const colors = ['#156634', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6']
                            return <Cell key={`cell-cat-${index}`} fill={colors[index % colors.length]} />
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} (${(props.payload.percent * 100).toFixed(0)}%)`,
                            props.payload.name
                          ]}
                          contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {chartData.categorias.map((item, idx) => {
                        const colors = ['#156634', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6']
                        const total = chartData.categorias.reduce((s, i) => s + i.value, 0)
                        const percent = total > 0 ? (item.value / total) * 100 : 0
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-600 truncate max-w-[60px]" title={item.name}>{item.name}</span>
                              <span className="font-medium text-gray-800">{percent.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all" 
                                style={{ width: `${percent}%`, backgroundColor: colors[idx % colors.length] }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Pizza - Gênero */}
                {chartData.sexos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Gênero</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={chartData.sexos}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          innerRadius={20}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {chartData.sexos.map((entry, index) => {
                            const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4']
                            return <Cell key={`cell-sex-${index}`} fill={colors[index % colors.length]} />
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} (${(props.payload.percent * 100).toFixed(0)}%)`,
                            props.payload.name
                          ]}
                          contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {chartData.sexos.map((item, idx) => {
                        const colors = ['#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4']
                        const total = chartData.sexos.reduce((s, i) => s + i.value, 0)
                        const percent = total > 0 ? (item.value / total) * 100 : 0
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="font-medium text-gray-800">{percent.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all" 
                                style={{ width: `${percent}%`, backgroundColor: colors[idx % colors.length] }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Pizza - Idade */}
                {chartData.idades.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Faixa Etária</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={chartData.idades}
                          cx="50%"
                          cy="50%"
                          outerRadius={45}
                          innerRadius={20}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {chartData.idades.map((entry, index) => {
                            const colors = ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316']
                            return <Cell key={`cell-age-${index}`} fill={colors[index % colors.length]} />
                          })}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} (${(props.payload.percent * 100).toFixed(0)}%)`,
                            props.payload.name
                          ]}
                          contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {chartData.idades.map((item, idx) => {
                        const colors = ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316']
                        const total = chartData.idades.reduce((s, i) => s + i.value, 0)
                        const percent = total > 0 ? (item.value / total) * 100 : 0
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="font-medium text-gray-800">{percent.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all" 
                                style={{ width: `${percent}%`, backgroundColor: colors[idx % colors.length] }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Linha - Inscrições e Acessos últimos 7 dias */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evolução - Últimos 7 dias</CardTitle>
            <CardDescription>Acessos à landing page vs Inscrições</CardDescription>
          </CardHeader>
          <CardContent>
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInscricoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#156634" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#156634" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}`,
                      name === 'inscricoes' ? 'Inscrições' : 'Acessos LP'
                    ]}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={30}
                    formatter={(value) => (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {value === 'acessos' ? 'Acessos Landing Page' : 'Inscrições'}
                      </span>
                    )}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="acessos" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#colorAcessos)"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#3b82f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inscricoes" 
                    stroke="#156634" 
                    strokeWidth={2}
                    fill="url(#colorInscricoes)"
                    dot={{ fill: '#156634', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#156634' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                Sem dados para exibir
              </div>
            )}
            {lineChartData.length > 0 && (
              <div className="flex items-center justify-center gap-8 mt-3 pt-3 border-t">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {lineChartData.reduce((sum, d) => sum + d.acessos, 0)}
                  </p>
                  <p className="text-xs text-gray-500">Acessos LP</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#156634]">
                    {lineChartData.reduce((sum, d) => sum + d.inscricoes, 0)}
                  </p>
                  <p className="text-xs text-gray-500">Inscrições</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">
                    {(() => {
                      const totalAcessos = lineChartData.reduce((sum, d) => sum + d.acessos, 0)
                      const totalInscricoes = lineChartData.reduce((sum, d) => sum + d.inscricoes, 0)
                      return totalAcessos > 0 ? ((totalInscricoes / totalAcessos) * 100).toFixed(1) : '0'
                    })()}%
                  </p>
                  <p className="text-xs text-gray-500">Conversão</p>
                </div>
              </div>
            )}
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
                        <span className="text-sm font-mono text-muted-foreground">
                          {inscrito.registration_number || `#${inscrito.id?.substring(0, 8)}`}
                        </span>
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

// Wrap com Error Boundary para proteger contra crashes
export default function OrganizerDashboard() {
  return (
    <DashboardErrorBoundary page="organizer-dashboard">
      <OrganizerDashboardContent />
    </DashboardErrorBoundary>
  )
}
