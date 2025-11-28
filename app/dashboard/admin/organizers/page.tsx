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
import { Loader2, Edit, CheckCircle2, XCircle, Building2, Mail, Phone, Search } from "lucide-react"

export default function OrganizersPage() {
  const [loading, setLoading] = useState(true)
  const [organizers, setOrganizers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrganizer, setSelectedOrganizer] = useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    barte_seller_id: "",
    platform_fee_percentage: "",
    payment_term_days: "",
    is_active: true,
    admin_notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("organizers")
        .select(`
          *,
          user:users(
            id,
            email,
            full_name,
            phone,
            is_active
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrganizers(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (org: any) => {
    setSelectedOrganizer(org)
    setEditData({
      barte_seller_id: org.barte_seller_id?.toString() || "",
      platform_fee_percentage: org.platform_fee_percentage?.toString() || "10.00",
      payment_term_days: org.payment_term_days?.toString() || "7",
      is_active: org.is_active !== false,
      admin_notes: org.admin_notes || "",
    })
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedOrganizer) return

    try {
      const supabase = createClient()

      const updateData: any = {
        is_active: editData.is_active,
      }

      if (editData.barte_seller_id) {
        updateData.barte_seller_id = parseInt(editData.barte_seller_id)
      }
      if (editData.platform_fee_percentage) {
        updateData.platform_fee_percentage = parseFloat(editData.platform_fee_percentage)
      }
      if (editData.payment_term_days) {
        updateData.payment_term_days = parseInt(editData.payment_term_days)
      }
      if (editData.admin_notes !== undefined) {
        updateData.admin_notes = editData.admin_notes
      }

      const { error } = await supabase
        .from("organizers")
        .update(updateData)
        .eq("id", selectedOrganizer.id)

      if (error) throw error

      toast.success("Organizador atualizado com sucesso!")
      setEditDialogOpen(false)
      setSelectedOrganizer(null)
      fetchData()
    } catch (error: any) {
      console.error("Erro ao atualizar:", error)
      toast.error(error.message || "Erro ao atualizar")
    }
  }

  const filteredOrganizers = organizers.filter((org) => {
    const search = searchTerm.toLowerCase()
    return (
      org.company_name?.toLowerCase().includes(search) ||
      org.user?.email?.toLowerCase().includes(search) ||
      org.user?.full_name?.toLowerCase().includes(search) ||
      org.company_cnpj?.includes(search)
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
          <h1 className="text-3xl font-bold tracking-tight">Organizadores</h1>
          <p className="text-muted-foreground">
            Gerencie organizadores, taxas e configurações
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
                  placeholder="Buscar por nome, email ou CNPJ..."
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
            {filteredOrganizers.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{org.company_name || org.user?.full_name}</h3>
                    <Badge variant={org.status === "approved" ? "default" : org.status === "pending" ? "secondary" : "destructive"}>
                            {org.status === "approved" ? "Aprovado" : org.status === "pending" ? "Pendente" : "Rejeitado"}
                          </Badge>
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                            {org.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {org.user?.email}
                      </div>
                    {org.company_cnpj && (
                      <div>CNPJ: {org.company_cnpj}</div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span>Taxa: {org.platform_fee_percentage || 10}%</span>
                      <span>Prazo: {org.payment_term_days || 7} dias</span>
                      {org.barte_seller_id && (
                        <span>Barte ID: {org.barte_seller_id}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(org)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                          </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Organizador</DialogTitle>
                            <DialogDescription>
              Configure taxas, prazo de recebimento e IDs da Barte
                            </DialogDescription>
                          </DialogHeader>
          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barte_seller_id">ID Seller Barte</Label>
                <Input
                  id="barte_seller_id"
                  type="number"
                  value={editData.barte_seller_id}
                  onChange={(e) => setEditData({ ...editData, barte_seller_id: e.target.value })}
                  placeholder="123"
                />
              </div>
                              <div className="space-y-2">
                                <Label htmlFor="platform_fee">Taxa da Plataforma (%)</Label>
                                <Input
                                  id="platform_fee"
                                  type="number"
                                  step="0.01"
                  value={editData.platform_fee_percentage}
                  onChange={(e) => setEditData({ ...editData, platform_fee_percentage: e.target.value })}
                  placeholder="10.00"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="payment_term">Prazo de Recebimento (dias)</Label>
                                <Input
                                  id="payment_term"
                                  type="number"
                  value={editData.payment_term_days}
                  onChange={(e) => setEditData({ ...editData, payment_term_days: e.target.value })}
                  placeholder="7"
                                />
                              </div>
                              <div className="space-y-2 flex items-center">
                <input
                  type="checkbox"
                                    id="is_active"
                  checked={editData.is_active}
                  onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                  className="mr-2"
                                  />
                <Label htmlFor="is_active" className="cursor-pointer">Organizador ativo</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
              <Label htmlFor="admin_notes">Observações</Label>
                              <Textarea
                                id="admin_notes"
                value={editData.admin_notes}
                onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                placeholder="Observações internas..."
                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSave}>
                              Salvar Alterações
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
    </div>
  )
}
