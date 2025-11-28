"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Ticket } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada"
    // Parse a data no formato YYYY-MM-DD como data local (não UTC)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    return timeString.substring(0, 5)
  }

  const handleDownloadPDF = async (inscricao: any) => {
    try {
      const response = await fetch('/api/ingresso/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: inscricao.id }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar ingresso')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ingresso-${inscricao.registration_number || inscricao.id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Ingresso baixado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar ingresso:', error)
      toast.error('Erro ao gerar ingresso')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      confirmed: { label: "Confirmada", variant: "default" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    )
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
        <div className="grid gap-4">
          {inscricoes.map((inscricao) => {
            const event = inscricao.event
            const ticket = inscricao.ticket

            return (
              <Card key={inscricao.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-2">
                        {event?.name || "Evento não encontrado"}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 items-center">
                        {getStatusBadge(inscricao.status || "pending")}
                        {event?.category && (
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Banner pequeno no canto */}
                  {event?.banner_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={event.banner_url}
                        alt={event.name || "Evento"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                      </div>
                    </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
                          <div>
                          <p className="text-xs text-gray-500 mb-0.5">Data</p>
                          <p className="text-sm font-medium">
                              {formatDate(event?.event_date)}
                            </p>
                        </div>

                        {event?.start_time && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Horário</p>
                            <p className="text-sm font-medium">
                              {formatTime(event.start_time)}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Local</p>
                          <p className="text-sm font-medium truncate">
                            {event?.location || event?.address || "Não informado"}
                          </p>
                        </div>

                        {ticket && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Distância</p>
                            <p className="text-sm font-medium">{ticket.category}</p>
                          </div>
                        )}

                        {inscricao.shirt_size && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Camiseta</p>
                            <p className="text-sm font-medium">{inscricao.shirt_size}</p>
                          </div>
                        )}

                        {inscricao.has_kit !== undefined && (
                            <div>
                            <p className="text-xs text-gray-500 mb-0.5">Kit</p>
                            <p className="text-sm font-medium">{inscricao.has_kit ? "Sim" : "Não"}</p>
                            </div>
                        )}

                        {inscricao.has_insurance !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Seguro</p>
                            <p className="text-sm font-medium">{inscricao.has_insurance ? "Sim" : "Não"}</p>
                          </div>
                        )}

                        {inscricao.athletes && Array.isArray(inscricao.athletes) && inscricao.athletes.length > 0 && (
                            <div>
                            <p className="text-xs text-gray-500 mb-0.5">Participante</p>
                            <p className="text-sm font-medium truncate">
                                {inscricao.athletes[0].full_name || inscricao.athletes[0].email}
                              </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t">
                        {event?.slug && (
                          <Button variant="outline" asChild className="flex-1">
                            <Link href={`/evento/${event.slug}`}>
                              Ver Evento
                            </Link>
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => handleDownloadPDF(inscricao)}
                          className="flex-1"
                        >
                          Baixar Ingresso
                        </Button>
                      </div>
                    </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
