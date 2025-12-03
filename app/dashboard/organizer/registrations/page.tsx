"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logger } from "@/lib/utils/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Filter, Loader2, ChevronRight, Send, CheckCircle, Clock, XCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { parallelQueries, safeQuery } from "@/lib/supabase/query-safe"
import { DashboardErrorBoundary } from "@/components/error/DashboardErrorBoundary"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"
import { StatsCards, RegistrationRow, FiltersCard } from "./components"

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
  cupomCodigo?: string
  cupomDesconto?: number
  clubeId?: string
  clubeNome?: string
  afiliadoId?: string
  afiliadoNome?: string
}

function RegistrationsPageContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("paid")
  const [selectedClub, setSelectedClub] = useState<string>("all")
  const [selectedCoupon, setSelectedCoupon] = useState<string>("all")
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [clubesList, setClubesList] = useState<Array<{ id: string; name: string }>>([])
  const [couponsList, setCouponsList] = useState<Array<{ code: string }>>([])
  const [affiliatesList, setAffiliatesList] = useState<Array<{ id: string; name: string }>>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [eventos, setEventos] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [emailRecipients, setEmailRecipients] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [organizerName, setOrganizerName] = useState<string>("")
  const [eventsList, setEventsList] = useState<Array<{ id: string; name: string }>>([])
  
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
          logger.error("❌ [REGISTRATIONS] Usuário não tem acesso ao dashboard do organizador")
          toast.error("Você não tem permissão para acessar este dashboard")
          setRegistrations([])
          setLoading(false)
          return
        }

        const organizerId = access.organizerId

        // Buscar dados do organizador
        const { data: organizer } = await supabase
          .from("organizers")
          .select("company_name")
          .eq("id", organizerId)
          .single()

        if (organizer) {
          setOrganizerName(organizer.company_name || "Organizador")
        }

        // Buscar eventos do organizador (excluir cancelados dos filtros)
        const { data: events } = await supabase
          .from("events")
          .select("id, name")
          .eq("organizer_id", organizerId)
          .neq("status", "cancelled")

        const eventIds = events?.map(e => e.id) || []
        const eventNames = events?.map(e => e.name) || []
        setEventos(eventNames)
        setEventsList(events || [])

        if (eventIds.length === 0) {
          setRegistrations([])
          setLoading(false)
          return
        }

        // Buscar inscrições com LIMITE para evitar crash
        const registrationsResult = await safeQuery(
          async () => await supabase
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
            .limit(500), // LIMITE: máximo 500 registros por vez
          { timeout: 15000, retries: 2 }
        )

        if (registrationsResult.error) {
          logger.error("Erro ao buscar inscrições:", registrationsResult.error)
          toast.error("Erro ao carregar inscrições")
          return
        }

        // Helper para desembrulhar arrays (podem vir como array ou { count, data })
        const extractArray = (val: any) => Array.isArray(val) ? val : (val?.data || [])
        
        const allRegistrations = extractArray(registrationsResult.data)

        // Buscar dados relacionados com parallelQueries (não falha tudo se uma query falhar)
        const registrationIds = allRegistrations?.map((r: any) => r.id) || []
        const ticketIds = allRegistrations?.map((r: any) => r.ticket_id).filter(Boolean) || []
        
        const { data: relatedData, errors } = await parallelQueries({
          athletes: async () => await supabase
            .from("athletes")
            .select("registration_id, full_name, email, phone, cpf, birth_date, gender, address, address_number, address_complement, neighborhood, city, state, zip_code")
            .in("registration_id", registrationIds)
            .limit(500),
          payments: async () => await supabase
            .from("payments")
            .select("registration_id, payment_status, total_amount, payment_method")
            .in("registration_id", registrationIds)
            .limit(500),
          tickets: async () => await supabase
            .from("tickets")
            .select("id, category, price")
            .in("id", ticketIds)
            .limit(500),
          clubes: async () => await supabase
            .from("running_clubs")
            .select("id, name, event_id")
            .in("event_id", eventIds)
            .eq("status", "accepted")
        }, { timeout: 10000, retries: 1 })

        // Log erros mas não bloqueia (queries independentes)
        if (Object.keys(errors).length > 0) {
          logger.warn("⚠️ Algumas queries falharam (não crítico):", errors)
        }

        // Usar extractArray para desembrulhar os dados do parallelQueries
        const athletesData = { data: extractArray(relatedData.athletes) }
        const paymentsData = { data: extractArray(relatedData.payments) }
        const ticketsData = { data: extractArray(relatedData.tickets) }
        const clubesData = { data: extractArray(relatedData.clubes) }

        // Criar mapas para lookup rápido
        const athletesMap: Map<string, any> = new Map((athletesData.data || []).map((a: any) => [a.registration_id, a]))
        const paymentsMap: Map<string, any> = new Map((paymentsData.data || []).map((p: any) => [p.registration_id, p]))
        const ticketsMap: Map<string, any> = new Map((ticketsData.data || []).map((t: any) => [t.id, t]))
        const clubesMap: Map<string, any> = new Map((clubesData.data || []).map((c: any) => [c.id, c]))
        
        // Preparar lista de clubes para o filtro
        const uniqueClubes = Array.from(new Map((clubesData.data || []).map((c: any) => [c.id, c])).values())
        setClubesList(uniqueClubes.map((c: any) => ({ id: c.id, name: c.name || `Clube ${c.id.substring(0, 8)}` })))

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
          // NOTA: running_club_id não existe em payments
          // TODO: Buscar clube via running_club_participants usando registration_id
          const clube: any = null // payment?.running_club_id ? clubesMap.get(payment.running_club_id) : null
          
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
            statusPagamento: reg.status === "cancelled" ? "cancelled" : reg.status === "confirmed" ? "paid" : (payment?.payment_status as any) || "pending",
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
            tamanhoCamiseta: reg.shirt_size || undefined,
            cupomCodigo: undefined, // payment?.coupon_code (não existe em payments)
            cupomDesconto: undefined, // payment?.discount_amount (não existe em payments)
            clubeId: undefined, // payment?.running_club_id (não existe em payments)
            clubeNome: clube?.name || undefined
          }
        })

        setRegistrations(formattedRegistrations)
      } catch (error: any) {
        logger.error("Erro ao buscar inscrições:", error)
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

  const formatDate = (dateString: string, includeTime: boolean = false) => {
    if (!dateString) return "Data não informada"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      // Usar toLocaleString que já converte corretamente para timezone local
      if (includeTime) {
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Função para copiar texto ao clicar
  const handleCopy = async (e: React.MouseEvent, text: string, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Copiado para a área de transferência!")
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error("Erro ao copiar")
    }
  }

  // Filtrar registrations pelo evento (para os cards de estatísticas)
  const eventFilteredRegistrations = registrations.filter((reg) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const nome = (reg.nome || "").toLowerCase()
      const email = (reg.email || "").toLowerCase()
      const numeroInscricao = (reg.numeroInscricao || "").toLowerCase()
      if (!nome.includes(search) && !email.includes(search) && !numeroInscricao.includes(search)) {
        return false
      }
    }
    if (selectedEvent !== "all" && reg.evento !== selectedEvent) return false
    if (selectedClub !== "all") {
      if (selectedClub === "with_club" && !reg.clubeId) return false
      if (selectedClub === "without_club" && reg.clubeId) return false
      if (selectedClub !== "with_club" && selectedClub !== "without_club" && reg.clubeId !== selectedClub) return false
    }
    if (selectedCoupon !== "all") {
      if (selectedCoupon === "with_coupon" && !reg.cupomCodigo) return false
      if (selectedCoupon === "without_coupon" && reg.cupomCodigo) return false
      if (selectedCoupon !== "with_coupon" && selectedCoupon !== "without_coupon" && reg.cupomCodigo !== selectedCoupon) return false
    }
    if (selectedAffiliate !== "all") {
      if (selectedAffiliate === "with_affiliate" && !reg.afiliadoId) return false
      if (selectedAffiliate === "without_affiliate" && reg.afiliadoId) return false
      if (selectedAffiliate !== "with_affiliate" && selectedAffiliate !== "without_affiliate" && reg.afiliadoId !== selectedAffiliate) return false
    }
    if (dateFrom) {
      try {
        const regDate = new Date(reg.dataInscricao)
        const fromDate = new Date(dateFrom)
        if (!isNaN(regDate.getTime()) && !isNaN(fromDate.getTime()) && regDate < fromDate) return false
      } catch {}
    }
    if (dateTo) {
      try {
        const regDate = new Date(reg.dataInscricao)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (!isNaN(regDate.getTime()) && !isNaN(toDate.getTime()) && regDate > toDate) return false
      } catch {}
    }
    return true
  })

  // Filtrar registrations (inclui filtro de status)
  const filteredRegistrations = eventFilteredRegistrations.filter((reg) => {
    if (selectedStatus !== "all" && reg.statusPagamento !== selectedStatus) return false
    return true
  })

  // Paginação
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex)

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedEvent, selectedStatus, selectedClub, selectedCoupon, selectedAffiliate, dateFrom, dateTo, searchTerm])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedEvent("all")
    setSelectedStatus("paid") // Padrão é "paid"
    setSelectedClub("all")
    setSelectedCoupon("all")
    setSelectedAffiliate("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters =
    selectedEvent !== "all" ||
    selectedStatus !== "paid" || // Padrão é "paid"
    selectedClub !== "all" ||
    selectedCoupon !== "all" ||
    selectedAffiliate !== "all" ||
    dateFrom !== "" ||
    dateTo !== ""

  // Função auxiliar para formatar valores para exportação
  const formatValueForExport = (key: string, value: any): string => {
    if (value === undefined || value === null || value === '') {
      return 'N/A'
    }

    // Formatar valores específicos
    if (key === 'dataInscricao' && value) {
      return formatDate(value, true) // Incluir hora na data de inscrição
    } else if (key === 'dataNascimento' && value) {
      return formatDate(value, false) // Apenas data para nascimento
    } else if (key === 'statusPagamento') {
      return value === 'paid' ? 'Pago' : value === 'pending' ? 'Pendente' : 'Cancelado'
    } else if (key === 'valor' && value) {
      // Para exportação, manter apenas o número sem símbolo de moeda para melhor compatibilidade
      const numValue = Number(value) || 0
      return numValue.toFixed(2).replace('.', ',')
    } else if (key === 'cpf' && value) {
      // Formatar CPF
      const cleanCPF = String(value).replace(/\D/g, '')
      if (cleanCPF.length === 11) {
        return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }
      return String(value)
    } else if (key === 'cep' && value) {
      // Formatar CEP
      const cleanCEP = String(value).replace(/\D/g, '')
      if (cleanCEP.length === 8) {
        return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
      }
      return String(value)
    } else if (key === 'telefone' && value) {
      // Formatar telefone
      const cleanPhone = String(value).replace(/\D/g, '')
      if (cleanPhone.length === 11) {
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (cleanPhone.length === 10) {
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
      return String(value)
    } else if (key === 'idade' && value !== null && value !== undefined) {
      return String(value)
    } else if (key === 'genero' && value) {
      // Garantir que o gênero seja exibido corretamente
      return String(value)
    }

    return String(value)
  }

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
        value = formatValueForExport(key, value)
        
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

    toast.success(`Exportação CSV realizada com sucesso! ${filteredRegistrations.length} inscrição(ões) exportada(s)`)
  }

  const exportToXLS = async () => {
    if (selectedFields.size === 0) {
      toast.error("Selecione pelo menos um campo para exportar")
      return
    }

    if (filteredRegistrations.length === 0) {
      toast.error("Não há inscrições para exportar")
      return
    }

    try {
      // Importação dinâmica do xlsx para evitar problemas de bundling
      const XLSX = await import("xlsx")

      // Mapear campos para labels
      const fieldLabels: Record<string, string> = {}
      availableFields.forEach(field => {
        fieldLabels[field.key] = field.label
      })

      // Preparar dados para Excel
      const headers = Array.from(selectedFields).map(key => fieldLabels[key] || key)
      const data = filteredRegistrations.map(reg => {
        const row: Record<string, string> = {}
        selectedFields.forEach(key => {
          const value = reg[key as keyof Registration]
          row[fieldLabels[key] || key] = formatValueForExport(key, value)
        })
        return row
      })

      // Criar workbook
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inscrições")

      // Ajustar largura das colunas
      const colWidths = headers.map(() => ({ wch: 20 }))
      worksheet['!cols'] = colWidths

      // Fazer download
      XLSX.writeFile(workbook, `inscricoes_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`)

      toast.success(`Exportação XLS realizada com sucesso! ${filteredRegistrations.length} inscrição(ões) exportada(s)`)
    } catch (error) {
      logger.error("Erro ao exportar XLS:", error)
      toast.error("Erro ao exportar arquivo XLS")
    }
  }

  // Função para gerar CSV em base64
  const generateCSVBase64 = (): { content: string; fileName: string } => {
    const fieldLabels: Record<string, string> = {}
    availableFields.forEach(field => {
      fieldLabels[field.key] = field.label
    })

    const headers = Array.from(selectedFields).map(key => fieldLabels[key] || key)
    const csvRows = [headers.join(',')]

    filteredRegistrations.forEach(reg => {
      const row: string[] = []
      selectedFields.forEach(key => {
        let value: any = reg[key as keyof Registration]
        value = formatValueForExport(key, value)
        
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

    const csvContent = '\ufeff' + csvRows.join('\n')
    const fileName = `inscricoes_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`
    const base64 = btoa(unescape(encodeURIComponent(csvContent)))
    
    return { content: base64, fileName }
  }

  // Função para gerar XLS em base64
  const generateXLSBase64 = async (): Promise<{ content: string; fileName: string }> => {
    const XLSX = await import("xlsx")

    const fieldLabels: Record<string, string> = {}
    availableFields.forEach(field => {
      fieldLabels[field.key] = field.label
    })

    const headers = Array.from(selectedFields).map(key => fieldLabels[key] || key)
    const data = filteredRegistrations.map(reg => {
      const row: Record<string, string> = {}
      selectedFields.forEach(key => {
        const value = reg[key as keyof Registration]
        row[fieldLabels[key] || key] = formatValueForExport(key, value)
      })
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inscrições")

    const colWidths = headers.map(() => ({ wch: 20 }))
    worksheet['!cols'] = colWidths

    const fileName = `inscricoes_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`
    // Usar 'base64' diretamente para funcionar no cliente
    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })

    return { content: base64, fileName }
  }

  // Função para enviar por email
  const sendByEmail = async (fileType: 'csv' | 'xlsx') => {
    if (selectedFields.size === 0) {
      toast.error("Selecione pelo menos um campo para exportar")
      return
    }

    if (filteredRegistrations.length === 0) {
      toast.error("Não há inscrições para exportar")
      return
    }

    // Validar emails
    const emailList = emailRecipients
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emailList.length === 0) {
      toast.error("Digite pelo menos um email")
      return
    }

    setSendingEmail(true)

    try {
      let fileData: { content: string; fileName: string }

      if (fileType === 'csv') {
        fileData = generateCSVBase64()
      } else {
        fileData = await generateXLSBase64()
      }

      // Determinar nome do evento
      let eventName = "Todos os Eventos"
      if (selectedEvent !== "all") {
        const event = eventsList.find(e => e.name === selectedEvent)
        eventName = event?.name || selectedEvent
      } else if (eventsList.length === 1) {
        eventName = eventsList[0].name
      }

      const response = await fetch('/api/export/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: fileData.content,
          fileName: fileData.fileName,
          fileType,
          emails: emailList,
          eventName,
          organizerName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      toast.success(`Email enviado com sucesso para ${result.emails.length} destinatário(s)!`)
      setEmailRecipients("")
      setShowExportDialog(false)
    } catch (error: any) {
      logger.error("Erro ao enviar por email:", error)
      toast.error(error.message || "Erro ao enviar email")
    } finally {
      setSendingEmail(false)
    }
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
              
              {/* Seção de Envio por Email */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <Label htmlFor="emails" className="text-sm font-semibold mb-2 block">
                  Enviar por Email (opcional)
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Digite os emails separados por vírgula ou quebra de linha
                </p>
                <textarea
                  id="emails"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => sendByEmail('csv')}
                    disabled={selectedFields.size === 0 || sendingEmail || !emailRecipients.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    {sendingEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar CSV por Email
                  </Button>
                    <Button
                      onClick={() => sendByEmail('xlsx')}
                      disabled={selectedFields.size === 0 || sendingEmail || !emailRecipients.trim()}
                      className="flex-1"
                    >
                      {sendingEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar XLS por Email
                    </Button>
                </div>
              </div>

              <DialogFooter className="border-t pt-4">
                <Button variant="outline" onClick={() => {
                  setShowExportDialog(false)
                  setEmailRecipients("")
                }}>
                  Cancelar
                </Button>
                <div className="flex gap-2">
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
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar CSV
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedFields.size === 0) {
                        toast.error("Selecione pelo menos um campo para exportar")
                        return
                      }
                      exportToXLS()
                      setShowExportDialog(false)
                    }}
                    disabled={selectedFields.size === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar XLS
                  </Button>
                </div>
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
        <FiltersCard
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedClub={selectedClub}
          setSelectedClub={setSelectedClub}
          selectedCoupon={selectedCoupon}
          setSelectedCoupon={setSelectedCoupon}
          selectedAffiliate={selectedAffiliate}
          setSelectedAffiliate={setSelectedAffiliate}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          eventos={eventos}
          clubesList={clubesList}
          couponsList={couponsList}
          affiliatesList={affiliatesList}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Estatísticas rápidas - Clicáveis para filtrar (baseado no evento filtrado) */}
      <StatsCards
        registrations={eventFilteredRegistrations}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        formatCurrency={formatCurrency}
      />

      {/* Lista de inscritos - Layout moderno */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Lista de Inscritos</CardTitle>
              <CardDescription className="text-xs mt-1">
                Filtro: {selectedEvent === "all" ? "Todos eventos" : selectedEvent} • {filteredRegistrations.length} inscrito(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRegistrations.length > 0 ? (
            <>
              {/* Cabeçalho da tabela */}
              <div className="hidden md:grid md:grid-cols-[minmax(0,240px)_minmax(0,350px)_minmax(0,140px)_minmax(0,100px)_minmax(0,100px)_minmax(0,120px)] gap-6 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <div>Nome / Email / ID</div>
                <div>Evento</div>
                <div>Data/Hora</div>
                <div>Categoria</div>
                <div>Valor</div>
                <div>Status</div>
              </div>

              {/* Lista de inscrições */}
            <div className="divide-y" key={`list-${selectedStatus}-${selectedEvent}-${currentPage}`}>
                {paginatedRegistrations.map((registration) => (
                  <RegistrationRow
                    key={registration.id}
                    registration={registration}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                  />
                ))}
            </div>

              {/* Controles de Paginação */}
              <div className="border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Itens por página:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="h-8 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-500">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRegistrations.length)} de {filteredRegistrations.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-xs"
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-gray-600 px-2">
                    Página {currentPage} de {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-8 text-xs"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
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

// Wrap com Error Boundary para proteger contra crashes
export default function RegistrationsPage() {
  return (
    <DashboardErrorBoundary page="registrations">
      <RegistrationsPageContent />
    </DashboardErrorBoundary>
  )
}
