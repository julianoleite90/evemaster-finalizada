"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    if (!email) {
      toast.error("Digite o email")
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      // Chamar a função RPC para confirmar o email
      const { error } = await supabase.rpc('confirm_user_email', {
        p_user_email: email
      })

      if (error) {
        console.error("Erro ao confirmar email:", error)
        toast.error(error.message || "Erro ao confirmar email")
        return
      }

      setConfirmed(true)
      toast.success("Email confirmado com sucesso!")
    } catch (error: any) {
      console.error("Erro:", error)
      toast.error(error.message || "Erro ao confirmar email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirmar Email</CardTitle>
          <CardDescription>
            Confirme o email de um usuário manualmente (desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmed ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm text-gray-600">
                Email <strong>{email}</strong> confirmado com sucesso!
              </p>
              <Button
                onClick={() => {
                  setConfirmed(false)
                  setEmail("")
                }}
                variant="outline"
                className="w-full"
              >
                Confirmar outro email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email do usuário</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleConfirm()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleConfirm}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar Email"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



