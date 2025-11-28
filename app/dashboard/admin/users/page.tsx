"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Edit, User, Mail, Phone, Search, CheckCircle2, XCircle } from "lucide-react"

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deactivationReason, setDeactivationReason] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (user: any, activate: boolean) => {
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const updateData: any = {
        is_active: activate,
      }

      if (!activate) {
        updateData.deactivated_at = new Date().toISOString()
        updateData.deactivated_by = currentUser?.id
        updateData.deactivation_reason = deactivationReason || "Desativado pelo administrador"
      } else {
        updateData.deactivated_at = null
        updateData.deactivated_by = null
        updateData.deactivation_reason = null
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)

      if (error) throw error

      toast.success(activate ? "Usuário ativado com sucesso!" : "Usuário desativado com sucesso!")
      setDeactivateDialogOpen(false)
      setDeactivationReason("")
      fetchData()
    } catch (error: any) {
      console.error("Erro ao atualizar:", error)
      toast.error(error.message || "Erro ao atualizar")
    }
  }

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase()
    return (
      user.email?.toLowerCase().includes(search) ||
      user.full_name?.toLowerCase().includes(search) ||
      user.phone?.includes(search) ||
      user.cpf?.includes(search) ||
      user.role?.toLowerCase().includes(search)
    )
  })

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
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone, CPF ou role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{user.full_name || "Sem nome"}</h3>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                    {user.cpf && <div>CPF: {user.cpf}</div>}
                    {user.deactivated_at && (
                      <div className="text-red-500">
                        Desativado em: {new Date(user.deactivated_at).toLocaleDateString("pt-BR")}
                        {user.deactivation_reason && ` - ${user.deactivation_reason}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.is_active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setDeactivateDialogOpen(true)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleToggleActive(user, true)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ativar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Desativação */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Informe o motivo da desativação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deactivation_reason">Motivo da Desativação *</Label>
              <Textarea
                id="deactivation_reason"
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Descreva o motivo da desativação..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deactivationReason.trim()) {
                  toast.error("Informe o motivo da desativação")
                  return
                }
                handleToggleActive(selectedUser, false)
              }}
            >
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

