"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Ticket, Calendar, MapPin, Clock, User, Download, Wallet } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TicketCardProps {
  inscricao: any
  onDownloadPDF?: () => void
  onAddToWallet?: (walletType: 'apple' | 'google') => void
}

export function TicketCard({ inscricao, onDownloadPDF, onAddToWallet }: TicketCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const event = inscricao.event
  const ticket = inscricao.ticket

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
        className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-[#156634] group"
        onClick={() => setIsOpen(true)}
      >
        {/* Linha tracejada de destaque (estilo passagem aérea) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300 group-hover:border-[#156634] transition-colors z-10"></div>
        
        <div className="flex">
          {/* Lado esquerdo - Dados principais */}
          <div className="flex-1 p-6 pr-3 relative">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {event?.name || "Evento não encontrado"}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusBadge(inscricao.status || "pending")}
                    {event?.category && (
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-[#156634]" />
                  <span className="font-medium">{formatDate(event?.event_date)}</span>
                </div>
                {event?.start_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-[#156634]" />
                    <span>{formatTime(event.start_time)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-[#156634]" />
                  <span className="truncate">{event?.location || event?.address || "Local não informado"}</span>
                </div>
                {ticket && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Ticket className="h-4 w-4 text-[#156634]" />
                    <span>{ticket.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divisor tracejado vertical */}
          <div className="w-0.5 border-l-2 border-dashed border-gray-300 my-4"></div>

          {/* Lado direito - Código e ações */}
          <div className="w-48 p-6 pl-3 flex flex-col justify-between relative">
            <div>
              <div className="text-xs text-gray-500 mb-1">Código do Ingresso</div>
              <div className="font-mono text-lg font-bold text-[#156634] mb-4">
                {inscricao.registration_number || inscricao.id.substring(0, 8).toUpperCase()}
              </div>
              
              {inscricao.athletes && Array.isArray(inscricao.athletes) && inscricao.athletes.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Participante</div>
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <User className="h-3 w-3" />
                    <span className="truncate">{inscricao.athletes[0].full_name || inscricao.athletes[0].email}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Imagem do evento pequena no lugar do QR code */}
            {event?.banner_url && (
              <div className="mt-auto pt-4 flex items-center justify-end">
                <div className="relative w-16 h-16 rounded overflow-hidden border border-gray-200">
                  <Image
                    src={event.banner_url}
                    alt={event.name || "Evento"}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{event?.name || "Detalhes do Ingresso"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Banner do evento */}
            {event?.banner_url && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={event.banner_url}
                  alt={event.name || "Evento"}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Informações do Evento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="font-mono text-2xl font-bold text-[#156634] mb-2">
                {inscricao.registration_number || inscricao.id.substring(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 text-center">
                Apresente este código na retirada do kit
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {onDownloadPDF && (
                <Button onClick={onDownloadPDF} variant="outline" className="flex-1 min-w-[150px]">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              )}
              {onAddToWallet && (
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={() => onAddToWallet('apple')} className="w-full bg-[#156634] hover:bg-[#1a7a3e]">
                    <Wallet className="h-4 w-4 mr-2" />
                    Adicionar à Apple Wallet
                  </Button>
                  <Button onClick={() => onAddToWallet('google')} variant="outline" className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Adicionar ao Google Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

