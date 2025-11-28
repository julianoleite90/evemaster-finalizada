"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"
import { Loader2, DollarSign, TrendingUp, Wallet, ArrowDown, Filter, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OrganizerFinancialPage() {
  const [loading, setLoading] = useState(true)
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  const [balance, setBalance] = useState({
    total_balance: 0,
    available_balance: 0,
    pending_balance: 0,
  })
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

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
        console.error("❌ [FINANCIAL] Usuário não tem acesso ao dashboard do organizador")
        toast.error("Você não tem permissão para acessar este dashboard")
        setLoading(false)
        return
      }

      const organizerId = access.organizerId
      setOrganizerId(organizerId)

      // Garantir que existe saldo
      await supabase.rpc("ensure_organizer_balance", { p_organizer_id: organizerId })

      // Buscar saldo
      const { data: balanceData } = await supabase
        .from("organizer_balances")
        .select("*")
        .eq("organizer_id", organizerId)
        .single()

      if (balanceData) {
        setBalance({
          total_balance: Number(balanceData.total_balance) || 0,
          available_balance: Number(balanceData.available_balance) || 0,
          pending_balance: Number(balanceData.pending_balance) || 0,
        })
      }

      // Buscar eventos
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, name, event_date")
        .eq("organizer_id", organizerId)
        .order("event_date", { ascending: false })

      setEvents(eventsData || [])

      // Buscar transações
      let query = supabase
        .from("financial_transactions")
        .select(`
          *,
          event:events(id, name),
          payment:payments(id, amount)
        `)
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (selectedEventId !== "all") {
        query = query.eq("event_id", selectedEventId)
      }

      const { data: transactionsData } = await query
      setTransactions(transactionsData || [])

      // Buscar saques
      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("organizer_id", organizerId)
        .order("requested_at", { ascending: false })

      setWithdrawals(withdrawalsData || [])

    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados financeiros")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestWithdrawal = async () => {
    if (!organizerId) return

    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor inválido")
      return
    }

    if (amount > balance.available_balance) {
      toast.error("Valor solicitado é maior que o saldo disponível")
      return
    }

    try {
      setRequestingWithdrawal(true)
      const supabase = createClient()

      // Criar saque
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert({
          organizer_id: organizerId,
          amount: amount,
          status: "pending",
        })
        .select()
        .single()

      if (withdrawalError) throw withdrawalError

      // Atualizar saldo (mover de available para pending) - não criar transação ainda, só quando for aprovado
      const { error: balanceError } = await supabase
        .from("organizer_balances")
        .update({
          available_balance: balance.available_balance - amount,
          pending_balance: balance.pending_balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("organizer_id", organizerId)

      if (balanceError) throw balanceError

      toast.success("Solicitação de saque criada com sucesso!")
      setShowWithdrawalDialog(false)
      setWithdrawalAmount("")
      fetchData()
    } catch (error: any) {
      console.error("Erro ao solicitar saque:", error)
      toast.error("Erro ao solicitar saque: " + (error.message || "Erro desconhecido"))
    } finally {
      setRequestingWithdrawal(false)
    }
  }


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      approved: { label: "Aprovado", variant: "default" },
      rejected: { label: "Rejeitado", variant: "destructive" },
      completed: { label: "Concluído", variant: "default" },
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie seus saldos e solicite saques
          </p>
        </div>
      </div>

      {/* Cards de Saldo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.total_balance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponível para Saque</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(balance.available_balance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pode ser sacado agora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(balance.pending_balance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botão Solicitar Saque */}
      <div className="flex justify-end">
        <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#156634] hover:bg-[#1a7a3e]">
              <ArrowDown className="h-4 w-4 mr-2" />
              Solicitar Saque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Saque</DialogTitle>
              <DialogDescription>
                Digite o valor que deseja sacar. Saldo disponível: {formatCurrency(balance.available_balance)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balance.available_balance}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWithdrawalDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleRequestWithdrawal}
                disabled={requestingWithdrawal || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                className="bg-[#156634] hover:bg-[#1a7a3e]"
              >
                {requestingWithdrawal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  "Solicitar Saque"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
        </TabsList>

        {/* Tab: Transações */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transações</CardTitle>
                  <CardDescription>Histórico de movimentações financeiras</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="w-[200px]">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.transaction_type === "credit" ? "default" : "destructive"}>
                            {transaction.transaction_type === "credit" ? "Crédito" : transaction.transaction_type === "debit" ? "Débito" : "Taxa"}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.event?.name || "-"}</TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell className={`text-right font-medium ${transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.transaction_type === "credit" ? "+" : "-"}
                          {formatCurrency(Math.abs(Number(transaction.amount)))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Saques */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Saque</CardTitle>
              <CardDescription>Histórico de saques solicitados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum saque encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>{formatDate(withdrawal.requested_at)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(Number(withdrawal.amount))}</TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell>{withdrawal.notes || withdrawal.rejection_reason || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

