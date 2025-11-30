"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Ticket, Calendar, MapPin, Clock, User, Download, Wallet, Star, CheckCircle } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ReviewModal } from "@/components/reviews/ReviewModal"
import { StarRating } from "@/components/reviews/StarRating"

interface TicketCardProps {
  inscricao: any
  onDownloadPDF?: () => void
  onAddToWallet?: (walletType: 'apple' | 'google') => void
  userId?: string
}

export function TicketCard({ inscricao, onDownloadPDF, onAddToWallet, userId }: TicketCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [userReview, setUserReview] = useState<any>(null)
  const event = inscricao.event
  const ticket = inscricao.ticket
  const organizer = event?.organizer
  
  // Verificar se o usuário já avaliou este organizador para este evento
  useEffect(() => {
    const checkUserReview = async () => {
      if (!userId || !organizer?.id || !event?.id) return
      
      try {
        const response = await fetch(
          `/api/reviews?userId=${userId}&organizerId=${organizer.id}&eventId=${event.id}`
        )
        const data = await response.json()
        
        if (data.reviews && data.reviews.length > 0) {
          setHasReviewed(true)
          setUserReview(data.reviews[0])
        }
      } catch (error) {
        console.error("Erro ao verificar avaliação:", error)
      }
    }
    
    checkUserReview()
  }, [userId, organizer?.id, event?.id])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não informada"
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    return timeString.substring(0, 5)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      confirmed: { label: "Confirmada", className: "bg-green-100 text-green-800 border-green-300" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800 border-red-300" },
    }
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800 border-gray-300" }
    return (
      <Badge className={`${statusInfo.className} border`}>{statusInfo.label}</Badge>
    )
  }

  return (
    <>
      <Card 
        className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#156634] group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Imagem do evento pequena */}
          {event?.banner_url && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={event.banner_url}
                alt={event.name || "Evento"}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 flex-1">
                {event?.name || "Evento não encontrado"}
              </h3>
              {getStatusBadge(inscricao.status || "pending")}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#156634]" />
                <span className="text-xs">{formatDate(event?.event_date)}</span>
              </div>
              {event?.start_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#156634]" />
                  <span className="text-xs">{formatTime(event.start_time)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-[#156634] flex-shrink-0" />
                <span className="text-xs truncate">{event?.location || event?.address || "Local não informado"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {ticket && (
                  <div className="flex items-center gap-1">
                    <Ticket className="h-3 w-3 text-[#156634]" />
                    <span>{ticket.category}</span>
                  </div>
                )}
                {inscricao.athletes && Array.isArray(inscricao.athletes) && inscricao.athletes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="truncate max-w-[150px]">{inscricao.athletes[0].full_name || inscricao.athletes[0].email}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-0.5">Código</div>
                <div className="font-mono text-sm font-bold text-[#156634]">
                  {inscricao.registration_number || inscricao.id.substring(0, 8).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{event?.name || "Detalhes do Ingresso"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {/* Banner do evento - menor */}
            {event?.banner_url && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <Image
                  src={event.banner_url}
                  alt={event.name || "Evento"}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Informações do Evento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">Informações do Evento</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Data</div>
                    <div className="font-medium">{formatDate(event?.event_date)}</div>
                  </div>
                  {event?.start_time && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Horário</div>
                      <div className="font-medium">{formatTime(event.start_time)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Local</div>
                    <div className="font-medium">{event?.location || event?.address || "Não informado"}</div>
                  </div>
                  {event?.description && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Descrição</div>
                      <div className="text-sm text-gray-700">{event.description.replace(/<[^>]*>/g, '').substring(0, 200)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">Informações da Inscrição</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Número da Inscrição</div>
                    <div className="font-mono font-bold text-lg text-[#156634]">
                      {inscricao.registration_number || inscricao.id.substring(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div>{getStatusBadge(inscricao.status || "pending")}</div>
                  </div>
                  {ticket && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Categoria</div>
                      <div className="font-medium">{ticket.category}</div>
                    </div>
                  )}
                  {inscricao.shirt_size && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tamanho da Camiseta</div>
                      <div className="font-medium">{inscricao.shirt_size}</div>
                    </div>
                  )}
                  {inscricao.athletes && Array.isArray(inscricao.athletes) && inscricao.athletes.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Participante</div>
                      <div className="font-medium">{inscricao.athletes[0].full_name || inscricao.athletes[0].email}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Data da Inscrição</div>
                    <div className="font-medium">
                      {new Date(inscricao.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code - menor */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="font-mono text-xl font-bold text-[#156634] mb-1">
                {inscricao.registration_number || inscricao.id.substring(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 text-center">
                Apresente este código na retirada do kit
              </div>
            </div>

            {/* Avaliação do Organizador */}
            {organizer && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      Avaliar Organizador
                    </h4>
                    <p className="text-sm text-gray-600">
                      {organizer.company_name || "Organizador"}
                    </p>
                  </div>
                  
                  {hasReviewed ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Avaliado
                      </div>
                      {userReview && (
                        <StarRating rating={userReview.rating} size="sm" />
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReviewModalOpen(true)
                      }}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Avaliar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Ações - reorganizadas */}
            <div className="flex flex-col gap-2 pt-3 border-t">
              <div className="flex gap-2">
                {onDownloadPDF && (
                  <Button onClick={onDownloadPDF} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
                {onAddToWallet && (
                  <Button onClick={() => onAddToWallet('apple')} className="flex-1 bg-[#156634] hover:bg-[#1a7a3e]">
                    <Wallet className="h-4 w-4 mr-2" />
                    Apple Wallet
                  </Button>
                )}
              </div>
              {onAddToWallet && (
                <Button onClick={() => onAddToWallet('google')} variant="outline" className="w-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  Google Wallet
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Avaliação */}
      {organizer && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          organizerId={organizer.id}
          organizerName={organizer.company_name || "Organizador"}
          eventId={event?.id}
          eventName={event?.name}
          registrationId={inscricao.id}
          onSuccess={() => {
            setHasReviewed(true)
            // Recarregar para pegar a avaliação
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

