"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Ticket, Calendar, MapPin, Clock, User, Download, Star, CheckCircle } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ReviewModal } from "@/components/reviews/ReviewModal"
import { StarRating } from "@/components/reviews/StarRating"

interface TicketCardProps {
  inscricao: any
  onDownloadPDF?: () => void
  userId?: string
}

export function TicketCard({ inscricao, onDownloadPDF, userId }: TicketCardProps) {
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

      {/* Modal de Detalhes - Compacto */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          {/* Header com Banner */}
          <div className="relative h-24 bg-gradient-to-r from-[#156634] to-emerald-600">
            {event?.banner_url && (
              <Image
                src={event.banner_url}
                alt={event.name || "Evento"}
                fill
                className="object-cover opacity-30"
              />
            )}
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <h2 className="text-white font-bold text-lg leading-tight line-clamp-2">
                {event?.name || "Evento"}
              </h2>
              <div className="flex items-center gap-3 text-white/80 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(event?.event_date).split(',')[1]?.trim() || formatDate(event?.event_date)}
                </span>
                {event?.start_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(event.start_time)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-4 space-y-4">
            {/* Info Principal */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Inscrição</div>
                <div className="font-mono font-bold text-2xl text-[#156634]">
                  {inscricao.registration_number || inscricao.id.substring(0, 8).toUpperCase()}
                </div>
              </div>
              {getStatusBadge(inscricao.status || "pending")}
            </div>

            {/* Grid de Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {inscricao.athletes && Array.isArray(inscricao.athletes) && inscricao.athletes.length > 0 && (
                <div className="col-span-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium truncate">{inscricao.athletes[0].full_name || inscricao.athletes[0].email}</span>
                </div>
              )}
              {ticket && (
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Categoria</div>
                  <div className="font-medium">{ticket.category}</div>
                </div>
              )}
              {inscricao.shirt_size && (
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Camiseta</div>
                  <div className="font-medium">{inscricao.shirt_size}</div>
                </div>
              )}
              {(event?.location || event?.address) && (
                <div className="col-span-2 p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Local
                  </div>
                  <div className="font-medium truncate">{event?.location || event?.address}</div>
                </div>
              )}
            </div>

            {/* Avaliação */}
            {organizer && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {hasReviewed ? 'Avaliação enviada' : 'Avaliar organizador'}
                  </span>
                </div>
                {hasReviewed ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {userReview && <StarRating rating={userReview.rating} size="sm" />}
                  </div>
                ) : (
                  <Button
                    onClick={(e) => { e.stopPropagation(); setReviewModalOpen(true) }}
                    size="sm"
                    variant="ghost"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 h-7 px-2"
                  >
                    Avaliar
                  </Button>
                )}
              </div>
            )}

            {/* Botão Download */}
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#156634] hover:bg-[#1a7a3e] text-white font-medium rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
                Baixar Ingresso
              </button>
            )}
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

