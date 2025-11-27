"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Search,
  UserCheck,
  UserX,
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

  // Buscar dados reais do Supabase
  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Buscar inscrição com dados relacionados
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

        // Buscar dados do atleta
        const { data: athleteData } = await supabase
          .from("athletes")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        // Buscar dados de pagamento
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        // Formatar dados para o componente
        const formattedData = {
          id: regData.id,
          numeroInscricao: regData.registration_number,
          statusPagamento: regData.status === "confirmed" ? "paid" : (paymentData?.payment_status || "pending"),
          dataInscricao: regData.registration_date,
          horaInscricao: regData.registration_time,
          evento: {
            nome: regData.events?.name || "N/A",
            data: regData.events?.event_date || "",
            local: regData.events?.location || "N/A",
            categoria: regData.tickets?.category || "N/A",
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
            possuiKit: regData.tickets?.has_kit || false,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#156634] mx-auto mb-4"></div>
          <p>Carregando detalhes da inscrição...</p>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Inscrição não encontrada</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
            Voltar
          </button>
        </div>
      </div>
    )
  }


  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(`${dateString} ${timeString}`)
    return date.toLocaleString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Pago", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: X, color: "text-red-600" },
      refunded: { label: "Reembolsado", variant: "outline" as const, icon: RefreshCw, color: "text-blue-600" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Detalhes da Inscrição
          </h1>
          <p className="text-muted-foreground">
            {registration.numeroInscricao}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(registration.statusPagamento)}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
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

      {/* Tabs */}
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="atleta">Atleta</TabsTrigger>
          <TabsTrigger value="corrida">Corrida</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        {/* Aba: Geral */}
        <TabsContent value="geral">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações da Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Data da Inscrição</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{formatDate(registration.dataInscricao)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Horário</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{registration.horaInscricao}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Número da Inscrição</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm font-mono">{registration.numeroInscricao}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Nome do Evento</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm font-medium">{registration.evento.nome}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Data</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{formatDate(registration.evento.data)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Local</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{registration.evento.local}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Categoria</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <Badge variant="outline">{registration.evento.categoria}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Atleta */}
        <TabsContent value="atleta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Atleta
              </CardTitle>
              <CardDescription>
                Informações pessoais do participante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Nome Completo</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-lg font-medium">{registration.atleta?.nome || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{registration.atleta?.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Telefone</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{registration.atleta?.telefone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">CPF</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{registration.atleta?.cpf || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Data de Nascimento</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Cake className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {registration.atleta?.dataNascimento ? formatDate(registration.atleta.dataNascimento) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Gênero</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{registration.atleta?.genero || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Idade</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">{registration.atleta?.idade ? `${registration.atleta.idade} anos` : "N/A"}</p>
                    </div>
                  </div>
                </div>

                {registration.atleta?.endereco && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Endereço</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-start gap-2">
                      <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">
                        {registration.atleta.endereco.rua}
                        <br />
                        {registration.atleta.endereco.cidade} - {registration.atleta.endereco.estado}
                        <br />
                        CEP: {registration.atleta.endereco.cep}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Dados da Corrida */}
        <TabsContent value="corrida">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Participação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {registration.comprador && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Comprador</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm font-medium">{registration.comprador.nome}</p>
                        <p className="text-xs text-muted-foreground">{registration.comprador.email}</p>
                      </div>
                    </div>
                  )}

                  {registration.atleta?.tamanhoCamiseta && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Tamanho de Camiseta</Label>
                      <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                        <Shirt className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{registration.atleta.tamanhoCamiseta}</Badge>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Kit</Label>
                      <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {registration.atleta?.possuiKit ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Possui Kit
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            Sem Kit
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Seguro</Label>
                      <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {registration.atleta?.possuiSeguro ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Com Seguro
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            Sem Seguro
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Financeiro */}
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Detalhes Financeiros
              </CardTitle>
              <CardDescription>
                Detalhamento de valores e pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {registration.financeiro ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor Base</span>
                      <span className="text-sm font-medium">{formatCurrency(registration.financeiro.valorBase || 0)}</span>
                    </div>

                    {registration.financeiro.desconto > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Desconto</span>
                        <span className="text-sm font-medium text-green-600">
                          -{formatCurrency(registration.financeiro.desconto)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa da Plataforma</span>
                      <span className="text-sm font-medium">{formatCurrency(registration.financeiro.taxaPlataforma || 0)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Processamento</span>
                      <span className="text-sm font-medium">{formatCurrency(registration.financeiro.taxaProcessamento || 0)}</span>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">Total</span>
                        <span className="text-lg font-bold text-[#156634]">
                          {formatCurrency(registration.financeiro.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Método de Pagamento</Label>
                      <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{registration.financeiro.metodoPagamento || "N/A"}</p>
                          {registration.financeiro.ultimos4Digitos && (
                            <p className="text-xs text-muted-foreground">
                              Final {registration.financeiro.ultimos4Digitos}
                              {registration.financeiro.parcelas > 1 && ` • ${registration.financeiro.parcelas}x`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Inscrição gratuita ou pagamento não processado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
