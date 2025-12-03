"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, FileText, Save } from "lucide-react"

export function PaymentMethodsSection() {
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#156634]" />
          Métodos de Pagamento
        </CardTitle>
        <CardDescription>
          Habilite ou desabilite métodos de pagamento específicos para este evento
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#156634]" />
              <div>
                <Label className="text-base font-semibold">PIX</Label>
                <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
              </div>
            </div>
            <Checkbox defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#156634]" />
              <div>
                <Label className="text-base font-semibold">Cartão de Crédito</Label>
                <p className="text-sm text-muted-foreground">Parcelamento em até 12x</p>
              </div>
            </div>
            <Checkbox defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#156634]" />
              <div>
                <Label className="text-base font-semibold">Boleto</Label>
                <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
              </div>
            </div>
            <Checkbox />
          </div>
        </div>
        <Button className="bg-[#156634] hover:bg-[#1a7a3e] text-white">
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  )
}

