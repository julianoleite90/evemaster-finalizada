"use client"

import { Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AccessDeniedProps {
  message?: string
  title?: string
}

export function AccessDenied({ 
  message = "Você não tem permissão para acessar este recurso.",
  title = "Acesso Negado"
}: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Entre em contato com o administrador se você acredita que deveria ter acesso a este recurso.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

