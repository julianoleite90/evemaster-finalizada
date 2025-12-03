"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Code, Save, Loader2 } from "lucide-react"
import { pixelsSchema, PixelsFormData } from "@/lib/schemas/event-settings"

interface PixelsFormProps {
  defaultValues: PixelsFormData
  onSubmit: (data: PixelsFormData) => Promise<void>
  disabled?: boolean
}

export function PixelsForm({ defaultValues, onSubmit, disabled }: PixelsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PixelsFormData>({
    resolver: zodResolver(pixelsSchema),
    defaultValues,
  })

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Code className="h-5 w-5 text-[#156634]" />
          Pixels de Rastreamento
        </CardTitle>
        <CardDescription>
          Configure os pixels do Google Analytics, Google Tag Manager e Facebook Pixel
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">Google Analytics ID (G-XXXXXXXXXX)</Label>
            <Input
              id="google_analytics_id"
              {...register("google_analytics_id")}
              placeholder="G-XXXXXXXXXX"
              disabled={disabled}
            />
            <p className="text-xs text-gray-500">
              Os pixels serão executados na landing page e na página de checkout
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_tag_manager_id">Google Tag Manager ID (GTM-XXXXXXX)</Label>
            <Input
              id="google_tag_manager_id"
              {...register("google_tag_manager_id")}
              placeholder="GTM-XXXXXXX"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID (opcional)</Label>
            <Input
              id="facebook_pixel_id"
              {...register("facebook_pixel_id")}
              placeholder="123456789012345"
              disabled={disabled}
            />
          </div>

          <Button
            type="submit"
            disabled={disabled || isSubmitting || !isDirty}
            className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Pixels
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

