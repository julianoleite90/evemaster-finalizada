"use client"

import { logger } from "@/lib/utils/logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Copy,
  Check,
  Send,
  AlertCircle,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { TimelineCard, QuickStats } from "./components"

export default function RegistrationDetailsPage() {
  const params = useParams()
  const registrationId = params.id as string
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [newTitularEmail, setNewTitularEmail] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState<any>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [resendingEmail, setResendingEmail] = useState(false)
  const router = useRouter()

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
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else {
        date = new Date(dateString)
      }
      if (isNaN(date.getTime())) return "Data inválida"
      if (includeTime) {
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\s+/, ' às ')
      }
      return date.toLocaleDateString('pt-BR')
    } catch {
      return "Data inválida"
    }
  }

  const handleCancelRegistration = async () => {
    if (!registration) return
    setIsCancelling(true)
    try {
      const response = await fetch('/api/registrations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          reason: 'Cancelamento solicitado pelo organizador',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao cancelar inscrição')
      toast.success(
        data.refund_processed 
          ? `Inscrição cancelada! Reembolso de ${formatCurrency(registration.financeiro?.total || 0)} processado.`
          : `Inscrição cancelada! O reembolso será processado em até 5 dias úteis.`
      )
      setShowCancelDialog(false)
      setRegistration((prev: any) => ({
        ...prev,
        statusPagamento: data.refund_processed ? 'refunded' : 'pending_refund',
      }))
      setTimeout(() => router.refresh(), 1000)
    } catch (error: any) {
      logger.error('Erro ao cancelar inscrição:', error)
      toast.error(error.message || 'Erro ao cancelar inscrição')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleResendConfirmationEmail = async () => {
    if (!registration?.atleta?.email) {
      toast.error("Email do participante não encontrado")
      return
    }
    setResendingEmail(true)
    try {
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
        },
      }
      const response = await fetch('/api/email/confirmacao-inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao enviar email')
      if (result.success) {
        toast.success("Email de confirmação reenviado com sucesso!")
      } else {
        throw new Error(result.message || 'Erro ao enviar email')
      }
    } catch (error: any) {
      logger.error("Erro ao reenviar email:", error)
      toast.error(error.message || "Erro ao reenviar email de confirmação")
    } finally {
      setResendingEmail(false)
    }
  }

  const handleCopy = async (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Copiado!")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Erro ao copiar")
    }
  }

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
            liability_waiver_device_type,
            liability_waiver_browser,
            liability_waiver_os,
            events:event_id (
              name,
              event_date,
              location,
              start_time
            ),
            tickets:ticket_id (
              category,
              price,
              is_free,
              has_kit
            )
          `)
          .eq("id", registrationId)
          .single()

        if (error) {
          logger.error("Erro ao buscar inscrição:", error)
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
          statusPagamento: regData.status === "cancelled" ? "cancelled" : regData.status === "confirmed" ? "paid" : (paymentData?.payment_status || "pending"),
          dataInscricao: regData.created_at,
          evento: {
            nome: eventInfo?.name || "N/A",
            data: eventInfo?.event_date || "",
            hora: eventInfo?.start_time?.substring(0, 5),
            local: eventInfo?.location || "N/A",
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
            contatoEmergencia: {
              nome: athleteData.emergency_contact_name,
              telefone: athleteData.emergency_contact_phone,
            },
          } : null,
          termo: {
            aceito: regData.liability_waiver_accepted || false,
            dataAceite: regData.liability_waiver_timestamp ? new Date(regData.liability_waiver_timestamp).toISOString().split('T')[0] : null,
            horarioAceite: regData.liability_waiver_timestamp ? new Date(regData.liability_waiver_timestamp).toTimeString().split(' ')[0] : null,
            ipAceite: regData.liability_waiver_ip,
            deviceType: regData.liability_waiver_device_type,
            browser: regData.liability_waiver_browser,
            os: regData.liability_waiver_os,
          },
          financeiro: paymentData ? {
            valorBase: Number(paymentData.base_amount || paymentData.amount || 0),
            desconto: 0,
            taxaPlataforma: Number(paymentData.platform_fee || 0),
            taxaProcessamento: Number(paymentData.processing_fee || 0),
            total: Number(paymentData.total_amount || paymentData.amount || 0),
            metodoPagamento: paymentData.payment_method === "pix" ? "PIX" : 
                            paymentData.payment_method === "credit_card" ? "Cartão" :
                            paymentData.payment_method === "boleto" ? "Boleto" : "N/A",
            ultimos4Digitos: paymentData.card_last_four_digits,
            parcelas: paymentData.installments || 1,
            dataPagamento: paymentData.payment_date || paymentData.created_at,
            transacaoId: paymentData.transaction_id || paymentData.id,
          } : null,
        }

        setRegistration(formattedData)
      } catch (error) {
        logger.error("Erro ao carregar inscrição:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistration()
  }, [registrationId])

  const getStatusBadge = (status: string) => {
    const config = {
      paid: { label: "Pago", icon: CheckCircle, className: "bg-green-50 text-green-700 border-green-200 pointer-events-none" },
      pending: { label: "Pendente", icon: Clock, className: "bg-yellow-50 text-yellow-700 border-yellow-200 pointer-events-none" },
      cancelled: { label: "Cancelado", icon: X, className: "bg-red-50 text-red-700 border-red-200 pointer-events-none" },
      refunded: { label: "Reembolsado", icon: RefreshCw, className: "bg-blue-50 text-blue-700 border-blue-200 pointer-events-none" },
    }[status] || { label: "Pendente", icon: Clock, className: "bg-yellow-50 text-yellow-700 pointer-events-none" }
    const Icon = config.icon
    return (
      <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    )
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
          <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

    return (
    <div className="space-y-4 pb-8">
      {/* Header Compacto */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b">
          <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
            {registration.atleta?.nome || "Inscrição"}
          </h1>
            {getStatusBadge(registration.statusPagamento)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-mono">{registration.numeroInscricao}</span>
            <span className="mx-2">•</span>
              {formatDate(registration.dataInscricao, true)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleResendConfirmationEmail} disabled={resendingEmail}>
              {resendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Reenviar Confirmação
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
              Transferir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCancelDialog(true)} className="text-red-600">
                <X className="mr-2 h-4 w-4" />
                Cancelar e Reembolsar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>

      {/* Quick Stats */}
      <QuickStats 
        registration={registration} 
        formatDate={formatDate} 
        formatCurrency={formatCurrency} 
      />

      {/* Layout Principal - 3 Colunas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna 1: Participante */}
        {registration.atleta && (
            <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                Participante
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Nome</p>
                  <p 
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-green-600 flex items-center gap-1"
                            onClick={(e) => handleCopy(e, registration.atleta.nome, 'nome')}
                          >
                            {registration.atleta.nome}
                    {copiedId === 'nome' && <Check className="h-3 w-3 text-green-600" />}
                          </p>
                        </div>
                      </div>
              
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p 
                    className="text-sm text-gray-900 cursor-pointer hover:text-green-600 truncate"
                            onClick={(e) => handleCopy(e, registration.atleta.email, 'email')}
                            title={registration.atleta.email}
                          >
                            {registration.atleta.email}
                          </p>
                        </div>
                      </div>
              
                      {registration.atleta.telefone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p 
                      className="text-sm text-gray-900 cursor-pointer hover:text-green-600"
                      onClick={(e) => handleCopy(e, registration.atleta.telefone, 'tel')}
                            >
                              {registration.atleta.telefone}
                            </p>
                          </div>
                </div>
                      )}
              
                      {registration.atleta.cpf && (
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">CPF</p>
                    <p 
                      className="text-sm font-mono text-gray-900 cursor-pointer hover:text-green-600"
                            onClick={(e) => handleCopy(e, registration.atleta.cpf, 'cpf')}
                          >
                            {registration.atleta.cpf}
                          </p>
                        </div>
                        </div>
                      )}
              
              {registration.atleta.idade && (
                <div className="flex items-start gap-2">
                  <Cake className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Idade</p>
                    <p className="text-sm text-gray-900">{registration.atleta.idade} anos</p>
                        </div>
                    </div>
              )}
              
              {registration.atleta.endereco?.cidade && (
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Endereço</p>
                    <p className="text-sm text-gray-900">
                      {registration.atleta.endereco.rua && `${registration.atleta.endereco.rua}, `}
                              {registration.atleta.endereco.cidade}
                              {registration.atleta.endereco.estado && ` - ${registration.atleta.endereco.estado}`}
                            </p>
                        </div>
                  </div>
              )}
              
              {registration.atleta.contatoEmergencia?.nome && (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Contato de Emergência</p>
                      <p className="text-sm text-gray-900">{registration.atleta.contatoEmergencia.nome}</p>
                      {registration.atleta.contatoEmergencia.telefone && (
                        <p className="text-sm text-gray-600">{registration.atleta.contatoEmergencia.telefone}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coluna 2: Participação + Termo + Financeiro */}
        <div className="flex flex-col gap-4">
          {/* Participação + Termo combinados */}
          <Card className="border-gray-200 shadow-sm flex-1">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                Participação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {registration.atleta?.tamanhoCamiseta && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Shirt className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Camiseta</p>
                    <p className="text-sm font-semibold mt-1">{registration.atleta.tamanhoCamiseta}</p>
                  </div>
                )}
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Package className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Kit</p>
                  <p className="text-sm font-semibold mt-1">{registration.atleta?.possuiKit ? "Sim" : "Não"}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Termo</p>
                  <Badge className={registration.termo?.aceito ? "bg-green-100 text-green-700 text-[10px] pointer-events-none mt-1" : "bg-red-100 text-red-700 text-[10px] pointer-events-none mt-1"}>
                    {registration.termo?.aceito ? "Aceito" : "Não"}
                  </Badge>
                </div>
              </div>

              {/* Detalhes do Termo */}
              {registration.termo?.aceito && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Detalhes do Aceite
                    </p>
                    <div className="space-y-2">
                      {registration.termo.dataAceite && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Data/Hora</span>
                          <span className="font-mono text-xs">
                            {formatDate(registration.termo.dataAceite + (registration.termo.horarioAceite ? 'T' + registration.termo.horarioAceite : ''), true)}
                          </span>
                        </div>
                      )}
                      {registration.termo.ipAceite && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">IP</span>
                          <span className="font-mono text-xs">{registration.termo.ipAceite}</span>
                        </div>
                      )}
                      {registration.termo.deviceType && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Dispositivo</span>
                          <span className="text-xs">
                            {registration.termo.deviceType === 'mobile' ? 'Mobile' : 
                             registration.termo.deviceType === 'tablet' ? 'Tablet' : 'Desktop'}
                          </span>
                        </div>
                      )}
                      {registration.termo.browser && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Navegador</span>
                          <span className="text-xs">{registration.termo.browser}</span>
                        </div>
                      )}
                      {registration.termo.os && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sistema</span>
                          <span className="text-xs">{registration.termo.os}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Financeiro */}
      {registration.financeiro && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Financeiro
            </CardTitle>
          </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor Base</span>
                  <span className="font-medium">{formatCurrency(registration.financeiro.valorBase)}</span>
              </div>
                  {registration.financeiro.taxaPlataforma > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa</span>
                    <span className="font-medium">{formatCurrency(registration.financeiro.taxaPlataforma)}</span>
              </div>
                  )}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-[#156634]">{formatCurrency(registration.financeiro.total)}</span>
              </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{registration.financeiro.metodoPagamento}</span>
                  {registration.financeiro.ultimos4Digitos && (
                    <span className="text-gray-500">•••• {registration.financeiro.ultimos4Digitos}</span>
                  )}
                </div>
                    {registration.financeiro.transacaoId && (
                        <p 
                    className="text-xs font-mono text-gray-500 cursor-pointer hover:text-green-600 truncate"
                    onClick={(e) => handleCopy(e, registration.financeiro.transacaoId, 'tx')}
                    title={registration.financeiro.transacaoId}
                        >
                    TX: {registration.financeiro.transacaoId}
                        </p>
                )}
          </CardContent>
        </Card>
      )}
        </div>

        {/* Coluna 3: Timeline */}
        <TimelineCard 
          registration={registration} 
          formatDate={formatDate} 
        />
      </div>

      {/* Dialogs */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Inscrição</DialogTitle>
            <DialogDescription>Digite o email ou CPF do novo titular.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <input
                type="text"
                value={newTitularEmail}
                onChange={(e) => setNewTitularEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
                placeholder="email@exemplo.com ou 000.000.000-00"
              />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Cancelar</Button>
            <Button onClick={() => {}} disabled={!newTitularEmail}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar e Reembolsar</DialogTitle>
            <DialogDescription>Tem certeza? Um reembolso será processado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Manter</Button>
            <Button variant="destructive" onClick={handleCancelRegistration} disabled={isCancelling}>
              {isCancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : 'Cancelar e Reembolsar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
