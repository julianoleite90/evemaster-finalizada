"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export function OtherSettingsSection() {
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#156634]" />
          Outras Configurações
        </CardTitle>
        <CardDescription>
          Configurações adicionais
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">
            Mais configurações em breve
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

