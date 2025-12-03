"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag, Plus, Edit } from "lucide-react"
import { toast } from "sonner"

interface CouponsSectionProps {
  eventId: string
  coupons: any[]
  showAddCoupon: boolean
  setShowAddCoupon: (value: boolean) => void
  editingCoupon: any | null
  setEditingCoupon: (value: any | null) => void
  newCoupon: {
    code: string
    discount_type: "percentage" | "fixed"
    discount_value: string
    affiliate_id: string
    max_uses: string
    expires_at: string
    is_active: boolean
  }
  setNewCoupon: (value: any) => void
  acceptedAffiliates: any[]
  fetchCoupons: () => Promise<void>
}

export function CouponsSection({
  eventId,
  coupons,
  showAddCoupon,
  setShowAddCoupon,
  editingCoupon,
  setEditingCoupon,
  newCoupon,
  setNewCoupon,
  acceptedAffiliates,
  fetchCoupons,
}: CouponsSectionProps) {
  const handleSaveCoupon = async () => {
    const couponData = editingCoupon || newCoupon
    
    if (!couponData.code || !(couponData.discount_percentage || couponData.discount_amount || couponData.discount_value)) {
      toast.error("Preencha código e valor do desconto")
      return
    }

    try {
      const isPercentage = editingCoupon 
        ? !!editingCoupon.discount_percentage 
        : couponData.discount_type === "percentage"
      
      const discountValue = editingCoupon
        ? (editingCoupon.discount_percentage || editingCoupon.discount_amount || "")
        : couponData.discount_value

      if (!discountValue || isNaN(parseFloat(discountValue))) {
        toast.error("Valor do desconto inválido")
        return
      }

      const requestBody = {
        event_id: eventId,
        code: couponData.code,
        discount_percentage: isPercentage ? parseFloat(discountValue) : null,
        discount_amount: !isPercentage ? parseFloat(discountValue) : null,
        affiliate_id: couponData.affiliate_id && couponData.affiliate_id !== "" && couponData.affiliate_id !== "none" ? couponData.affiliate_id : null,
        max_uses: couponData.max_uses && couponData.max_uses !== "" ? parseInt(couponData.max_uses) : null,
        expires_at: couponData.expires_at && couponData.expires_at !== "" ? couponData.expires_at : null,
        is_active: couponData.is_active !== false,
      }

      const response = await fetch(editingCoupon ? `/api/events/coupon/${editingCoupon.id}` : "/api/events/coupon", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Erro ao salvar cupom")
      }

      toast.success(editingCoupon ? "Cupom atualizado com sucesso!" : "Cupom criado com sucesso!")
      resetForm()
      await fetchCoupons()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cupom")
    }
  }

  const resetForm = () => {
    setShowAddCoupon(false)
    setEditingCoupon(null)
    setNewCoupon({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      affiliate_id: "",
      max_uses: "",
      expires_at: "",
      is_active: true,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#156634]" />
            Cupons de Desconto
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie cupons de desconto para este evento
          </p>
        </div>
        <Button 
          className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
          onClick={() => {
            setShowAddCoupon(true)
            setEditingCoupon(null)
            setNewCoupon({
              code: "",
              discount_type: "percentage",
              discount_value: "",
              affiliate_id: "",
              max_uses: "",
              expires_at: "",
              is_active: true,
            })
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Cupom
        </Button>
      </div>

      {/* Formulário de adicionar/editar cupom */}
      {(showAddCoupon || editingCoupon) && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>{editingCoupon ? "Editar Cupom" : "Adicionar Novo Cupom"}</CardTitle>
            <CardDescription>
              Configure o cupom de desconto para este evento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Código do Cupom *</Label>
                <Input
                  id="coupon-code"
                  placeholder="EXEMPLO10"
                  value={editingCoupon?.code || newCoupon.code}
                  onChange={(e) => {
                    if (editingCoupon) {
                      setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })
                    } else {
                      setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Desconto *</Label>
                <Select
                  value={editingCoupon ? (editingCoupon.discount_percentage ? "percentage" : "fixed") : newCoupon.discount_type}
                  onValueChange={(value: "percentage" | "fixed") => {
                    if (editingCoupon) {
                      setEditingCoupon({ 
                        ...editingCoupon, 
                        discount_percentage: value === "percentage" ? editingCoupon.discount_percentage : null,
                        discount_amount: value === "fixed" ? editingCoupon.discount_amount : null,
                      })
                    } else {
                      setNewCoupon({ ...newCoupon, discount_type: value })
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
                <Label htmlFor="coupon-discount-value">
                  {editingCoupon ? (editingCoupon.discount_percentage ? "Percentual (%) *" : "Valor Fixo (R$) *") : (newCoupon.discount_type === "percentage" ? "Percentual (%) *" : "Valor Fixo (R$) *")}
                </Label>
                <Input
                  id="coupon-discount-value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={editingCoupon ? (editingCoupon.discount_percentage ? "10.00" : "50.00") : (newCoupon.discount_type === "percentage" ? "10.00" : "50.00")}
                  value={editingCoupon ? (editingCoupon.discount_percentage || editingCoupon.discount_amount || "") : newCoupon.discount_value}
                  onChange={(e) => {
                    if (editingCoupon) {
                      if (editingCoupon.discount_percentage) {
                        setEditingCoupon({ ...editingCoupon, discount_percentage: parseFloat(e.target.value) || null })
                      } else {
                        setEditingCoupon({ ...editingCoupon, discount_amount: parseFloat(e.target.value) || null })
                      }
                    } else {
                      setNewCoupon({ ...newCoupon, discount_value: e.target.value })
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-affiliate">Vincular a Afiliado (opcional)</Label>
                <Select
                  value={editingCoupon?.affiliate_id || newCoupon.affiliate_id || "none"}
                  onValueChange={(value) => {
                    const finalValue = value === "none" ? null : value
                    if (editingCoupon) {
                      setEditingCoupon({ ...editingCoupon, affiliate_id: finalValue })
                    } else {
                      setNewCoupon({ ...newCoupon, affiliate_id: finalValue || "" })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum afiliado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum afiliado</SelectItem>
                    {acceptedAffiliates.map((aff) => {
                      if (!aff.affiliate?.id) return null
                      return (
                        <SelectItem key={aff.affiliate.id} value={aff.affiliate.id}>
                          {aff.affiliate.user?.full_name || aff.affiliate.user?.email || "Afiliado"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-max-uses">Máximo de Usos (opcional)</Label>
                <Input
                  id="coupon-max-uses"
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={editingCoupon?.max_uses || newCoupon.max_uses}
                  onChange={(e) => {
                    if (editingCoupon) {
                      setEditingCoupon({ ...editingCoupon, max_uses: e.target.value ? parseInt(e.target.value) : null })
                    } else {
                      setNewCoupon({ ...newCoupon, max_uses: e.target.value })
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-expires">Data de Expiração (opcional)</Label>
                <Input
                  id="coupon-expires"
                  type="datetime-local"
                  value={editingCoupon?.expires_at ? new Date(editingCoupon.expires_at).toISOString().slice(0, 16) : newCoupon.expires_at}
                  onChange={(e) => {
                    if (editingCoupon) {
                      setEditingCoupon({ ...editingCoupon, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    } else {
                      setNewCoupon({ ...newCoupon, expires_at: e.target.value })
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="coupon-active"
                checked={editingCoupon?.is_active !== false && (editingCoupon ? editingCoupon.is_active : newCoupon.is_active)}
                onCheckedChange={(checked) => {
                  if (editingCoupon) {
                    setEditingCoupon({ ...editingCoupon, is_active: checked as boolean })
                  } else {
                    setNewCoupon({ ...newCoupon, is_active: checked as boolean })
                  }
                }}
              />
              <Label htmlFor="coupon-active" className="cursor-pointer">
                Cupom ativo
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="bg-[#156634] hover:bg-[#1a7a3e] px-6 py-2.5"
                onClick={handleSaveCoupon}
              >
                Salvar
              </Button>
              <Button
                variant="outline"
                className="px-6 py-2.5"
                onClick={resetForm}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cupons */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Cupons Cadastrados</CardTitle>
          <CardDescription>
            Lista de cupons de desconto para este evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cupom criado</h3>
              <p className="text-sm text-gray-600 mb-6">Crie seu primeiro cupom de desconto para este evento</p>
              <Button 
                className="bg-[#156634] hover:bg-[#1a7a3e]"
                onClick={() => setShowAddCoupon(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Cupom
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{coupon.code}</p>
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Desconto: {coupon.discount_percentage ? `${coupon.discount_percentage}%` : `R$ ${coupon.discount_amount?.toFixed(2)}`}
                    </p>
                    {coupon.affiliate && (
                      <p className="text-xs text-gray-400">
                        Afiliado: {coupon.affiliate.user?.full_name || coupon.affiliate.user?.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Usos: {coupon.current_uses || 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : " / Ilimitado"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCoupon(coupon)
                        setShowAddCoupon(false)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

