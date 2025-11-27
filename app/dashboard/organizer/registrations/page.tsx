"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Filter, X, Calendar, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Registration {
  id: string
  numeroInscricao: string
  nome: string
  email: string
  evento: string
  categoria: string
  dataInscricao: string
  statusPagamento: "paid" | "pending" | "cancelled"
  valor: number
  metodoPagamento?: string
}

export default function RegistrationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [eventos, setEventos] = useState<string[]>([])

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser()
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
          // Se ainda não tem perfil, apenas mostrar dados vazios sem erro
          setLoading(false)
          return
        }

        // Buscar eventos do organizador
        const { data: events } = await supabase
          .from("events")
          .select("id, name")
          .eq("organizer_id", organizer.id)

        const eventIds = events?.map(e => e.id) || []
        const eventNames = events?.map(e => e.name) || []
        setEventos(eventNames)

        if (eventIds.length === 0) {
          setRegistrations([])
          setLoading(false)
          return
        }

        // Buscar todas as inscrições dos eventos do organizador
        const { data: allRegistrations, error: regError } = await supabase
          .from("registrations")
          .select(`
            id,
            registration_number,
            created_at,
            event_id,
            ticket_id,
            status,
            events:event_id (
              name
            )
          `)
          .in("event_id", eventIds)
          .order("created_at", { ascending: false })

        if (regError) {
          console.error("Erro ao buscar inscrições:", regError)
          toast.error("Erro ao carregar inscrições")
          return
        }

        // Buscar dados relacionados separadamente
        const registrationIds = allRegistrations?.map(r => r.id) || []
        
        const [athletesData, paymentsData, ticketsData] = await Promise.all([
          supabase
            .from("athletes")
            .select("registration_id, full_name, email")
            .in("registration_id", registrationIds),
          supabase
            .from("payments")
            .select("registration_id, payment_status, total_amount, payment_method")
            .in("registration_id", registrationIds),
          supabase
            .from("tickets")
            .select("id, category, price")
            .in("id", allRegistrations?.map(r => r.ticket_id).filter(Boolean) || [])
        ])

        // Criar mapas para lookup rápido
        const athletesMap = new Map((athletesData.data || []).map(a => [a.registration_id, a]))
        const paymentsMap = new Map((paymentsData.data || []).map(p => [p.registration_id, p]))
        const ticketsMap = new Map((ticketsData.data || []).map(t => [t.id, t]))

        // Formatar dados
        const formattedRegistrations: Registration[] = (allRegistrations || []).map((reg: any) => {
          const athlete = athletesMap.get(reg.id)
          const payment = paymentsMap.get(reg.id)
          const ticket = reg.ticket_id ? ticketsMap.get(reg.ticket_id) : null
          
          return {
            id: reg.id,
            numeroInscricao: reg.registration_number || `INS-${reg.id.substring(0, 8).toUpperCase()}`,
            nome: athlete?.full_name || "N/A",
            email: athlete?.email || "N/A",
            evento: reg.events?.name || "N/A",
            categoria: ticket?.category || "N/A",
            dataInscricao: reg.created_at,
            statusPagamento: reg.status === "confirmed" ? "paid" : (payment?.payment_status as any) || "pending",
            valor: Number(payment?.total_amount || ticket?.price || 0),
            metodoPagamento: payment?.payment_method === "pix" ? "PIX" : 
                            payment?.payment_method === "credit_card" ? "Cartão de Crédito" :
                            payment?.payment_method === "boleto" ? "Boleto" : undefined
          }
        })

        setRegistrations(formattedRegistrations)
      } catch (error: any) {
        console.error("Erro ao buscar inscrições:", error)
        toast.error("Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [])

  const getStatusBadge = (status: Registration["statusPagamento"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Pago
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        )
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada"
    try {
      // Tenta fazer parse da data ISO ou formato simples
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      return format(date, "dd/MM/yyyy")
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Data inválida"
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const nome = (reg.nome || "").toLowerCase()
      const email = (reg.email || "").toLowerCase()
      const numeroInscricao = (reg.numeroInscricao || "").toLowerCase()
      if (
        !nome.includes(search) &&
        !email.includes(search) &&
        !numeroInscricao.includes(search)
      ) {
        return false
      }
    }

    // Filtro de evento
    if (selectedEvent !== "all" && reg.evento !== selectedEvent) {
      return false
    }

    // Filtro de status
    if (selectedStatus !== "all" && reg.statusPagamento !== selectedStatus) {
      return false
    }

    // Filtro de data
    if (dateFrom) {
      try {
        const regDate = new Date(reg.dataInscricao)
        const fromDate = new Date(dateFrom)
        if (isNaN(regDate.getTime()) || isNaN(fromDate.getTime())) return true // Se data inválida, não filtra
        if (regDate < fromDate) return false
      } catch (error) {
        // Se houver erro ao comparar datas, não filtra
        console.error("Erro ao filtrar por data inicial:", error)
      }
    }

    if (dateTo) {
      try {
        const regDate = new Date(reg.dataInscricao)
        const toDate = new Date(dateTo)
        if (isNaN(regDate.getTime()) || isNaN(toDate.getTime())) return true // Se data inválida, não filtra
        toDate.setHours(23, 59, 59, 999) // Fim do dia
        if (regDate > toDate) return false
      } catch (error) {
        // Se houver erro ao comparar datas, não filtra
        console.error("Erro ao filtrar por data final:", error)
      }
    }

    return true
  })

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedEvent("all")
    setSelectedStatus("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters =
    selectedEvent !== "all" ||
    selectedStatus !== "all" ||
    dateFrom !== "" ||
    dateTo !== ""

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
          <h1 className="text-3xl font-bold tracking-tight">Inscritos</h1>
          <p className="text-muted-foreground">
            Gerencie todas as inscrições dos seus eventos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 bg-[#156634] rounded-full" />
            )}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nome, email ou número de inscrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Evento</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    {eventos.map((evento) => (
                      <SelectItem key={evento} value={evento}>
                        {evento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status de Pagamento</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRegistrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredRegistrations.filter((r) => r.statusPagamento === "paid").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRegistrations.filter((r) => r.statusPagamento === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredRegistrations
                  .filter((r) => r.statusPagamento === "paid")
                  .reduce((sum, r) => sum + (Number(r.valor) || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de inscritos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscritos</CardTitle>
          <CardDescription>
            {filteredRegistrations.length} inscrito(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Nº Inscrição
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Evento
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Categoria
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-muted-foreground">
                          {registration.numeroInscricao}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{registration.nome}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {registration.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{registration.evento}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {registration.categoria}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(registration.dataInscricao)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(registration.statusPagamento)}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">
                          {formatCurrency(Number(registration.valor) || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/organizer/registrations/${registration.id}`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <p className="text-muted-foreground">
                        Nenhum inscrito encontrado com os filtros aplicados
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

