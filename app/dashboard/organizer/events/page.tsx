"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Eye, Settings, Plus, Search, Copy, QrCode, ChevronDown, Download } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { getOrganizerEvents } from "@/lib/supabase/events"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getOrganizerAccess } from "@/lib/supabase/organizer-access"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { getUserPermissions } from "@/lib/supabase/user-permissions"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Event {
  id: string
  slug?: string
  name: string
  description: string
  date: string
  location: string
  status: "draft" | "active" | "finished" | "cancelled"
  inscritos: number
  capacidade: number | null
  receita: number
  imagem?: string
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [eventos, setEventos] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { canViewEvents, canCreateEvents, canEditEvents, canDeleteEvents, isPrimary, loading: permissionsLoading } = useUserPermissions()
  const router = useRouter()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Buscar usuário atual
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast.error("Você precisa estar logado")
          return
        }

        // Verificar acesso (organizador principal OU membro de organização)
        const access = await getOrganizerAccess(supabase, user.id)
        
        if (!access) {
          console.error("❌ [EVENTS] Usuário não tem acesso ao dashboard do organizador")
          toast.error("Você não tem permissão para acessar este dashboard")
          setEventos([])
          setLoading(false)
          return
        }

        const organizerId = access.organizerId
        console.log("✅ [EVENTS] Acesso autorizado. Organizer ID:", organizerId)

        // Buscar eventos
        console.log("=== BUSCANDO EVENTOS ===")
        console.log("Organizer ID:", organizerId)
        const events = await getOrganizerEvents(organizerId)
        console.log("Eventos encontrados:", events?.length || 0)
        console.log("Eventos:", events)

        // Se não houver eventos, definir array vazio
        if (!events || events.length === 0) {
          setEventos([])
          setLoading(false)
          return
        }

        // Buscar todas as inscrições e pagamentos de uma vez
        const eventIds = events.map((e: any) => e.id)
        
        // Buscar lotes para recalcular capacidade
        const { data: allBatches } = await supabase
          .from("ticket_batches")
          .select("event_id, total_quantity")
          .in("event_id", eventIds)
        
        const { data: allRegistrations } = await supabase
          .from("registrations")
          .select("id, event_id")
          .in("event_id", eventIds)

        const registrationIds = allRegistrations?.map((r: any) => r.id) || []
        
        const { data: allPayments } = await supabase
          .from("payments")
          .select("amount, registration_id")
          .eq("payment_status", "paid")
          .in("registration_id", registrationIds)

        // Agrupar por evento
        const statsByEvent: Record<string, { inscritos: number; receita: number }> = {}
        
        // Contar inscrições por evento
        allRegistrations?.forEach((reg: any) => {
          if (!statsByEvent[reg.event_id]) {
            statsByEvent[reg.event_id] = { inscritos: 0, receita: 0 }
          }
          statsByEvent[reg.event_id].inscritos++
        })

        // Calcular receita por evento
        allPayments?.forEach((payment: any) => {
          const reg = allRegistrations?.find((r: any) => r.id === payment.registration_id)
          if (reg && statsByEvent[reg.event_id]) {
            statsByEvent[reg.event_id].receita += parseFloat(payment.amount) || 0
          }
        })

        // Recalcular capacidade baseada nos lotes
        const capacidadeByEvent: Record<string, number | null> = {}
        allBatches?.forEach((batch: any) => {
          if (!capacidadeByEvent[batch.event_id]) {
            capacidadeByEvent[batch.event_id] = 0
          }
          // Se algum lote for ilimitado (null), o evento é ilimitado
          if (batch.total_quantity === null) {
            capacidadeByEvent[batch.event_id] = null
          } else if (capacidadeByEvent[batch.event_id] !== null) {
            // Só soma se ainda não foi marcado como ilimitado
            capacidadeByEvent[batch.event_id] = (capacidadeByEvent[batch.event_id] || 0) + (batch.total_quantity || 0)
          }
        })
        
        // Se todos os lotes de um evento forem ilimitados, a capacidade calculada será null
        // Se algum lote tiver quantidade, será a soma
        // Se não houver lotes, verifica o total_capacity do evento

        // Converter para o formato esperado - filtrar eventos cancelados (soft delete)
        const eventosFormatados: Event[] = events
          .filter((event: any) => event.status !== "cancelled") // Não mostrar eventos deletados
          .map((event: any) => {
            const stats = statsByEvent[event.id] || { inscritos: 0, receita: 0 }
            
            // Usar capacidade calculada dos lotes, ou fallback para total_capacity do evento
            let capacidade = capacidadeByEvent[event.id]
            if (capacidade === undefined) {
              // Se não há lotes, usar total_capacity do evento
              capacidade = event.total_capacity && event.total_capacity > 0 
                ? event.total_capacity 
                : null
            } else if (capacidade === 0) {
              // Se a soma for 0, considerar ilimitado
              capacidade = null
            }
            
            return {
              id: event.id,
              slug: event.slug,
              name: event.name,
              description: event.description || "",
              date: event.event_date,
              location: event.location || event.address || "Local a definir",
              status: event.status as "draft" | "active" | "finished" | "cancelled",
              inscritos: stats.inscritos,
              capacidade: capacidade,
              receita: stats.receita,
              imagem: event.banner_url,
            }
          })

        setEventos(eventosFormatados)
      } catch (error: any) {
        console.error("Erro ao buscar eventos:", error)
        toast.error("Erro ao carregar eventos")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])


  const getStatusBadge = (status: Event["status"]) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Rascunho</Badge>
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
      case "finished":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Finalizado</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada"
    // Parse a data no formato YYYY-MM-DD como data local (não UTC)
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const filterEvents = (events: Event[]) => {
    if (!searchTerm) return events
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const eventosFiltrados = eventos.length > 0 ? filterEvents(eventos) : []
  const eventosRascunho = eventosFiltrados.filter((e) => e.status === "draft")
  const eventosAtivos = eventosFiltrados.filter((e) => e.status === "active")
  const eventosFinalizados = eventosFiltrados.filter((e) => e.status === "finished")
  const eventosCancelados = eventosFiltrados.filter((e) => e.status === "cancelled")

  // Função para remover tags HTML
  const stripHtml = (html: string) => {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
  }

  const EventCard = ({ event }: { event: Event }) => {
    const [showQRDialog, setShowQRDialog] = useState(false)
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
    
    const eventUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/evento/${event.slug || event.id}`
      : `/evento/${event.slug || event.id}`

    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(eventUrl)
        toast.success("Link copiado para a área de transferência!")
      } catch (error) {
        toast.error("Erro ao copiar link")
      }
    }

    const generateQRCode = async () => {
      try {
        // Gerar QR code via API route
        const response = await fetch(
          `/api/qrcode/generate?url=${encodeURIComponent(eventUrl)}&eventName=${encodeURIComponent(event.name)}`
        )

        if (!response.ok) {
          throw new Error("Erro ao gerar QR code")
        }

        const data = await response.json()
        const qrDataUrl = data.dataUrl

        // Criar canvas para adicionar logo
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setQrCodeDataUrl(qrDataUrl)
          return
        }

        // Carregar QR code como imagem usando HTMLImageElement nativo
        const qrImg = document.createElement("img") as HTMLImageElement
        qrImg.crossOrigin = "anonymous"
        
        qrImg.onload = () => {
          canvas.width = 400
          canvas.height = 400
          ctx.drawImage(qrImg, 0, 0)

          // Função para adicionar logo ou "E"
          const addLogo = (img: HTMLImageElement | null = null) => {
            // Reduzir tamanho do logo para 15% do QR code (antes era 20%)
            const logoSize = canvas.width * 0.15
            const padding = 8
            const x = (canvas.width - logoSize) / 2
            const y = (canvas.height - logoSize) / 2

            // Desenhar fundo branco para o logo
            ctx.fillStyle = "#FFFFFF"
            ctx.fillRect(x - padding, y - padding, logoSize + (padding * 2), logoSize + (padding * 2))

            if (img && img.complete && img.naturalWidth > 0) {
              // Calcular dimensões mantendo proporção
              const imgAspectRatio = img.naturalWidth / img.naturalHeight
              let drawWidth = logoSize
              let drawHeight = logoSize
              
              if (imgAspectRatio > 1) {
                // Imagem mais larga que alta
                drawHeight = logoSize / imgAspectRatio
              } else {
                // Imagem mais alta que larga
                drawWidth = logoSize * imgAspectRatio
              }
              
              // Centralizar o logo
              const drawX = x + (logoSize - drawWidth) / 2
              const drawY = y + (logoSize - drawHeight) / 2
              
              // Desenhar logo mantendo proporção
              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            } else {
              // Desenhar "E" estilizado
              ctx.fillStyle = "#156634"
              ctx.font = `bold ${logoSize * 0.6}px Arial`
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText("E", canvas.width / 2, canvas.height / 2)
            }

            const finalDataUrl = canvas.toDataURL("image/png")
            setQrCodeDataUrl(finalDataUrl)
          }

          // Tentar carregar logo usando HTMLImageElement nativo
          const logoImg = document.createElement("img") as HTMLImageElement
          logoImg.crossOrigin = "anonymous"
          
          logoImg.onload = () => {
            addLogo(logoImg)
          }

          logoImg.onerror = () => {
            addLogo(null)
          }

          logoImg.src = "/images/logo/logo.png"
        }

        qrImg.onerror = () => {
          // Se não conseguir carregar o QR code, usar o data URL direto
          setQrCodeDataUrl(qrDataUrl)
        }

        qrImg.src = qrDataUrl
      } catch (error: any) {
        console.error("Erro ao gerar QR code:", error)
        toast.error(`Erro ao gerar QR code: ${error?.message || "Erro desconhecido"}`)
      }
    }

    const handleShowQRCode = () => {
      setShowQRDialog(true)
      if (!qrCodeDataUrl) {
        generateQRCode()
      }
    }

    const handleDownloadQR = () => {
      if (!qrCodeDataUrl) return

      const link = document.createElement("a")
      link.download = `qrcode-${event.name.replace(/\s+/g, "-").toLowerCase()}.png`
      link.href = qrCodeDataUrl
      link.click()
      toast.success("QR code baixado com sucesso!")
    }

    return (
    <Card className="hover:shadow-lg transition-all duration-200 flex flex-col h-full border-2 hover:border-[#156634]/20 overflow-hidden">
      {/* Cabeçalho com Banner */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {event.imagem ? (
          <Image
            src={event.imagem}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#156634] to-[#1a7a3e]" />
        )}
        {/* Overlay escuro para melhor legibilidade */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Título com fundo branco e texto verde */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="text-xl font-bold leading-tight text-[#156634] pr-2">
                {event.name}
              </CardTitle>
              {getStatusBadge(event.status)}
            </div>
            {event.description && (
              <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {stripHtml(event.description)}
              </CardDescription>
            )}
          </div>
        </div>
      </div>
      <CardContent className="flex flex-col flex-1 pt-4">
        <div className="space-y-3 flex-1 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <Calendar className="h-4 w-4 flex-shrink-0 text-[#156634]" />
            <span className="font-medium">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <MapPin className="h-4 w-4 flex-shrink-0 text-[#156634]" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm py-1">
            <Users className="h-4 w-4 flex-shrink-0 text-[#156634]" />
            <span className="font-semibold text-foreground">
              {event.inscritos.toLocaleString("pt-BR")}
              {event.capacidade !== null && event.capacidade !== undefined ? (
                <span className="text-muted-foreground font-normal">
                  {" / "}{event.capacidade.toLocaleString("pt-BR")} inscritos
                </span>
              ) : (
                <span className="text-muted-foreground font-normal">
                  {" inscritos (ilimitado)"}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm py-1">
            <span className="text-muted-foreground">Receita:</span>
            <span className="font-semibold text-[#156634] text-base">
              {formatCurrency(event.receita)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-auto border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 hover:bg-[#156634]/5 hover:border-[#156634]/30 text-gray-900 hover:text-[#156634] gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Ver Página</span>
                <span className="sm:hidden">Ver</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link 
                  href={`/evento/${event.slug || event.id}`} 
                  target="_blank"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  Ver Página
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2 cursor-pointer">
                <Copy className="h-4 w-4" />
                Copiar Link da Página
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShowQRCode} className="flex items-center gap-2 cursor-pointer">
                <QrCode className="h-4 w-4" />
                Ver/Baixar QR Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(canEditEvents || isPrimary) && (
            <Button variant="outline" size="sm" asChild className="flex-1 hover:bg-[#156634]/5 hover:border-[#156634]/30 text-gray-900 hover:text-[#156634]">
              <Link href={`/dashboard/organizer/events/${event.id}/settings`} className="flex items-center justify-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
                <span className="sm:hidden">Config</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Dialog do QR Code */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code do Evento</DialogTitle>
              <DialogDescription>
                Escaneie este QR code para acessar a página do evento
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {qrCodeDataUrl ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code do Evento"
                      className="w-full max-w-[300px] h-auto"
                    />
                  </div>
                  <Button onClick={handleDownloadQR} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar QR Code
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#156634]"></div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    )
  }

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#156634] border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus eventos esportivos
          </p>
        </div>
        {!permissionsLoading && (canCreateEvents || isPrimary) && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/organizer/events/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar eventos por nome ou localização..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs por status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({eventosFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Rascunhos ({eventosRascunho.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({eventosAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="finished">
            Finalizados ({eventosFinalizados.length})
          </TabsTrigger>
        </TabsList>

        {/* Todos os Eventos */}
        <TabsContent value="all" className="space-y-4">
          {eventosFiltrados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosFiltrados.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Nenhum evento encontrado" : "Nenhum evento criado"}
                </p>
                {(canCreateEvents || isPrimary) && (
                  <Button asChild>
                    <Link href="/dashboard/organizer/events/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Evento
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Eventos Rascunho */}
        <TabsContent value="draft" className="space-y-4">
          {eventosRascunho.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosRascunho.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum rascunho encontrado" : "Nenhum rascunho"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Eventos Ativos */}
        <TabsContent value="active" className="space-y-4">
          {eventosAtivos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosAtivos.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum evento ativo encontrado" : "Nenhum evento ativo"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Eventos Finalizados */}
        <TabsContent value="finished" className="space-y-4">
          {eventosFinalizados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventosFinalizados.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum evento finalizado encontrado" : "Nenhum evento finalizado"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
