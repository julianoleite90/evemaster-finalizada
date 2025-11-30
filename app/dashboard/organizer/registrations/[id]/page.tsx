"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  Cake,
  Home,
  Shirt,
  Package,
  Shield,
  MoreVertical,
  Edit,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Hash,
  FileText,
  Copy,
  Check,
  Send,
  AlertCircle,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

export default function RegistrationDetailsPage() {
  const params = useParams()
  const registrationId = params.id as string
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [newTitularEmail, setNewTitularEmail] = useState("")
  const [newTitularCpf, setNewTitularCpf] = useState("")
  const [isCheckingUser, setIsCheckingUser] = useState(false)
  const [userFound, setUserFound] = useState<any>(null)
  const [userNotFound, setUserNotFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState<any>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [resendingEmail, setResendingEmail] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data: regData, error } = await supabase
          .from("registrations")
          .select(`
            id,
            registration_number,
            status,
            registration_date,
            registration_time,
            shirt_size,
            created_at,
            liability_waiver_accepted,
            liability_waiver_timestamp,
            liability_waiver_ip,
            liability_waiver_user_agent,
            liability_waiver_device_type,
            liability_waiver_browser,
            liability_waiver_os,
            events:event_id (
              name,
              event_date,
              location,
              start_time,
              description
            ),
            tickets:ticket_id (
              category,
              price,
              is_free,
              has_kit,
              kit_items
            )
          `)
          .eq("id", registrationId)
          .single()

        if (error) {
          console.error("Erro ao buscar inscrição:", error)
          return
        }

        const { data: athleteData } = await supabase
          .from("athletes")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        const eventInfo = Array.isArray(regData.events) ? regData.events[0] : regData.events
        const ticketInfo = Array.isArray(regData.tickets) ? regData.tickets[0] : regData.tickets

        const formattedData = {
          id: regData.id,
          numeroInscricao: regData.registration_number,
          statusPagamento: regData.status === "confirmed" ? "paid" : (paymentData?.payment_status || "pending"),
          dataInscricao: regData.created_at, // Usar created_at que tem o timestamp completo com horário
          horaInscricao: regData.registration_time,
          evento: {
            nome: eventInfo?.name || "N/A",
            data: eventInfo?.event_date || "",
            hora: eventInfo?.start_time ? eventInfo.start_time.substring(0, 5) : undefined,
            local: eventInfo?.location || "N/A",
            descricao: eventInfo?.description ? eventInfo.description.replace(/<[^>]*>/g, '').substring(0, 200) : undefined,
            categoria: ticketInfo?.category || "N/A",
          },
          atleta: athleteData ? {
            nome: athleteData.full_name,
            email: athleteData.email,
            telefone: athleteData.phone,
            cpf: athleteData.cpf,
            dataNascimento: athleteData.birth_date,
            genero: athleteData.gender,
            idade: athleteData.age,
            endereco: {
              rua: `${athleteData.address || ""} ${athleteData.address_number || ""}`.trim(),
              cidade: athleteData.city,
              estado: athleteData.state,
              cep: athleteData.zip_code,
            },
            tamanhoCamiseta: regData.shirt_size,
            possuiKit: ticketInfo?.has_kit || false,
            possuiSeguro: false,
            contatoEmergencia: {
              nome: athleteData.emergency_contact_name || null,
              telefone: athleteData.emergency_contact_phone || null,
            },
          } : null,
          termo: {
            aceito: regData.liability_waiver_accepted || false,
            dataAceite: regData.liability_waiver_timestamp ? new Date(regData.liability_waiver_timestamp).toISOString().split('T')[0] : null,
            horarioAceite: regData.liability_waiver_timestamp ? new Date(regData.liability_waiver_timestamp).toTimeString().split(' ')[0] : null,
            ipAceite: regData.liability_waiver_ip || null,
            userAgent: regData.liability_waiver_user_agent || null,
            deviceType: regData.liability_waiver_device_type || null,
            browser: regData.liability_waiver_browser || null,
            os: regData.liability_waiver_os || null,
          },
          comprador: null,
          financeiro: paymentData ? {
            valorBase: Number(paymentData.base_amount || paymentData.amount || 0),
            desconto: 0,
            taxaPlataforma: Number(paymentData.platform_fee || 0),
            taxaProcessamento: Number(paymentData.processing_fee || 0),
            total: Number(paymentData.total_amount || paymentData.amount || 0),
            metodoPagamento: paymentData.payment_method === "pix" ? "PIX" : 
                            paymentData.payment_method === "credit_card" ? "Cartão de Crédito" :
                            paymentData.payment_method === "boleto" ? "Boleto" : "N/A",
            ultimos4Digitos: paymentData.card_last_four_digits,
            parcelas: paymentData.installments || 1,
            dataPagamento: paymentData.payment_date || paymentData.created_at,
            transacaoId: paymentData.transaction_id || paymentData.id,
          } : null,
        }

        setRegistration(formattedData)
      } catch (error) {
        console.error("Erro ao carregar inscrição:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistration()
  }, [registrationId])

  const handleCopy = async (e: React.MouseEvent, text: string, id: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Inscrição não encontrada</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string, includeTime: boolean = false) => {
    if (!dateString) return "Não informado"
    try {
      let date: Date
      
      // Se é uma string de data simples (YYYY-MM-DD), criar como data local
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else {
        // Para datas ISO com timezone, o JavaScript já converte corretamente
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      
      // Usar toLocaleString que já converte corretamente para timezone local
      if (includeTime) {
        const formatted = date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
        // Formato retorna "30/01/2024 10:00" - substituir espaço por " às "
        return formatted.replace(/\s+/, ' às ')
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Pago", icon: CheckCircle, className: "bg-green-50 text-green-700 border-green-200" },
      pending: { label: "Pendente", icon: Clock, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      cancelled: { label: "Cancelado", icon: X, className: "bg-red-50 text-red-700 border-red-200" },
      refunded: { label: "Reembolsado", icon: RefreshCw, className: "bg-blue-50 text-blue-700 border-blue-200" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    )
  }

  const handleResendConfirmationEmail = async () => {
    if (!registration?.atleta?.email) {
      toast.error("Email do participante não encontrado")
      return
    }

    setResendingEmail(true)

    try {
      // Montar payload para a API de confirmação
      const emailPayload = {
        inscricoes: [{
          email: registration.atleta.email,
          nome: registration.atleta.nome,
          categoria: registration.evento.categoria,
          valor: registration.financeiro?.valorBase || 0,
          gratuito: (registration.financeiro?.valorBase || 0) === 0,
          codigoInscricao: registration.numeroInscricao,
        }],
        evento: {
          nome: registration.evento.nome,
          data: registration.evento.data,
          hora: registration.evento.hora,
          local: registration.evento.local,
          descricao: registration.evento.descricao,
        },
        resumoFinanceiro: registration.financeiro ? {
          subtotal: registration.financeiro.valorBase || 0,
          taxa: (registration.financeiro.taxaPlataforma || 0) + (registration.financeiro.taxaProcessamento || 0),
          total: registration.financeiro.total || 0,
        } : undefined,
      }

      const response = await fetch('/api/email/confirmacao-inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      if (result.success) {
        toast.success("Email de confirmação reenviado com sucesso!")
      } else {
        throw new Error(result.message || 'Erro ao enviar email')
      }
    } catch (error: any) {
      console.error("Erro ao reenviar email:", error)
      toast.error(error.message || "Erro ao reenviar email de confirmação")
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {registration.atleta?.nome || "Inscrição"}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-sm text-gray-500 font-mono">
              {registration.numeroInscricao}
            </p>
            <span className="text-gray-300">•</span>
            <p className="text-sm text-gray-500">
              {formatDate(registration.dataInscricao, true)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(registration.statusPagamento)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={handleResendConfirmationEmail}
                disabled={resendingEmail || !registration?.atleta?.email}
              >
                {resendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Reenviar Confirmação
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Transferir Inscrição
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar e Reembolsar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Layout Principal - Duas Colunas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda - Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Informações do Evento */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Informações do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Nome do Evento
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {registration.evento.nome}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Data do Evento
                    </p>
                    <p className="text-sm text-gray-900">
                      {formatDate(registration.evento.data)}
                    </p>
              </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Categoria
                    </p>
                    <Badge variant="outline" className="text-xs font-medium">
                      {registration.evento.categoria}
                    </Badge>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Local
                  </p>
                    <p className="text-sm text-gray-900">
                      {registration.evento.local}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Dados do Participante */}
        {registration.atleta && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  Dados do Participante
                </CardTitle>
            </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Nome e Contato */}
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Informações de Contato
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Nome Completo</p>
                          <p 
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2"
                            onClick={(e) => handleCopy(e, registration.atleta.nome, 'nome')}
                          >
                            {registration.atleta.nome}
                            {copiedId === 'nome' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          <p 
                            className="text-sm text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2 truncate"
                            onClick={(e) => handleCopy(e, registration.atleta.email, 'email')}
                            title={registration.atleta.email}
                          >
                            {registration.atleta.email}
                            {copiedId === 'email' ? (
                              <Check className="h-3 w-3 text-green-600 shrink-0" />
                            ) : null}
                          </p>
                        </div>
                      </div>
                      {registration.atleta.telefone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">Telefone</p>
                            <p 
                              className="text-sm text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2"
                              onClick={(e) => handleCopy(e, registration.atleta.telefone, 'telefone')}
                            >
                              {registration.atleta.telefone}
                              {copiedId === 'telefone' ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : null}
                            </p>
                          </div>
                </div>
                      )}
                      {registration.atleta.contatoEmergencia?.nome && (
                        <div className="flex items-start gap-3 pt-3 border-t">
                          <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">Contato de Emergência</p>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Nome</p>
                                <p className="text-sm text-gray-900">{registration.atleta.contatoEmergencia.nome}</p>
                              </div>
                              {registration.atleta.contatoEmergencia.telefone && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">Telefone</p>
                                  <p 
                                    className="text-sm text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2"
                                    onClick={(e) => handleCopy(e, registration.atleta.contatoEmergencia.telefone, 'telefone emergência')}
                                  >
                                    {registration.atleta.contatoEmergencia.telefone}
                                    {copiedId === 'telefone emergência' ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : null}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                </div>
              </div>

                  <Separator />

                  {/* Documentos e Dados Pessoais */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Documentos e Dados Pessoais
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {registration.atleta.cpf && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">CPF</p>
                          <p 
                            className="text-sm font-mono text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2"
                            onClick={(e) => handleCopy(e, registration.atleta.cpf, 'cpf')}
                          >
                            {registration.atleta.cpf}
                            {copiedId === 'cpf' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : null}
                          </p>
                        </div>
                      )}
                      {registration.atleta.dataNascimento && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Cake className="h-3 w-3" />
                            Data de Nascimento
                    </p>
                          <p className="text-sm text-gray-900">
                            {formatDate(registration.atleta.dataNascimento)}
                            {registration.atleta.idade && (
                              <span className="text-gray-500 ml-2">
                                ({registration.atleta.idade} anos)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {registration.atleta.genero && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Gênero</p>
                          <p className="text-sm text-gray-900">{registration.atleta.genero}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Endereço */}
                  {registration.atleta.endereco && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          Endereço
                        </p>
                        <div className="text-sm text-gray-900 space-y-1">
                          {registration.atleta.endereco.rua && (
                            <p>{registration.atleta.endereco.rua}</p>
                          )}
                      {registration.atleta.endereco.cidade && (
                            <p>
                              {registration.atleta.endereco.cidade}
                              {registration.atleta.endereco.estado && ` - ${registration.atleta.endereco.estado}`}
                            </p>
                      )}
                      {registration.atleta.endereco.cep && (
                            <p className="text-gray-500">CEP: {registration.atleta.endereco.cep}</p>
                      )}
                        </div>
                  </div>
                </>
              )}

              {/* Termo de Consentimento */}
              {registration.termo && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Termo de Responsabilidade
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <Badge variant={registration.termo.aceito ? "default" : "destructive"} className="text-xs">
                          {registration.termo.aceito ? "Aceito" : "Não aceito"}
                        </Badge>
                      </div>
                      {registration.termo.aceito && (
                        <div className="space-y-1 text-sm text-gray-600">
                          {registration.termo.dataAceite && registration.termo.horarioAceite && (
                            <p>
                              <span className="font-medium">Data e Hora:</span> {formatDate(registration.termo.dataAceite + 'T' + registration.termo.horarioAceite, true)}
                            </p>
                          )}
                          {registration.termo.dataAceite && !registration.termo.horarioAceite && (
                            <p>
                              <span className="font-medium">Data:</span> {formatDate(registration.termo.dataAceite)}
                            </p>
                          )}
                          {registration.termo.ipAceite && (
                            <p>
                              <span className="font-medium">IP:</span> {registration.termo.ipAceite}
                            </p>
                          )}
                          {registration.termo.deviceType && (
                            <p>
                              <span className="font-medium">Dispositivo:</span> {registration.termo.deviceType === 'mobile' ? 'Mobile' : registration.termo.deviceType === 'tablet' ? 'Tablet' : 'Desktop'}
                            </p>
                          )}
                          {registration.termo.browser && (
                            <p>
                              <span className="font-medium">Navegador:</span> {registration.termo.browser}
                            </p>
                          )}
                          {registration.termo.os && (
                            <p>
                              <span className="font-medium">Sistema Operacional:</span> {registration.termo.os}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
                </div>
            </CardContent>
          </Card>
        )}

          {/* Card: Participação e Kit */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                Participação
              </CardTitle>
          </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {registration.atleta?.tamanhoCamiseta && (
              <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Shirt className="h-3 w-3" />
                      Tamanho da Camiseta
                </p>
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1.5">
                      {registration.atleta.tamanhoCamiseta}
                    </Badge>
              </div>
            )}
              <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Kit
                </p>
                {registration.atleta?.possuiKit ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-sm font-medium px-3 py-1.5">
                      Incluído
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1.5">
                      Não incluído
                    </Badge>
                )}
              </div>
              <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Seguro
                </p>
                {registration.atleta?.possuiSeguro ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-sm font-medium px-3 py-1.5">
                      Incluído
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1.5">
                      Não incluído
                    </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Coluna Direita - Sidebar */}
        <div className="space-y-6">
          {/* Card: Resumo da Inscrição */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Hash className="h-5 w-5 text-gray-500" />
                Resumo da Inscrição
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Número de Inscrição
                </p>
                <p 
                  className="text-sm font-mono font-semibold text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2"
                  onClick={(e) => handleCopy(e, registration.numeroInscricao, 'numero')}
                >
                  {registration.numeroInscricao}
                  {copiedId === 'numero' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : null}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Data e Hora da Inscrição
                </p>
                <p className="text-sm text-gray-900">
                  {formatDate(registration.dataInscricao, true)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Detalhes Financeiros */}
      {registration.financeiro && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
              Detalhes Financeiros
            </CardTitle>
          </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Valor Base</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(registration.financeiro.valorBase || 0)}
                    </span>
              </div>
              {registration.financeiro.desconto > 0 && (
                <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Desconto</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(registration.financeiro.desconto)}
                  </span>
                </div>
              )}
                  {registration.financeiro.taxaPlataforma > 0 && (
              <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Taxa da Plataforma</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(registration.financeiro.taxaPlataforma || 0)}
                      </span>
              </div>
                  )}
                  {registration.financeiro.taxaProcessamento > 0 && (
              <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Taxa de Processamento</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(registration.financeiro.taxaProcessamento || 0)}
                      </span>
              </div>
                  )}
              <Separator />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-[#156634]">
                  {formatCurrency(registration.financeiro.total || 0)}
                </span>
              </div>
              <Separator />
                  <div className="space-y-3 pt-2">
                <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Método de Pagamento
                  </p>
                      <p className="text-sm font-medium text-gray-900">
                        {registration.financeiro.metodoPagamento || "N/A"}
                      </p>
                  {registration.financeiro.ultimos4Digitos && (
                        <p className="text-xs text-gray-500 mt-1">
                      Final {registration.financeiro.ultimos4Digitos}
                      {registration.financeiro.parcelas > 1 && ` • ${registration.financeiro.parcelas}x`}
                    </p>
                  )}
                </div>
                {registration.financeiro.dataPagamento && (
                  <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Data do Pagamento
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatDate(registration.financeiro.dataPagamento)}
                        </p>
                      </div>
                    )}
                    {registration.financeiro.transacaoId && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          ID da Transação
                        </p>
                        <p 
                          className="text-xs font-mono text-gray-900 cursor-pointer hover:text-green-600 transition-colors inline-flex items-center gap-2"
                          onClick={(e) => handleCopy(e, registration.financeiro.transacaoId, 'transacao')}
                        >
                          {registration.financeiro.transacaoId}
                          {copiedId === 'transacao' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : null}
                        </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Inscrição</DialogTitle>
            <DialogDescription>
              Digite o email ou CPF do novo titular da inscrição.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Email ou CPF</label>
              <input
                type="text"
                value={newTitularEmail}
                onChange={(e) => setNewTitularEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="email@exemplo.com ou 000.000.000-00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {}} disabled={!newTitularEmail}>
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar e Reembolsar</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta inscrição? Um reembolso será processado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Não, manter inscrição
            </Button>
            <Button variant="destructive" onClick={() => {}}>
              Sim, cancelar e reembolsar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
