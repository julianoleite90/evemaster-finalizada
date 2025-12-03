"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { couponSchema, CouponFormData } from "@/lib/schemas/event-settings"
import { useEffect } from "react"

interface Affiliate {
  id: string
  user?: {
    full_name?: string
    email?: string
  }
}

interface CouponFormProps {
  defaultValues?: Partial<CouponFormData>
  affiliates?: Affiliate[]
  onSubmit: (data: CouponFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export function CouponForm({ 
  defaultValues, 
  affiliates = [], 
  onSubmit, 
  onCancel,
  isEditing = false 
}: CouponFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: "",
      affiliate_id: "",
      max_uses: "",
      expires_at: "",
      is_active: true,
      ...defaultValues,
    },
  })

  const discountType = watch("discount_type")
  const isActive = watch("is_active")

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Cupom" : "Adicionar Novo Cupom"}</CardTitle>
        <CardDescription>
          Configure o cupom de desconto para este evento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom *</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="EXEMPLO10"
                className="uppercase"
              />
              {errors.code && (
                <p className="text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Desconto *</Label>
              <Select
                value={discountType}
                onValueChange={(value: "percentage" | "fixed") => setValue("discount_type", value)}
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
              <Label htmlFor="discount_value">
                {discountType === "percentage" ? "Percentual (%) *" : "Valor Fixo (R$) *"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                min="0"
                {...register("discount_value")}
                placeholder={discountType === "percentage" ? "10.00" : "50.00"}
              />
              {errors.discount_value && (
                <p className="text-xs text-red-500">{errors.discount_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vincular a Afiliado (opcional)</Label>
              <Select
                value={watch("affiliate_id") || "none"}
                onValueChange={(value) => setValue("affiliate_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum afiliado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum afiliado</SelectItem>
                  {affiliates.map((aff) => (
                    <SelectItem key={aff.id} value={aff.id}>
                      {aff.user?.full_name || aff.user?.email || "Afiliado"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_uses">Máximo de Usos (opcional)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                {...register("max_uses")}
                placeholder="Ilimitado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                {...register("expires_at")}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked as boolean)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Cupom ativo
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#156634] hover:bg-[#1a7a3e] px-6 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

