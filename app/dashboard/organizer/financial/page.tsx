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
import { Loader2, DollarSign, TrendingUp, Wallet, ArrowDown, Filter, Plus, Users, Eye, Edit, FilePlus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

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
  
  // Usuários da organização
  const [organizationUsers, setOrganizationUsers] = useState<any[]>([])
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPermissions, setNewUserPermissions] = useState({
    can_view: true,
    can_edit: false,
    can_create: false,
    can_delete: false,
  })
  const [addingUser, setAddingUser] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])

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

      // Buscar organizador
      const { data: organizer } = await supabase
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!organizer) {
        toast.error("Organizador não encontrado")
        return
      }

      setOrganizerId(organizer.id)

      // Garantir que existe saldo
      await supabase.rpc("ensure_organizer_balance", { p_organizer_id: organizer.id })

      // Buscar saldo
      const { data: balanceData } = await supabase
        .from("organizer_balances")
        .select("*")
        .eq("organizer_id", organizer.id)
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
        .eq("organizer_id", organizer.id)
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
        .eq("organizer_id", organizer.id)
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
        .eq("organizer_id", organizer.id)
        .order("requested_at", { ascending: false })

      setWithdrawals(withdrawalsData || [])

      // Buscar usuários da organização
      const { data: orgUsers } = await supabase
        .from("organization_users")
        .select(`
          *,
          user:users(id, email, full_name)
        `)
        .eq("organizer_id", organizer.id)
        .eq("is_active", true)

      setOrganizationUsers(orgUsers || [])

      // Buscar todos os usuários para adicionar
      const { data: allUsersData } = await supabase
        .from("users")
        .select("id, email, full_name")
        .order("email")

      setAllUsers(allUsersData || [])
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

  const handleAddUser = async () => {
    if (!organizerId || !newUserEmail) {
      toast.error("Preencha o email do usuário")
      return
    }

    try {
      setAddingUser(true)
      const supabase = createClient()

      // Buscar usuário pelo email
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", newUserEmail)
        .single()

      if (!user) {
        toast.error("Usuário não encontrado com este email")
        return
      }

      // Verificar se já está na organização
      const { data: existing } = await supabase
        .from("organization_users")
        .select("id")
        .eq("organizer_id", organizerId)
        .eq("user_id", user.id)
        .single()

      if (existing) {
        toast.error("Usuário já está na organização")
        return
      }

      // Adicionar usuário
      const { error } = await supabase
        .from("organization_users")
        .insert({
          organizer_id: organizerId,
          user_id: user.id,
          can_view: newUserPermissions.can_view,
          can_edit: newUserPermissions.can_edit,
          can_create: newUserPermissions.can_create,
          can_delete: newUserPermissions.can_delete,
          is_active: true,
        })

      if (error) throw error

      toast.success("Usuário adicionado com sucesso!")
      setShowAddUserDialog(false)
      setNewUserEmail("")
      setNewUserPermissions({
        can_view: true,
        can_edit: false,
        can_create: false,
        can_delete: false,
      })
      fetchData()
    } catch (error: any) {
      console.error("Erro ao adicionar usuário:", error)
      toast.error("Erro ao adicionar usuário: " + (error.message || "Erro desconhecido"))
    } finally {
      setAddingUser(false)
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
          <TabsTrigger value="users">Usuários</TabsTrigger>
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

        {/* Tab: Usuários */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários da Organização</CardTitle>
                  <CardDescription>Gerencie permissões dos usuários</CardDescription>
                </div>
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Usuário</DialogTitle>
                      <DialogDescription>
                        Adicione um usuário à sua organização com permissões específicas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email do Usuário</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="usuario@exemplo.com"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Permissões</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_view"
                              checked={newUserPermissions.can_view}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_view: !!checked })
                              }
                            />
                            <Label htmlFor="can_view" className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" />
                              Visualizar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_edit"
                              checked={newUserPermissions.can_edit}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_edit: !!checked })
                              }
                            />
                            <Label htmlFor="can_edit" className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" />
                              Editar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_create"
                              checked={newUserPermissions.can_create}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_create: !!checked })
                              }
                            />
                            <Label htmlFor="can_create" className="flex items-center gap-2 cursor-pointer">
                              <FilePlus className="h-4 w-4" />
                              Criar
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="can_delete"
                              checked={newUserPermissions.can_delete}
                              onCheckedChange={(checked) =>
                                setNewUserPermissions({ ...newUserPermissions, can_delete: !!checked })
                              }
                            />
                            <Label htmlFor="can_delete" className="flex items-center gap-2 cursor-pointer">
                              <Trash2 className="h-4 w-4" />
                              Deletar
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddUser}
                        disabled={addingUser || !newUserEmail}
                        className="bg-[#156634] hover:bg-[#1a7a3e]"
                      >
                        {addingUser ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          "Adicionar Usuário"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum usuário adicionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizationUsers.map((orgUser) => (
                      <TableRow key={orgUser.id}>
                        <TableCell>{orgUser.user?.full_name || "-"}</TableCell>
                        <TableCell>{orgUser.user?.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {orgUser.can_view && <Badge variant="outline">Visualizar</Badge>}
                            {orgUser.can_edit && <Badge variant="outline">Editar</Badge>}
                            {orgUser.can_create && <Badge variant="outline">Criar</Badge>}
                            {orgUser.can_delete && <Badge variant="outline">Deletar</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const supabase = createClient()
                              const { error } = await supabase
                                .from("organization_users")
                                .update({ is_active: false })
                                .eq("id", orgUser.id)
                              if (error) {
                                toast.error("Erro ao remover usuário")
                              } else {
                                toast.success("Usuário removido")
                                fetchData()
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
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

