"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, CheckCircle2, XCircle, AlertCircle, User, Building2, Mail, Phone, MapPin } from "lucide-react"

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true)
  const [organizers, setOrganizers] = useState<any[]>([])
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvalData, setApprovalData] = useState({
    barte_seller_id: "",
    platform_fee_percentage: "10.00",
    payment_term_days: "7",
    admin_notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Buscar organizadores pendentes
      const { data: orgsData } = await supabase
        .from("organizers")
        .select(`
          *,
          user:users(
            id,
            email,
            full_name,
            phone,
            cpf
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      // Buscar afiliados pendentes
      const { data: affsData } = await supabase
        .from("affiliates")
        .select(`
          *,
          user:users(
            id,
            email,
            full_name,
            phone
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      setOrganizers(orgsData || [])
      setAffiliates(affsData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (item: any, type: "organizer" | "affiliate") => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (type === "organizer") {
        const updateData: any = {
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          is_active: true,
        }

        if (approvalData.barte_seller_id) {
          updateData.barte_seller_id = parseInt(approvalData.barte_seller_id)
        }
        if (approvalData.platform_fee_percentage) {
          updateData.platform_fee_percentage = parseFloat(approvalData.platform_fee_percentage)
        }
        if (approvalData.payment_term_days) {
          updateData.payment_term_days = parseInt(approvalData.payment_term_days)
        }
        if (approvalData.admin_notes) {
          updateData.admin_notes = approvalData.admin_notes
        }

        const { error } = await supabase
          .from("organizers")
          .update(updateData)
          .eq("id", item.id)

        if (error) throw error
      } else {
        const updateData: any = {
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          is_active: true,
        }

        if (approvalData.barte_seller_id) {
          updateData.barte_seller_id = parseInt(approvalData.barte_seller_id)
        }
        if (approvalData.admin_notes) {
          updateData.admin_notes = approvalData.admin_notes
        }

        const { error } = await supabase
          .from("affiliates")
          .update(updateData)
          .eq("id", item.id)

        if (error) throw error
      }

      toast.success(`${type === "organizer" ? "Organizador" : "Afiliado"} aprovado com sucesso!`)
      setApprovalDialogOpen(false)
      setSelectedItem(null)
      setApprovalData({
        barte_seller_id: "",
        platform_fee_percentage: "10.00",
        payment_term_days: "7",
        admin_notes: "",
      })
      fetchData()
    } catch (error: any) {
      console.error("Erro ao aprovar:", error)
      toast.error(error.message || "Erro ao aprovar")
    }
  }

  const handleReject = async (item: any, type: "organizer" | "affiliate") => {
    if (!rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição")
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const updateData = {
        status: "rejected",
        rejection_reason: rejectionReason,
        approved_by: user?.id,
        is_active: false,
      }

      const table = type === "organizer" ? "organizers" : "affiliates"
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", item.id)

      if (error) throw error

      toast.success(`${type === "organizer" ? "Organizador" : "Afiliado"} rejeitado`)
      setRejectionDialogOpen(false)
      setSelectedItem(null)
      setRejectionReason("")
      fetchData()
    } catch (error: any) {
      console.error("Erro ao rejeitar:", error)
      toast.error(error.message || "Erro ao rejeitar")
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aprovações</h1>
        <p className="text-muted-foreground">
          Aprove ou rejeite cadastros de organizadores e afiliados
        </p>
      </div>

      <Tabs defaultValue="organizers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizers">
            Organizadores ({organizers.length})
          </TabsTrigger>
          <TabsTrigger value="affiliates">
            Afiliados ({affiliates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizers" className="space-y-4">
          {organizers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum organizador pendente de aprovação</p>
              </CardContent>
            </Card>
          ) : (
            organizers.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {org.company_name || org.user?.full_name}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {org.user?.email}
                        </div>
                        {org.user?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {org.user.phone}
                          </div>
                        )}
                        {org.company_cnpj && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            CNPJ: {org.company_cnpj}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pendente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedItem(org)
                        setApprovalDialogOpen(true)
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedItem(org)
                        setRejectionDialogOpen(true)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          {affiliates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum afiliado pendente de aprovação</p>
              </CardContent>
            </Card>
          ) : (
            affiliates.map((aff) => (
              <Card key={aff.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {aff.user?.full_name || "Afiliado"}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {aff.user?.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          Código: {aff.referral_code}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Pendente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedItem(aff)
                        setApprovalDialogOpen(true)
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedItem(aff)
                        setRejectionDialogOpen(true)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Aprovação */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Aprovar {selectedItem && (organizers.some(o => o.id === selectedItem.id) ? "Organizador" : "Afiliado")}
            </DialogTitle>
            <DialogDescription>
              Configure os dados necessários para aprovação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barte_seller_id">ID Seller Barte *</Label>
                <Input
                  id="barte_seller_id"
                  type="number"
                  value={approvalData.barte_seller_id}
                  onChange={(e) => setApprovalData({ ...approvalData, barte_seller_id: e.target.value })}
                  placeholder="123"
                />
              </div>
              {organizers.some(o => o.id === selectedItem?.id) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="platform_fee">Taxa da Plataforma (%)</Label>
                    <Input
                      id="platform_fee"
                      type="number"
                      step="0.01"
                      value={approvalData.platform_fee_percentage}
                      onChange={(e) => setApprovalData({ ...approvalData, platform_fee_percentage: e.target.value })}
                      placeholder="10.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_term">Prazo de Recebimento (dias)</Label>
                    <Input
                      id="payment_term"
                      type="number"
                      value={approvalData.payment_term_days}
                      onChange={(e) => setApprovalData({ ...approvalData, payment_term_days: e.target.value })}
                      placeholder="7"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_notes">Observações (opcional)</Label>
              <Textarea
                id="admin_notes"
                value={approvalData.admin_notes}
                onChange={(e) => setApprovalData({ ...approvalData, admin_notes: e.target.value })}
                placeholder="Observações internas..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!approvalData.barte_seller_id) {
                  toast.error("ID Seller Barte é obrigatório")
                  return
                }
                handleApprove(selectedItem, organizers.some(o => o.id === selectedItem?.id) ? "organizer" : "affiliate")
              }}
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReject(selectedItem, organizers.some(o => o.id === selectedItem?.id) ? "organizer" : "affiliate")}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
