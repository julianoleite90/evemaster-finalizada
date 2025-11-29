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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Download, Filter, X, Calendar, CheckCircle, Clock, XCircle, Loader2, User, Mail, MapPin, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"

interface Registration {
  id: string
  numeroInscricao: string
  nome: string
  email: string
  telefone?: string
  cpf?: string
  dataNascimento?: string
  idade?: number | null
  genero?: string
  evento: string
  categoria: string
  dataInscricao: string
  statusPagamento: "paid" | "pending" | "cancelled"
  valor: number
  metodoPagamento?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  tamanhoCamiseta?: string
}

export default function RegistrationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [eventos, setEventos] = useState<string[]>([])
  
  // Campos disponíveis para exportação
  const availableFields = [
    { key: 'numeroInscricao', label: 'Número de Inscrição', default: true },
    { key: 'nome', label: 'Nome', default: true },
    { key: 'email', label: 'Email', default: true },
    { key: 'telefone', label: 'Telefone', default: false },
    { key: 'cpf', label: 'CPF', default: false },
    { key: 'dataNascimento', label: 'Data de Nascimento', default: false },
    { key: 'idade', label: 'Idade', default: false },
    { key: 'genero', label: 'Gênero', default: false },
    { key: 'evento', label: 'Evento', default: true },
    { key: 'categoria', label: 'Categoria', default: true },
    { key: 'dataInscricao', label: 'Data de Inscrição', default: true },
    { key: 'statusPagamento', label: 'Status de Pagamento', default: true },
    { key: 'valor', label: 'Valor', default: true },
    { key: 'metodoPagamento', label: 'Método de Pagamento', default: false },
    { key: 'endereco', label: 'Endereço', default: false },
    { key: 'numero', label: 'Número', default: false },
    { key: 'complemento', label: 'Complemento', default: false },
    { key: 'bairro', label: 'Bairro', default: false },
    { key: 'cidade', label: 'Cidade', default: false },
    { key: 'estado', label: 'Estado', default: false },
    { key: 'cep', label: 'CEP', default: false },
    { key: 'tamanhoCamiseta', label: 'Tamanho da Camiseta', default: false },
  ]
  
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(availableFields.filter(f => f.default).map(f => f.key))
  )

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

        // Verificar acesso (organizador principal OU membro de organização)
        const access = await getOrganizerAccess(supabase, user.id)
        
        if (!access) {
          console.error("❌ [REGISTRATIONS] Usuário não tem acesso ao dashboard do organizador")
          toast.error("Você não tem permissão para acessar este dashboard")
          setRegistrations([])
          setLoading(false)
          return
        }

        const organizerId = access.organizerId

        // Buscar eventos do organizador
        const { data: events } = await supabase
          .from("events")
          .select("id, name")
          .eq("organizer_id", organizerId)

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
            shirt_size,
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
            .select("registration_id, full_name, email, phone, cpf, birth_date, gender, address, address_number, address_complement, neighborhood, city, state, zip_code")
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

        // Função auxiliar para calcular idade
        const calculateAge = (birthDate: string) => {
          if (!birthDate) return null
          try {
            const birth = new Date(birthDate)
            const today = new Date()
            let age = today.getFullYear() - birth.getFullYear()
            const monthDiff = today.getMonth() - birth.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--
            }
            return age
          } catch {
            return null
          }
        }

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
            telefone: athlete?.phone || undefined,
            cpf: athlete?.cpf || undefined,
            dataNascimento: athlete?.birth_date || undefined,
            idade: athlete?.birth_date ? calculateAge(athlete.birth_date) : undefined,
            genero: athlete?.gender === "male" ? "Masculino" : athlete?.gender === "female" ? "Feminino" : athlete?.gender || undefined,
            evento: reg.events?.name || "N/A",
            categoria: ticket?.category || "N/A",
            dataInscricao: reg.created_at,
            statusPagamento: reg.status === "confirmed" ? "paid" : (payment?.payment_status as any) || "pending",
            valor: Number(payment?.total_amount || ticket?.price || 0),
            metodoPagamento: payment?.payment_method === "pix" ? "PIX" : 
                            payment?.payment_method === "credit_card" ? "Cartão de Crédito" :
                            payment?.payment_method === "boleto" ? "Boleto" : undefined,
            endereco: athlete?.address || undefined,
            numero: athlete?.address_number || undefined,
            complemento: athlete?.address_complement || undefined,
            bairro: athlete?.neighborhood || undefined,
            cidade: athlete?.city || undefined,
            estado: athlete?.state || undefined,
            cep: athlete?.zip_code || undefined,
            tamanhoCamiseta: reg.shirt_size || undefined
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
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 text-xs font-medium">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 text-xs font-medium">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-xs font-medium">
            <XCircle className="h-3 w-3 mr-1" />
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
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      return format(date, "dd/MM/yyyy")
    } catch (error) {
      return "Data inválida"
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
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

    if (selectedEvent !== "all" && reg.evento !== selectedEvent) {
      return false
    }

    if (selectedStatus !== "all" && reg.statusPagamento !== selectedStatus) {
      return false
    }

    if (dateFrom) {
      try {
        const regDate = new Date(reg.dataInscricao)
        const fromDate = new Date(dateFrom)
        if (isNaN(regDate.getTime()) || isNaN(fromDate.getTime())) return true
        if (regDate < fromDate) return false
      } catch (error) {
        console.error("Erro ao filtrar por data inicial:", error)
      }
    }

    if (dateTo) {
      try {
        const regDate = new Date(reg.dataInscricao)
        const toDate = new Date(dateTo)
        if (isNaN(regDate.getTime()) || isNaN(toDate.getTime())) return true
        toDate.setHours(23, 59, 59, 999)
        if (regDate > toDate) return false
      } catch (error) {
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

  const exportToCSV = () => {
    if (selectedFields.size === 0) {
      toast.error("Selecione pelo menos um campo para exportar")
      return
    }

    if (filteredRegistrations.length === 0) {
      toast.error("Não há inscrições para exportar")
      return
    }

    // Mapear campos para labels
    const fieldLabels: Record<string, string> = {}
    availableFields.forEach(field => {
      fieldLabels[field.key] = field.label
    })

    // Criar cabeçalho CSV
    const headers = Array.from(selectedFields).map(key => fieldLabels[key] || key)
    const csvRows = [headers.join(',')]

    // Adicionar dados
    filteredRegistrations.forEach(reg => {
      const row: string[] = []
      selectedFields.forEach(key => {
        let value: any = reg[key as keyof Registration]
        
        // Formatar valores específicos
        if (key === 'dataInscricao' && value) {
          value = formatDate(value)
        } else if (key === 'dataNascimento' && value) {
          value = formatDate(value)
        } else if (key === 'statusPagamento') {
          value = value === 'paid' ? 'Pago' : value === 'pending' ? 'Pendente' : 'Cancelado'
        } else if (key === 'valor' && value) {
          value = formatCurrency(Number(value) || 0)
        } else if (key === 'cpf' && value) {
          // Formatar CPF
          const cleanCPF = String(value).replace(/\D/g, '')
          if (cleanCPF.length === 11) {
            value = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          }
        } else if (key === 'cep' && value) {
          // Formatar CEP
          const cleanCEP = String(value).replace(/\D/g, '')
          if (cleanCEP.length === 8) {
            value = cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
          }
        } else if (key === 'telefone' && value) {
          // Formatar telefone
          const cleanPhone = String(value).replace(/\D/g, '')
          if (cleanPhone.length === 11) {
            value = cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
          } else if (cleanPhone.length === 10) {
            value = cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
          }
        }
        
        // Se valor for undefined/null, usar 'N/A'
        if (value === undefined || value === null || value === '') {
          value = 'N/A'
        }
        
        // Escapar vírgulas e aspas no CSV
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""')
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`
          }
        }
        
        row.push(value || '')
      })
      csvRows.push(row.join(','))
    })

    // Criar arquivo e fazer download
    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inscricoes_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exportação realizada com sucesso! ${filteredRegistrations.length} inscrição(ões) exportada(s)`)
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Inscritos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as inscrições dos seus eventos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 h-1.5 w-1.5 bg-[#156634] rounded-full" />
            )}
          </Button>
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Exportar Inscrições</DialogTitle>
                <DialogDescription>
                  Selecione os campos que deseja incluir na exportação
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFields(new Set(availableFields.map(f => f.key)))
                    }}
                    className="h-8 text-xs"
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFields(new Set(availableFields.filter(f => f.default).map(f => f.key)))
                    }}
                    className="h-8 text-xs"
                  >
                    Padrão
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFields(new Set())}
                    className="h-8 text-xs"
                  >
                    Limpar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {availableFields.map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.has(field.key)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedFields)
                          if (checked) {
                            newSet.add(field.key)
                          } else {
                            newSet.delete(field.key)
                          }
                          setSelectedFields(newSet)
                        }}
                      />
                      <label
                        htmlFor={field.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {selectedFields.size} campo(s) selecionado(s) de {filteredRegistrations.length} inscrição(ões)
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedFields.size === 0) {
                      toast.error("Selecione pelo menos um campo para exportar")
                      return
                    }
                    exportToCSV()
                    setShowExportDialog(false)
                  }}
                  disabled={selectedFields.size === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
          className="pl-9 h-9"
        />
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Filtros</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Evento</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="h-9 text-sm">
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

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 text-sm">
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

              <div className="space-y-1.5">
                <Label className="text-xs">Data Inicial</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Data Final</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas rápidas */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-xl font-semibold mt-1">{filteredRegistrations.length}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pagas</p>
                <p className="text-xl font-semibold mt-1 text-green-600">
                  {filteredRegistrations.filter((r) => r.statusPagamento === "paid").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
                <p className="text-xl font-semibold mt-1 text-yellow-600">
                  {filteredRegistrations.filter((r) => r.statusPagamento === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Receita</p>
                <p className="text-xl font-semibold mt-1">
                  {formatCurrency(
                    filteredRegistrations
                      .filter((r) => r.statusPagamento === "paid")
                      .reduce((sum, r) => sum + (Number(r.valor) || 0), 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de inscritos - Layout moderno */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Lista de Inscritos</CardTitle>
              <CardDescription className="text-xs mt-1">
                {filteredRegistrations.length} inscrito(s) encontrado(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRegistrations.length > 0 ? (
            <div className="divide-y">
              {filteredRegistrations.map((registration) => (
                <Link
                  key={registration.id}
                  href={`/dashboard/organizer/registrations/${registration.id}`}
                  className="block hover:bg-gray-50/50 transition-colors"
                >
                  <div className="px-4 py-3 flex items-center gap-4">
                    {/* Avatar/Inicial */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-[#156634]/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#156634]">
                          {registration.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {registration.nome}
                        </p>
                        {getStatusBadge(registration.statusPagamento)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{registration.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{registration.evento}</span>
                        </span>
                      </div>
                    </div>

                    {/* Informações secundárias */}
                    <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="text-right">
                        <p className="font-mono text-[10px] text-gray-500 mb-0.5">
                          {registration.numeroInscricao}
                        </p>
                        <p className="text-[10px]">{formatDate(registration.dataInscricao)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {registration.categoria}
                        </Badge>
                        <p className="text-xs font-medium text-gray-900">
                          {formatCurrency(Number(registration.valor) || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Informações compactas */}
                    <div className="md:hidden flex flex-col items-end gap-1 text-xs">
                      <p className="font-mono text-[10px] text-gray-500">
                        {registration.numeroInscricao}
                      </p>
                      <p className="text-xs font-medium text-gray-900">
                        {formatCurrency(Number(registration.valor) || 0)}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {registration.categoria}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum inscrito encontrado com os filtros aplicados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
