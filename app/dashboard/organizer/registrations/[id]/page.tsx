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
  DialogTrigger,
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
  FileText,
  MoreVertical,
  Edit,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Loader2,
  UserCheck,
  UserX,
  Hash,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function RegistrationDetailsPage() {
  const params = useParams()
  const registrationId = params.id as string
  const [isEditingTitular, setIsEditingTitular] = useState(false)
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
            events:event_id (
              name,
              event_date,
              location
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
          dataInscricao: regData.registration_date,
          horaInscricao: regData.registration_time,
          evento: {
            nome: eventInfo?.name || "N/A",
            data: eventInfo?.event_date || "",
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
            possuiSeguro: false,
          } : null,
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informado"
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("pt-BR")
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
      <Badge className={`${config.className} flex items-center gap-1.5 text-xs font-medium`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Detalhes da Inscrição</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {registration.numeroInscricao}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(registration.statusPagamento)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Transferir Inscrição
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar e Reembolsar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Informações principais em grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card: Informações da Inscrição */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Inscrição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Número</p>
              <p className="text-sm font-mono font-medium">{registration.numeroInscricao}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data</p>
                <p className="text-sm">{formatDate(registration.dataInscricao)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Horário</p>
                <p className="text-sm">{registration.horaInscricao || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Evento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nome</p>
              <p className="text-sm font-medium">{registration.evento.nome}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data</p>
                <p className="text-sm">{formatDate(registration.evento.data)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                <Badge variant="outline" className="text-xs">{registration.evento.categoria}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Local
              </p>
              <p className="text-sm">{registration.evento.local}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card: Atleta */}
        {registration.atleta && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Atleta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nome</p>
                <p className="text-sm font-medium">{registration.atleta.nome}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="text-xs truncate">{registration.atleta.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </p>
                  <p className="text-xs">{registration.atleta.telefone || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CPF</p>
                  <p className="text-xs font-mono">{registration.atleta.cpf || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Cake className="h-3 w-3" />
                    Nascimento
                  </p>
                  <p className="text-xs">{formatDate(registration.atleta.dataNascimento)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações detalhadas em grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card: Dados Pessoais Completos */}
        {registration.atleta && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gênero</p>
                  <p className="text-sm">{registration.atleta.genero || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Idade</p>
                  <p className="text-sm">{registration.atleta.idade ? `${registration.atleta.idade} anos` : "-"}</p>
                </div>
              </div>
              {registration.atleta.endereco && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      Endereço
                    </p>
                    <p className="text-xs leading-relaxed">
                      {registration.atleta.endereco.rua || "-"}
                      {registration.atleta.endereco.cidade && (
                        <>
                          <br />
                          {registration.atleta.endereco.cidade} - {registration.atleta.endereco.estado}
                        </>
                      )}
                      {registration.atleta.endereco.cep && (
                        <>
                          <br />
                          CEP: {registration.atleta.endereco.cep}
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card: Participação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Participação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {registration.atleta?.tamanhoCamiseta && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Shirt className="h-3 w-3" />
                  Tamanho de Camiseta
                </p>
                <Badge variant="outline" className="text-xs">{registration.atleta.tamanhoCamiseta}</Badge>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Kit
                </p>
                {registration.atleta?.possuiKit ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Incluído</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Não incluído</Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Seguro
                </p>
                {registration.atleta?.possuiSeguro ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Incluído</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Não incluído</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card: Financeiro */}
      {registration.financeiro && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Detalhes Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor Base</span>
                <span className="font-medium">{formatCurrency(registration.financeiro.valorBase || 0)}</span>
              </div>
              {registration.financeiro.desconto > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(registration.financeiro.desconto)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa da Plataforma</span>
                <span className="font-medium">{formatCurrency(registration.financeiro.taxaPlataforma || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Processamento</span>
                <span className="font-medium">{formatCurrency(registration.financeiro.taxaProcessamento || 0)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold text-[#156634]">
                  {formatCurrency(registration.financeiro.total || 0)}
                </span>
              </div>
              <Separator />
              <div className="space-y-2 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Método de Pagamento
                  </p>
                  <p className="text-sm font-medium">{registration.financeiro.metodoPagamento || "N/A"}</p>
                  {registration.financeiro.ultimos4Digitos && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Final {registration.financeiro.ultimos4Digitos}
                      {registration.financeiro.parcelas > 1 && ` • ${registration.financeiro.parcelas}x`}
                    </p>
                  )}
                </div>
                {registration.financeiro.dataPagamento && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data do Pagamento</p>
                    <p className="text-xs">{formatDate(registration.financeiro.dataPagamento)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
