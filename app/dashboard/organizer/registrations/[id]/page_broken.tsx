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
  DollarSign,
  FileText,
  Mail,
  Phone,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Cake,
  Venus,
  Home,
  Hash,
  Tag,
  Banknote,
  Percent,
  Info,
  Shield,
  Package,
  Shirt,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  RefreshCw,
  MoreVertical,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
  const [userFound, setUserFound] = useState<{ nome: string; email: string } | null>(null)
  const [userNotFound, setUserNotFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState<any>(null)

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Buscar inscrição
        const { data: reg, error: regError } = await supabase
          .from("registrations")
          .select(`
            *,
            events:event_id (
              id,
              name,
              event_date,
              location,
              address,
              city,
              state
            ),
            tickets:ticket_id (
              category,
              price
            )
          `)
          .eq("id", registrationId)
          .single()

        if (regError || !reg) {
          toast.error("Inscrição não encontrada")
          return
        }

        // Buscar dados do atleta
        const { data: athlete } = await supabase
          .from("athletes")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        // Buscar dados do comprador
        const { data: buyer } = await supabase
          .from("users")
          .select("full_name, email, phone")
          .eq("id", reg.buyer_id)
          .single()

        // Buscar pagamento
        const { data: payment } = await supabase
          .from("payments")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        // Calcular idade
        const calculateAge = (birthDate: string) => {
          const today = new Date()
          const birth = new Date(birthDate)
          let age = today.getFullYear() - birth.getFullYear()
          const monthDiff = today.getMonth() - birth.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
          }
          return age
        }

        const formattedReg = {
          id: reg.id,
          numeroInscricao: reg.registration_number || `INS-${reg.id.substring(0, 8).toUpperCase()}`,
          dataInscricao: reg.registration_date,
          horarioInscricao: reg.registration_time,
          statusPagamento: payment?.payment_status || reg.status || "pending",
          
          atleta: athlete ? {
            nome: athlete.full_name,
            email: athlete.email,
            telefone: athlete.phone || "",
            cpf: athlete.cpf || "",
            dataNascimento: athlete.birth_date,
            idade: athlete.birth_date ? calculateAge(athlete.birth_date) : null,
            genero: athlete.gender === "male" ? "Masculino" : athlete.gender === "female" ? "Feminino" : "Outro",
            tamanhoCamiseta: reg.shirt_size || "",
            possuiKit: reg.has_kit || false,
            possuiSeguro: reg.has_insurance || false,
            endereco: {
              rua: athlete.address || "",
              cidade: athlete.city || "",
              estado: athlete.state || "",
              cep: athlete.zip_code || "",
            },
          } : null,

          termo: {
            aceito: reg.liability_waiver_accepted || false,
            dataAceite: reg.liability_waiver_timestamp ? new Date(reg.liability_waiver_timestamp).toISOString().split('T')[0] : "",
            horarioAceite: reg.liability_waiver_timestamp ? new Date(reg.liability_waiver_timestamp).toTimeString().split(' ')[0] : "",
            ipAceite: reg.liability_waiver_ip || "",
          },

          comprador: buyer ? {
            nome: buyer.full_name || "",
            email: buyer.email || "",
            telefone: buyer.phone || "",
          } : null,

          evento: reg.events ? {
            id: reg.events.id,
            nome: reg.events.name,
            data: reg.events.event_date,
            localizacao: reg.events.location || `${reg.events.address || ""}, ${reg.events.city || ""} - ${reg.events.state || ""}`.trim(),
            categoria: reg.tickets?.category || "",
            modalidade: reg.tickets?.category || "",
          } : null,

          financeiro: payment ? {
            valorBase: Number(payment.base_amount || 0),
            taxaPlataforma: Number(payment.platform_fee || 0),
            taxaProcessamento: Number(payment.processing_fee || 0),
            desconto: Number(payment.discount || 0),
            total: Number(payment.total_amount || 0),
            metodoPagamento: payment.payment_method === "pix" ? "PIX" : 
                            payment.payment_method === "credit_card" ? "Cartão de Crédito" :
                            payment.payment_method === "boleto" ? "Boleto" : "",
            ultimos4Digitos: payment.card_last_four_digits || "",
            parcelas: payment.installments || 1,
            dataPagamento: payment.payment_date || payment.created_at,
            transacaoId: payment.transaction_id || "",
          } : null,
        }

        setRegistration(formattedReg)
      } catch (error: any) {
        console.error("Erro ao buscar inscrição:", error)
        toast.error("Erro ao carregar dados da inscrição")
      } finally {
        setLoading(false)
      }
    }

    if (registrationId) {
      fetchRegistration()
    }
  }, [registrationId])

  const getStatusBadge = (status: string) => {
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
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (timeString) {
      // Se tiver horário separado, combina data e horário
      const dateTime = `${dateString} ${timeString}`
      const date = new Date(dateTime)
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    }
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
    const dateFormatted = date.toLocaleDateString("pt-BR", options)
    return dateFormatted
  }

  // Função para validar CPF
  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/[^\d]/g, "")
    return cleanCPF.length === 11
  }

  // Função para formatar CPF
  const formatCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/[^\d]/g, "")
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Função para verificar se o usuário existe na plataforma
  const checkUserExists = async () => {
    if (!newTitularEmail || !newTitularCpf) {
      toast.error("Por favor, preencha email e CPF")
      return
    }

    if (!validateCPF(newTitularCpf)) {
      toast.error("CPF inválido. Digite um CPF válido com 11 dígitos.")
      return
    }

    setIsCheckingUser(true)
    setUserFound(null)
    setUserNotFound(false)

    // Verificar se existe usuário com esse email e CPF no Supabase
    try {
      const supabase = createClient()
      const cleanCPF = newTitularCpf.replace(/[^\d]/g, "")
      
      const { data: user } = await supabase
        .from("users")
        .select("full_name, email, cpf")
        .eq("email", newTitularEmail)
        .eq("cpf", cleanCPF)
        .maybeSingle()
      
      if (user) {
        setUserFound({
          nome: user.full_name || "",
          email: user.email || "",
        })
        setUserNotFound(false)
        toast.success("Usuário encontrado na plataforma!")
      } else {
        setUserFound(null)
        setUserNotFound(true)
        toast.error("Usuário não encontrado. Verifique email e CPF.")
      }
    } catch (error: any) {
      console.error("Erro ao verificar usuário:", error)
      toast.error("Erro ao verificar usuário")
      setUserNotFound(true)
    } finally {
      setIsCheckingUser(false)
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Inscrição não encontrada</p>
      </div>
    )
  }

  // Função para enviar solicitação de troca de titularidade
  const handleSubmitTransferRequest = async () => {
    if (!userFound) {
      toast.error("Por favor, verifique se o usuário existe antes de continuar")
      return
    }

    setIsSubmitting(true)

    // Simulação de envio - substituir por chamada real ao Supabase
    setTimeout(() => {
      // Aqui você salvaria a solicitação na tabela de solicitações de transferência
      // await supabase.from('transfer_requests').insert({
      //   registration_id: registrationId,
      //   new_titular_email: newTitularEmail,
      //   new_titular_cpf: newTitularCpf.replace(/[^\d]/g, ""),
      //   status: 'pending',
      //   requested_at: new Date().toISOString(),
      // })

      toast.success("Solicitação de troca de titularidade enviada com sucesso! O time administrativo irá analisar e aprovar ou rejeitar a solicitação.")
      setShowTransferDialog(false)
      setIsSubmitting(false)
      
      // Resetar campos
      setNewTitularEmail("")
      setNewTitularCpf("")
      setUserFound(null)
      setUserNotFound(false)
    }, 1000)
  }

  // Resetar estados quando o dialog fechar
  const handleDialogClose = (open: boolean) => {
    setShowTransferDialog(open)
    if (!open) {
      setNewTitularEmail("")
      setNewTitularCpf("")
      setUserFound(null)
      setUserNotFound(false)
      setIsCheckingUser(false)
      setIsSubmitting(false)
    }
  }

  // Função para cancelar inscrição e processar reembolso
  const handleCancelRegistration = async () => {
    setIsCancelling(true)

    // Simulação de processamento - substituir por chamada real ao Supabase e gateway de pagamento
    setTimeout(() => {
      // Aqui você faria:
      // 1. Processar reembolso no gateway de pagamento (Stripe, PagSeguro, etc.)
      // 2. Atualizar status da inscrição para "cancelada" no Supabase
      // 3. Registrar o reembolso na tabela de transações
      // 4. Enviar email de confirmação para o comprador
      
      // await supabase.from('registrations').update({ status: 'cancelled' }).eq('id', registrationId)
      // await processRefund(registration.financeiro.idTransacao, registration.financeiro.total)

      toast.success(
        `Inscrição cancelada com sucesso! O valor de ${formatCurrency(registration.financeiro?.total || 0)} será devolvido para o comprador em até 5 dias úteis.`
      )
      setShowCancelDialog(false)
      setIsCancelling(false)
      
      // Recarregar a página ou atualizar o status
      // router.refresh()
    }, 2000)
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
          {registration.statusPagamento === "paid" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Dialog open={showTransferDialog} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="mr-2 h-4 w-4" />
                        Trocar Titularidade
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar Inscrição
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dialogs */}
              <Dialog open={showTransferDialog} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Trocar Titularidade da Inscrição</DialogTitle>
                    <DialogDescription>
                      Informe o email e CPF do novo titular. O sistema verificará se o cadastro existe na plataforma e enviará a solicitação para aprovação do time administrativo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email do Novo Titular</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="novo.titular@email.com"
                        value={newTitularEmail}
                        onChange={(e) => setNewTitularEmail(e.target.value)}
                        disabled={isSubmitting || isCheckingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF do Novo Titular</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          value={newTitularCpf}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value)
                            setNewTitularCpf(formatted)
                          }}
                          maxLength={14}
                          disabled={isSubmitting || isCheckingUser}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={checkUserExists}
                          disabled={!newTitularEmail || !newTitularCpf || isCheckingUser || isSubmitting}
                        >
                          {isCheckingUser ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Status da verificação */}
                    {isCheckingUser && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <p className="text-sm text-blue-800">Verificando cadastro na plataforma...</p>
                      </div>
                    )}

                    {userFound && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-800">Usuário encontrado!</p>
                        </div>
                        <div className="text-sm text-green-700 pl-6">
                          <p><strong>Nome:</strong> {userFound.nome}</p>
                          <p><strong>Email:</strong> {userFound.email}</p>
                        </div>
                      </div>
                    )}

                    {userNotFound && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">Usuário não encontrado</p>
                          <p className="text-xs text-red-700 mt-1">
                            Não foi encontrado um cadastro com este email e CPF na plataforma. Verifique os dados informados.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800">Processo de Aprovação</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Após enviar a solicitação, o time administrativo da plataforma irá analisar e decidir se aprova ou não a troca de titularidade. Você será notificado sobre a decisão.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDialogClose(false)}
                      disabled={isSubmitting || isCheckingUser}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSubmitTransferRequest}
                      disabled={!userFound || isSubmitting || isCheckingUser}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Solicitação"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Cancelar Inscrição</DialogTitle>
                    <DialogDescription>
                      Confirme se deseja cancelar esta inscrição e processar o reembolso.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800">Atenção: Esta ação não pode ser desfeita!</p>
                          <p className="text-xs text-red-700 mt-1">
                            Ao confirmar, a inscrição será cancelada e o valor de <strong>{formatCurrency(registration.financeiro?.total || 0)}</strong> será devolvido para o comprador <strong>{registration.comprador?.nome || "N/A"}</strong> ({registration.comprador?.email || "N/A"}) em até 5 dias úteis.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCancelDialog(false)}
                      disabled={isCancelling}
                    >
                      Não, manter inscrição
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleCancelRegistration}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Sim, cancelar e reembolsar
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="atleta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="atleta" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados do Atleta
          </TabsTrigger>
          <TabsTrigger value="corrida" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dados da Corrida
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dados de Pagamento
          </TabsTrigger>
        </TabsList>

        {/* Aba: Dados do Atleta */}
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
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Nome Completo</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm font-medium">{registration.atleta?.nome || "N/A"}</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dados do Evento
                </CardTitle>
                <CardDescription>
                  Informações sobre o evento inscrito
                </CardDescription>
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
                    <Label className="text-sm text-muted-foreground">Data do Evento</Label>
                    <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{formatDateTime(registration.evento.data)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Categoria</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <Badge variant="outline">{registration.evento.categoria}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Localização</Label>
                  <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{registration.evento.localizacao}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Modalidade</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm">{registration.evento.modalidade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dados da Inscrição
                </CardTitle>
                <CardDescription>
                  Informações sobre quando e como foi feita a inscrição
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Data da Inscrição</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm">
                        {formatDateTime(registration.dataInscricao, registration.horarioInscricao)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Número da Inscrição</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm font-mono">{registration.numeroInscricao}</p>
                    </div>
                  </div>
                </div>

                {registration.comprador && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Comprador</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm font-medium">{registration.comprador.nome}</p>
                      <p className="text-xs text-muted-foreground">{registration.comprador.email}</p>
                    </div>
                  </div>
                )}

                {/* Dados da Corrida */}
                <div className="pt-4 border-t space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900">Dados da Corrida</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {registration.atleta?.tamanhoCamiseta && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Tamanho de Camiseta</Label>
                        <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                          <Shirt className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{registration.atleta.tamanhoCamiseta}</Badge>
                        </div>
                      </div>
                    )}
                  </div>

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

                  {/* Termo de Responsabilidade */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Termo de Responsabilidade</Label>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {registration.termo.aceito ? (
                        <div className="space-y-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Aceito
                          </Badge>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p>
                              Data e Horário: {formatDateTime(registration.termo.dataAceite, registration.termo.horarioAceite)}
                            </p>
                            <p>IP do Aceite: {registration.termo.ipAceite}</p>
                          </div>
                        </div>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          Não Aceito
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Dados de Pagamento */}
        <TabsContent value="pagamento">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Dados Financeiros
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

