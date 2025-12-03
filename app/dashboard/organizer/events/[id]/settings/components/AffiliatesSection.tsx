"use client"

import { logger } from "@/lib/utils/logger"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Plus } from "lucide-react"
import { toast } from "sonner"

interface AffiliatesSectionProps {
  eventId: string
  affiliates: any[]
  showAddAffiliate: boolean
  setShowAddAffiliate: (value: boolean) => void
  editingAffiliate: any | null
  setEditingAffiliate: (value: any | null) => void
  newAffiliate: {
    email: string
    commission_type: "percentage" | "fixed"
    commission_value: string
  }
  setNewAffiliate: (value: any) => void
  fetchAffiliates: () => void
}

export function AffiliatesSection({
  eventId,
  affiliates,
  showAddAffiliate,
  setShowAddAffiliate,
  editingAffiliate,
  setEditingAffiliate,
  newAffiliate,
  setNewAffiliate,
  fetchAffiliates,
}: AffiliatesSectionProps) {
  const handleSaveAffiliate = async () => {
    try {
      const affiliateData = editingAffiliate || newAffiliate
      
      if (!affiliateData.email || !affiliateData.commission_value) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }

      if (editingAffiliate) {
        toast.success("Funcionalidade de edição em desenvolvimento")
        setShowAddAffiliate(false)
        setEditingAffiliate(null)
      } else {
        const response = await fetch('/api/events/affiliate-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            email: affiliateData.email,
            commission_type: affiliateData.commission_type,
            commission_value: parseFloat(affiliateData.commission_value),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || "Erro ao enviar convite")
          return
        }

        toast.success("Convite enviado com sucesso!")
        resetForm()
        fetchAffiliates()
      }
    } catch (error) {
      logger.error("Erro ao salvar afiliado:", error)
      toast.error("Erro ao salvar afiliado")
    }
  }

  const resetForm = () => {
    setShowAddAffiliate(false)
    setEditingAffiliate(null)
    setNewAffiliate({
      email: "",
      commission_type: "percentage",
      commission_value: "",
    })
  }

  if (!eventId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">ID do evento não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-[#156634]" />
            Afiliados do Evento
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie os afiliados deste evento
          </p>
        </div>
        <Button 
          className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
          onClick={() => {
            setShowAddAffiliate(true)
            setEditingAffiliate(null)
            setNewAffiliate({
              email: "",
              commission_type: "percentage",
              commission_value: "",
            })
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Convidar Afiliado
        </Button>
      </div>

      {/* Formulário de adicionar/editar afiliado */}
      {(showAddAffiliate || editingAffiliate) && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>{editingAffiliate ? "Editar Afiliado" : "Convidar Novo Afiliado"}</CardTitle>
            <CardDescription>
              {editingAffiliate ? "Atualize as informações do afiliado" : "Envie um convite para um afiliado participar deste evento"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="affiliate-email">Email do Afiliado *</Label>
                <Input
                  id="affiliate-email"
                  type="email"
                  placeholder="afiliado@exemplo.com"
                  value={editingAffiliate?.email || newAffiliate.email}
                  onChange={(e) => {
                    if (editingAffiliate) {
                      setEditingAffiliate({ ...editingAffiliate, email: e.target.value })
                    } else {
                      setNewAffiliate({ ...newAffiliate, email: e.target.value })
                    }
                  }}
                  disabled={!!editingAffiliate}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Comissão *</Label>
                <Select
                  value={editingAffiliate?.commission_type || newAffiliate.commission_type}
                  onValueChange={(value: "percentage" | "fixed") => {
                    if (editingAffiliate) {
                      setEditingAffiliate({ ...editingAffiliate, commission_type: value })
                    } else {
                      setNewAffiliate({ ...newAffiliate, commission_type: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliate-commission-value">
                  {editingAffiliate ? (editingAffiliate.commission_type === "percentage" ? "Comissão (%) *" : "Comissão (R$) *") : (newAffiliate.commission_type === "percentage" ? "Comissão (%) *" : "Comissão (R$) *")}
                </Label>
                <Input
                  id="affiliate-commission-value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={editingAffiliate ? (editingAffiliate.commission_type === "percentage" ? "10.00" : "50.00") : (newAffiliate.commission_type === "percentage" ? "10.00" : "50.00")}
                  value={editingAffiliate?.commission_value || newAffiliate.commission_value}
                  onChange={(e) => {
                    if (editingAffiliate) {
                      setEditingAffiliate({ ...editingAffiliate, commission_value: e.target.value })
                    } else {
                      setNewAffiliate({ ...newAffiliate, commission_value: e.target.value })
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                className="bg-[#156634] hover:bg-[#1a7a3e]"
                onClick={handleSaveAffiliate}
              >
                {editingAffiliate ? "Salvar Alterações" : "Enviar Convite"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de afiliados */}
      {affiliates.length === 0 ? (
        <Card className="border-2 shadow-sm">
          <CardContent className="py-12 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum afiliado convidado</h3>
            <p className="text-sm text-gray-600 mb-6">Convide afiliados para promover este evento</p>
            <Button 
              className="bg-[#156634] hover:bg-[#1a7a3e]"
              onClick={() => setShowAddAffiliate(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Convidar Primeiro Afiliado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {affiliates.map((affiliate: any) => (
            <Card key={affiliate.id} className="border-2 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{affiliate.email}</p>
                      <Badge variant={
                        affiliate.status === 'accepted' ? 'default' : 
                        affiliate.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
                        {affiliate.status === 'accepted' ? 'Aceito' : 
                         affiliate.status === 'pending' ? 'Pendente' : 
                         'Recusado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Comissão: {affiliate.commission_type === 'percentage' 
                        ? `${affiliate.commission_value}%` 
                        : `R$ ${parseFloat(affiliate.commission_value || 0).toFixed(2)}`}
                    </p>
                    {affiliate.affiliate?.user && (
                      <p className="text-xs text-gray-400">
                        Nome: {affiliate.affiliate.user.full_name || affiliate.affiliate.user.email}
                      </p>
                    )}
                    {affiliate.created_at && (
                      <p className="text-xs text-gray-400">
                        Convite enviado em: {new Date(affiliate.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

