"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send } from "lucide-react"
import { affiliateSchema, AffiliateFormData } from "@/lib/schemas/event-settings"

interface AffiliateFormProps {
  defaultValues?: Partial<AffiliateFormData>
  onSubmit: (data: AffiliateFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export function AffiliateForm({ 
  defaultValues, 
  onSubmit, 
  onCancel,
  isEditing = false 
}: AffiliateFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AffiliateFormData>({
    resolver: zodResolver(affiliateSchema),
    defaultValues: {
      email: "",
      commission_type: "percentage",
      commission_value: "",
      ...defaultValues,
    },
  })

  const commissionType = watch("commission_type")

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Afiliado" : "Convidar Novo Afiliado"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Atualize as informações do afiliado" 
            : "Envie um convite para um afiliado participar deste evento"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail do Afiliado *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="afiliado@email.com"
                disabled={isEditing}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Comissão *</Label>
              <Select
                value={commissionType}
                onValueChange={(value: "percentage" | "fixed") => setValue("commission_type", value)}
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
              <Label htmlFor="commission_value">
                {commissionType === "percentage" ? "Percentual (%) *" : "Valor Fixo (R$) *"}
              </Label>
              <Input
                id="commission_value"
                type="number"
                step="0.01"
                min="0"
                {...register("commission_value")}
                placeholder={commissionType === "percentage" ? "10" : "50"}
              />
              {errors.commission_value && (
                <p className="text-xs text-red-500">{errors.commission_value.message}</p>
              )}
            </div>
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
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isEditing ? "Salvar Alterações" : "Enviar Convite"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

