"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Clock, 
  CheckCircle, 
  CreditCard,
  FileText,
  Calendar
} from "lucide-react"

interface TimelineCardProps {
  registration: {
    dataInscricao: string
    statusPagamento: string
    financeiro?: {
      dataPagamento?: string
    }
    termo?: {
      dataAceite?: string
      horarioAceite?: string
    }
  }
  formatDate: (date: string, includeTime?: boolean) => string
}

export function TimelineCard({ registration, formatDate }: TimelineCardProps) {
  const timelineItems = [
    {
      icon: FileText,
      label: "Inscrição criada",
      date: registration.dataInscricao,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    ...(registration.termo?.dataAceite ? [{
      icon: CheckCircle,
      label: "Termo aceito",
      date: registration.termo.dataAceite + (registration.termo.horarioAceite ? 'T' + registration.termo.horarioAceite : ''),
      color: "text-green-600",
      bgColor: "bg-green-50",
    }] : []),
    ...(registration.financeiro?.dataPagamento ? [{
      icon: CreditCard,
      label: registration.statusPagamento === "paid" ? "Pagamento confirmado" : "Pagamento processado",
      date: registration.financeiro.dataPagamento,
      color: "text-[#156634]",
      bgColor: "bg-green-50",
    }] : []),
  ].filter(Boolean)

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {timelineItems.map((item, index) => {
            const Icon = item.icon as React.ComponentType<{ className?: string }>
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={`${item.bgColor} rounded-full p-2 flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(item.date as string, true)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

