"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Globe, 
  ShoppingCart, 
  FileText, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  ArrowRightLeft,
  Mail,
  Clock
} from "lucide-react"

interface TimelineEvent {
  id: string
  type: 'landing_page' | 'checkout_start' | 'form_filled' | 'terms_accepted' | 'registration_completed' | 'registration_cancelled' | 'registration_transferred' | 'email_resent' | 'payment_pending'
  timestamp: string
  description?: string
}

interface TimelineCardProps {
  registration: {
    dataInscricao: string
    termo?: {
      aceito: boolean
      dataAceite?: string
      horarioAceite?: string
    }
    statusPagamento: string
  }
  formatDate: (date: string, includeTime?: boolean) => string
}

const timelineConfig = {
  landing_page: {
    icon: Globe,
    label: "Acessou a landing page",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  checkout_start: {
    icon: ShoppingCart,
    label: "Adicionou ingressos no checkout",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  form_filled: {
    icon: FileText,
    label: "Preencheu o formulário",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200"
  },
  terms_accepted: {
    icon: Shield,
    label: "Aceitou os termos de responsabilidade",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200"
  },
  registration_completed: {
    icon: CheckCircle2,
    label: "Inscrição realizada com sucesso",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  payment_pending: {
    icon: Clock,
    label: "Aguardando pagamento",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  registration_cancelled: {
    icon: XCircle,
    label: "Inscrição cancelada",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  registration_transferred: {
    icon: ArrowRightLeft,
    label: "Inscrição transferida",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  email_resent: {
    icon: Mail,
    label: "Confirmação reenviada via email",
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200"
  }
}

export function TimelineCard({ registration, formatDate }: TimelineCardProps) {
  // Construir eventos da timeline baseado nos dados disponíveis
  const events: TimelineEvent[] = []
  
  // Evento de inscrição
  if (registration.dataInscricao) {
    // Estimativa: 2 minutos antes da inscrição = checkout
    const checkoutDate = new Date(registration.dataInscricao)
    checkoutDate.setMinutes(checkoutDate.getMinutes() - 2)
    
    // Estimativa: 3 minutos antes = form preenchido
    const formDate = new Date(registration.dataInscricao)
    formDate.setMinutes(formDate.getMinutes() - 1)
    
    events.push({
      id: 'checkout',
      type: 'checkout_start',
      timestamp: checkoutDate.toISOString()
    })
    
    events.push({
      id: 'form',
      type: 'form_filled',
      timestamp: formDate.toISOString()
    })
  }
  
  // Evento de aceite dos termos
  if (registration.termo?.aceito && registration.termo.dataAceite) {
    const termoTimestamp = registration.termo.horarioAceite 
      ? `${registration.termo.dataAceite}T${registration.termo.horarioAceite}`
      : registration.termo.dataAceite
    
    events.push({
      id: 'terms',
      type: 'terms_accepted',
      timestamp: termoTimestamp
    })
  }
  
  // Evento de conclusão ou status atual
  if (registration.statusPagamento === 'paid') {
    events.push({
      id: 'completed',
      type: 'registration_completed',
      timestamp: registration.dataInscricao
    })
  } else if (registration.statusPagamento === 'pending') {
    events.push({
      id: 'pending',
      type: 'payment_pending',
      timestamp: registration.dataInscricao
    })
  } else if (registration.statusPagamento === 'cancelled' || registration.statusPagamento === 'refunded') {
    events.push({
      id: 'cancelled',
      type: 'registration_cancelled',
      timestamp: registration.dataInscricao
    })
  }
  
  // Ordenar eventos por timestamp (mais recente primeiro)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          Linha do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative">
          {/* Linha vertical conectando os eventos */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gray-200" />
          
          <div className="space-y-4">
            {events.map((event, index) => {
              const config = timelineConfig[event.type]
              const Icon = config.icon
              
              return (
                <div key={event.id} className="relative flex items-start gap-3">
                  {/* Ícone do evento */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(event.timestamp, true)}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {events.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum evento registrado
          </p>
        )}
      </CardContent>
    </Card>
  )
}

