"use client"

import { logger } from "@/lib/utils/logger"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle, XCircle, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

export default function AcceptAffiliateInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading")

  useEffect(() => {
    if (!token) {
      setError("Token de convite não fornecido")
      setStatus("error")
      setLoading(false)
      return
    }

    fetchInvite()
  }, [token])

  const fetchInvite = async () => {
    try {
      const supabase = createClient()
      
      const { data: inviteData, error: inviteError } = await supabase
        .from("event_affiliate_invites")
        .select(`
          *,
          event:events(
            id,
            name,
            event_date
          )
        `)
        .eq("token", token)
        .single()

      if (inviteError || !inviteData) {
        setError("Convite não encontrado")
        setStatus("error")
        setLoading(false)
        return
      }

      // Verificar se expirou
      if (new Date(inviteData.expires_at) < new Date()) {
        setError("Este convite expirou")
        setStatus("expired")
        setLoading(false)
        return
      }

      // Verificar se já foi aceito
      if (inviteData.status === "accepted") {
        setError("Este convite já foi aceito")
        setStatus("error")
        setLoading(false)
        return
      }

      setInvite(inviteData)
      setLoading(false)
    } catch (err: any) {
      logger.error("Erro ao buscar convite:", err)
      setError("Erro ao carregar convite")
      setStatus("error")
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!token || !invite) return

    try {
      setProcessing(true)
      const supabase = createClient()

      // Verificar se o usuário está logado
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Se não estiver logado, redirecionar para registro com o token
        router.push(`/register?affiliate_token=${token}`)
        return
      }

      // Verificar se o email do usuário corresponde ao email do convite
      if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        toast.error("Este convite foi enviado para outro email")
        setProcessing(false)
        return
      }

      // Verificar se o usuário já tem perfil de afiliado
      let affiliateId: string | null = null
      const { data: existingAffiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingAffiliate) {
        affiliateId = existingAffiliate.id
      } else {
        // Criar perfil de afiliado
        const referralCode = `AFF-${user.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
        
        const { data: newAffiliate, error: affiliateError } = await supabase
          .from("affiliates")
          .insert({
            user_id: user.id,
            referral_code: referralCode,
          })
          .select("id")
          .single()

        if (affiliateError) {
          logger.error("Erro ao criar perfil de afiliado:", affiliateError)
          toast.error("Erro ao criar perfil de afiliado")
          setProcessing(false)
          return
        }

        affiliateId = newAffiliate.id

        // Atualizar role do usuário
        await supabase
          .from("users")
          .update({ role: "AFILIADO" })
          .eq("id", user.id)
      }

      // Atualizar convite
      const { error: updateError } = await supabase
        .from("event_affiliate_invites")
        .update({
          status: "accepted",
          affiliate_id: affiliateId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id)

      if (updateError) {
        logger.error("Erro ao atualizar convite:", updateError)
        toast.error("Erro ao aceitar convite")
        setProcessing(false)
        return
      }

      // Criar comissão do evento
      const { error: commissionError } = await supabase
        .from("event_affiliate_commissions")
        .insert({
          event_id: invite.event_id,
          affiliate_id: affiliateId,
          commission_type: invite.commission_type,
          commission_value: invite.commission_value,
        })
        .select()
        .single()

      if (commissionError) {
        // Se já existe, apenas atualizar
        await supabase
          .from("event_affiliate_commissions")
          .update({
            commission_type: invite.commission_type,
            commission_value: invite.commission_value,
          })
          .eq("event_id", invite.event_id)
          .eq("affiliate_id", affiliateId)
      }

      toast.success("Convite aceito com sucesso!")
      setStatus("success")
      
      // Redirecionar para dashboard de afiliado após 2 segundos
      setTimeout(() => {
        router.push("/dashboard/affiliate")
      }, 2000)
    } catch (err: any) {
      logger.error("Erro ao aceitar convite:", err)
      toast.error("Erro ao aceitar convite")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  if (status === "error" || status === "expired") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              {status === "expired" ? "Convite Expirado" : "Erro"}
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Convite Aceito!
            </CardTitle>
            <CardDescription>
              Você agora é um afiliado deste evento. Redirecionando...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#156634]" />
            Convite de Afiliação
          </CardTitle>
          <CardDescription>
            Você foi convidado para ser afiliado de um evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Evento:</p>
                <p className="text-lg font-semibold">{invite.event?.name || "Evento"}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Email:</p>
                <p className="text-sm text-gray-600">{invite.email}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Comissão:</p>
                <p className="text-lg font-semibold text-[#156634]">
                  {invite.commission_type === "percentage" 
                    ? `${invite.commission_value}%` 
                    : `R$ ${invite.commission_value.toFixed(2)}`}
                </p>
              </div>

              <Separator />

              <Button
                className="w-full bg-[#156634] hover:bg-[#1a7a3e]"
                onClick={handleAccept}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Aceitar Convite"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

