"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Code, Save, Loader2 } from "lucide-react"

interface PixelsSectionProps {
  pixels: {
    google_analytics_id: string
    google_tag_manager_id: string
    facebook_pixel_id: string
  }
  setPixels: (pixels: any) => void
  handleSavePixels: () => void
  saving: boolean
}

export function PixelsSection({ pixels, setPixels, handleSavePixels, saving }: PixelsSectionProps) {
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Code className="h-5 w-5 text-[#156634]" />
          Pixels do Google
        </CardTitle>
        <CardDescription>
          Configure os pixels de rastreamento do Google Analytics e Google Tag Manager
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="google_analytics_id">Google Analytics ID (G-XXXXXXXXXX)</Label>
          <Input
            id="google_analytics_id"
            value={pixels.google_analytics_id}
            onChange={(e) => setPixels({ ...pixels, google_analytics_id: e.target.value })}
            placeholder="G-XXXXXXXXXX"
          />
          <p className="text-xs text-gray-500">
            Os pixels serão executados na landing page e na página de checkout
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_tag_manager_id">Google Tag Manager ID (GTM-XXXXXXX)</Label>
          <Input
            id="google_tag_manager_id"
            value={pixels.google_tag_manager_id}
            onChange={(e) => setPixels({ ...pixels, google_tag_manager_id: e.target.value })}
            placeholder="GTM-XXXXXXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebook_pixel_id">Facebook Pixel ID (opcional)</Label>
          <Input
            id="facebook_pixel_id"
            value={pixels.facebook_pixel_id}
            onChange={(e) => setPixels({ ...pixels, facebook_pixel_id: e.target.value })}
            placeholder="123456789012345"
          />
        </div>
        <Button 
          onClick={handleSavePixels}
          disabled={saving}
          className="bg-[#156634] hover:bg-[#1a7a3e] text-white"
        >
          {saving ? (
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
      </CardContent>
    </Card>
  )
}

