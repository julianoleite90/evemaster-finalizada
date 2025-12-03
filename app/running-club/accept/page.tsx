"use client"

import { logger } from "@/lib/utils/logger"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

function AcceptRunningClubPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [clubData, setClubData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!token) {
      setError("Token de convite não fornecido")
      setLoading(false)
      return
    }

    fetchClubData()
  }, [token])

  const fetchClubData = async () => {
    try {
      const res = await fetch(`/api/running-club/validate-token?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setClubData(data.club)
      } else {
        const error = await res.json()
        setError(error.error || "Convite inválido ou expirado")
      }
    } catch (error) {
      logger.error("Erro ao validar token:", error)
      setError("Erro ao validar convite")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome do clube é obrigatório")
      return
    }

    if (!formData.password) {
      toast.error("Senha é obrigatória")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      setAccepting(true)
      const res = await fetch("/api/running-club/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAccepted(true)
        toast.success("Convite aceito com sucesso!")
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push("/dashboard/running-club")
        }, 2000)
      } else {
        const error = await res.json()
        toast.error(error.error || "Erro ao aceitar convite")
      }
    } catch (error) {
      logger.error("Erro ao aceitar convite:", error)
      toast.error("Erro ao processar convite")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#156634] mx-auto mb-4" />
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Erro ao validar convite</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild className="w-full">
              <Link href="/">Voltar para a página inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <CardTitle>Convite aceito!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Seu clube foi configurado com sucesso. Você será redirecionado para o dashboard...
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/running-club">Ir para o Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clubData) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#156634]" />
            <CardTitle>Aceitar Convite - Clube de Corrida</CardTitle>
          </div>
          <CardDescription>
            Configure seu clube para começar a gerenciar participantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-gray-900">Evento:</p>
            <p className="text-sm text-gray-700">{clubData.event?.name || "N/A"}</p>
            <p className="text-sm font-semibold text-gray-900 mt-2">Ingressos alocados:</p>
            <p className="text-sm text-gray-700">{clubData.tickets_allocated}</p>
            <p className="text-sm font-semibold text-gray-900 mt-2">Desconto:</p>
            <p className="text-sm text-gray-700">{clubData.base_discount}%</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Clube *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Clube de Corrida São Paulo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Digite a senha novamente"
            />
          </div>

          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[#156634] hover:bg-[#1a7a3e]"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aceitando...
              </>
            ) : (
              "Aceitar Convite e Criar Conta"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptRunningClubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#156634] mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <AcceptRunningClubPageContent />
    </Suspense>
  )
}
