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
import { Loader2, Edit, User, Mail, Search, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export default function AffiliatesPage() {
  const [loading, setLoading] = useState(true)
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    barte_seller_id: "",
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
        .from("affiliates")
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
      setAffiliates(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (aff: any) => {
    setSelectedAffiliate(aff)
    setEditData({
      barte_seller_id: aff.barte_seller_id?.toString() || "",
      is_active: aff.is_active !== false,
      admin_notes: aff.admin_notes || "",
    })
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedAffiliate) return

    try {
      const supabase = createClient()

      const updateData: any = {
        is_active: editData.is_active,
      }

      if (editData.barte_seller_id) {
        updateData.barte_seller_id = parseInt(editData.barte_seller_id)
      }
      if (editData.admin_notes !== undefined) {
        updateData.admin_notes = editData.admin_notes
      }

      const { error } = await supabase
        .from("affiliates")
        .update(updateData)
        .eq("id", selectedAffiliate.id)

      if (error) throw error

      toast.success("Afiliado atualizado com sucesso!")
      setEditDialogOpen(false)
      setSelectedAffiliate(null)
      fetchData()
    } catch (error: any) {
      console.error("Erro ao atualizar:", error)
      toast.error(error.message || "Erro ao atualizar")
    }
  }

  const filteredAffiliates = affiliates.filter((aff) => {
    const search = searchTerm.toLowerCase()
    return (
      aff.user?.email?.toLowerCase().includes(search) ||
      aff.user?.full_name?.toLowerCase().includes(search) ||
      aff.referral_code?.toLowerCase().includes(search)
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
          <h1 className="text-3xl font-bold tracking-tight">Afiliados</h1>
          <p className="text-muted-foreground">
            Gerencie afiliados e IDs da Barte
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
                  placeholder="Buscar por nome, email ou código de referência..."
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
            {filteredAffiliates.map((aff) => (
              <div
                key={aff.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{aff.user?.full_name || "Afiliado"}</h3>
                    <Badge variant={aff.status === "approved" ? "default" : aff.status === "pending" ? "secondary" : "destructive"}>
                      {aff.status === "approved" ? "Aprovado" : aff.status === "pending" ? "Pendente" : "Rejeitado"}
                    </Badge>
                    <Badge variant={aff.is_active ? "default" : "secondary"}>
                      {aff.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {aff.user?.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      Código: {aff.referral_code}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {aff.barte_seller_id && (
                        <span>Barte ID: {aff.barte_seller_id}</span>
                      )}
                      <span>Ganhos: R$ {Number(aff.total_earnings || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(aff)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Afiliado</DialogTitle>
            <DialogDescription>
              Configure ID da Barte e status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="space-y-2 flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={editData.is_active}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                className="mr-2"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Afiliado ativo</Label>
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

