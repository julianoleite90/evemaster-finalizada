"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Ticket } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"
import { TicketCard } from "@/components/tickets/TicketCard"

export default function MyAccountPage() {
  const [loading, setLoading] = useState(true)
  const [inscricoes, setInscricoes] = useState<any[]>([])

  useEffect(() => {
    const fetchInscricoes = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Você precisa estar logado")
          return
        }

        console.log("🔍 [MyAccount] Buscando inscrições para usuário:", {
          userId: user.id,
          email: user.email,
        })

        // Buscar inscrições de múltiplas formas:
        // 1. Por user_id, athlete_id ou buyer_id (mais direto)
        // 2. Através dos atletas com o mesmo email (case-insensitive)

        let directRegistrations: any[] = []
        let athleteRegistrations: any[] = []

        // 1. Buscar inscrições por athlete_id ou buyer_id (RLS permite apenas esses)
        // A política RLS permite ver registrations se athlete_id = auth.uid() OR buyer_id = auth.uid()
        try {
          const { data, error } = await supabase
            .from("registrations")
            .select(`
              *,
              event:events(
                id,
                name,
                slug,
                event_date,
                start_time,
                location,
                address,
                banner_url,
                category
              ),
              ticket:tickets(
                id,
                category,
                price,
                is_free
              ),
              athletes(full_name, email)
            `)
            .or(`athlete_id.eq.${user.id},buyer_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
          
          if (!error && data) {
            directRegistrations = data || []
            console.log("✅ [MyAccount] Inscrições encontradas por athlete_id/buyer_id:", directRegistrations.length)
            console.log("📋 [MyAccount] Dados das inscrições:", directRegistrations.map(r => ({
              id: r.id,
              athlete_id: r.athlete_id,
              buyer_id: r.buyer_id,
              user_id: r.user_id,
              event: r.event?.name,
              ticket: r.ticket?.category
            })))
          } else if (error) {
            console.error("❌ [MyAccount] Erro ao buscar inscrições:", error)
            console.error("❌ [MyAccount] Detalhes do erro:", JSON.stringify(error, null, 2))
          }
        } catch (err: any) {
          console.error("❌ [MyAccount] Erro ao buscar inscrições:", err.message)
        }

        // 2. Buscar através dos atletas com o mesmo email (case-insensitive)
        if (user.email) {
          // Buscar atletas com email igual (case-insensitive)
          // Usar try/catch para não quebrar se houver erro de RLS ou permissão
          try {
            const { data: athletes, error: athletesError } = await supabase
              .from("athletes")
              .select("id, registration_id, full_name, email")
              .ilike("email", user.email) // Case-insensitive

            if (athletesError) {
              console.error("❌ [MyAccount] Erro ao buscar atletas:", athletesError)
              // Não bloquear o fluxo, apenas logar o erro
            } else {
              console.log("✅ [MyAccount] Atletas encontrados:", athletes?.length || 0)
            }

            if (athletes && athletes.length > 0) {
              const registrationIds = athletes
                .map(a => a.registration_id)
                .filter(id => id !== null) as string[]

              console.log("🔍 [MyAccount] IDs de registrations dos atletas:", registrationIds.length)

              if (registrationIds.length > 0) {
                const { data: regs, error: regError } = await supabase
                  .from("registrations")
                  .select(`
                    *,
                    event:events(
                      id,
                      name,
                      slug,
                      event_date,
                      start_time,
                      location,
                      address,
                      banner_url,
                      category
                    ),
                    ticket:tickets(
                      id,
                      category,
                      price,
                      is_free
                    ),
                    athletes(full_name, email)
                  `)
                  .in("id", registrationIds)
                  .order("created_at", { ascending: false })

                if (!regError && regs) {
                  athleteRegistrations = regs || []
                  console.log("✅ [MyAccount] Inscrições encontradas por email do atleta:", athleteRegistrations.length)
                } else if (regError) {
                  console.error("❌ [MyAccount] Erro ao buscar registrations dos atletas:", regError)
                }
              }
            }
          } catch (athleteErr: any) {
            console.error("❌ [MyAccount] Erro ao processar busca de atletas:", athleteErr)
            // Continuar o fluxo mesmo com erro
          }
        }

        // Combinar todas as inscrições encontradas
        const combined = [
          ...directRegistrations,
          ...athleteRegistrations,
        ]

        // Remover duplicatas baseado no ID da registration
        const uniqueRegistrations = combined.filter(
          (reg, index, self) =>
            index === self.findIndex((r) => r.id === reg.id)
        )

        console.log("📊 [MyAccount] Total de inscrições únicas encontradas:", uniqueRegistrations.length)
        console.log("📋 [MyAccount] IDs das inscrições:", uniqueRegistrations.map(r => r.id))

        setInscricoes(uniqueRegistrations)
      } catch (error) {
        console.error("❌ [MyAccount] Erro ao buscar inscrições:", error)
        toast.error("Erro ao carregar inscrições")
      } finally {
        setLoading(false)
      }
    }

    fetchInscricoes()
  }, [])

  const handleDownloadPDF = async (inscricao: any) => {
    try {
      toast.loading('Gerando PDF...', { id: 'pdf-loading' })
      
      const response = await fetch('/api/tickets/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: inscricao.id }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar ingresso')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ingresso-${inscricao.registration_number || inscricao.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Ingresso baixado com sucesso!', { id: 'pdf-loading' })
    } catch (error: any) {
      console.error('Erro ao gerar ingresso:', error)
      toast.error(error.message || 'Erro ao gerar ingresso', { id: 'pdf-loading' })
    }
  }

  const handleAddToWallet = async (inscricao: any, walletType: 'apple' | 'google' = 'apple') => {
    try {
      const response = await fetch('/api/tickets/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: inscricao.id, walletType }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao gerar ingresso para carteira')
      }

      if (walletType === 'apple') {
        // Para Apple Wallet, tentar baixar o arquivo .pkpass
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/vnd.apple.pkpass')) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `ingresso-${inscricao.registration_number || inscricao.id}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success('Ingresso baixado! Abra o arquivo para adicionar à Apple Wallet.')
        } else {
          // Se não retornar .pkpass, mostrar instruções
          const data = await response.json()
          toast.info('Para adicionar à Apple Wallet, é necessário configurar o certificado Apple Developer')
        }
      } else if (walletType === 'google') {
        // Para Google Wallet, pode retornar um link ou dados
        const data = await response.json()
        if (data.saveUrl) {
          // Abrir link do Google Wallet
          window.open(data.saveUrl, '_blank')
          toast.success('Redirecionando para Google Wallet...')
        } else {
          toast.info('Integração com Google Wallet em desenvolvimento')
        }
      }
    } catch (error: any) {
      console.error('Erro ao adicionar à carteira:', error)
      toast.error(error.message || 'Erro ao adicionar à carteira')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Inscrições</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie e acompanhe todas as suas inscrições em eventos
        </p>
      </div>

      {inscricoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma inscrição encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Você ainda não se inscreveu em nenhum evento.
            </p>
            <Button asChild>
              <Link href="/">Explorar Eventos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {inscricoes.map((inscricao) => (
            <TicketCard
              key={inscricao.id}
              inscricao={inscricao}
              onDownloadPDF={() => handleDownloadPDF(inscricao)}
              onAddToWallet={(walletType) => handleAddToWallet(inscricao, walletType)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
