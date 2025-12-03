"use client"

import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  MapPin, 
  Tag,
  User,
  Mail,
  Phone,
  CreditCard,
  Shirt,
  Package,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from "lucide-react"

interface QuickStatsProps {
  registration: {
    evento: {
      nome: string
      data: string
      local: string
      categoria: string
    }
    atleta?: {
      nome: string
      email: string
      telefone?: string
      tamanhoCamiseta?: string
      possuiKit?: boolean
      possuiSeguro?: boolean
    }
    financeiro?: {
      total: number
      metodoPagamento: string
    }
    statusPagamento: string
  }
  formatDate: (date: string) => string
  formatCurrency: (value: number) => string
}

export function QuickStats({ registration, formatDate, formatCurrency }: QuickStatsProps) {
  const statusConfig = {
    paid: { label: "Pago", icon: CheckCircle, className: "bg-green-100 text-green-700 pointer-events-none" },
    pending: { label: "Pendente", icon: Clock, className: "bg-yellow-100 text-yellow-700 pointer-events-none" },
    cancelled: { label: "Cancelado", icon: XCircle, className: "bg-red-100 text-red-700 pointer-events-none" },
    refunded: { label: "Reembolsado", icon: RefreshCw, className: "bg-blue-100 text-blue-700 pointer-events-none" },
  }
  
  const status = statusConfig[registration.statusPagamento as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Evento */}
      <div className="bg-white rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">Evento</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate" title={registration.evento.nome}>
            {registration.evento.nome}
          </p>
          <p className="text-xs text-gray-500">{formatDate(registration.evento.data)}</p>
        </div>
      </div>

      {/* Categoria */}
      <div className="bg-white rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2 text-gray-500">
          <Tag className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">Categoria</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {registration.evento.categoria}
        </Badge>
      </div>

      {/* Valor */}
      <div className="bg-white rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2 text-gray-500">
          <CreditCard className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">Valor</span>
        </div>
        <div>
          <p className="text-lg font-bold text-[#156634]">
            {formatCurrency(registration.financeiro?.total || 0)}
          </p>
          <p className="text-xs text-gray-500">{registration.financeiro?.metodoPagamento || "N/A"}</p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2 text-gray-500">
          <StatusIcon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">Status</span>
        </div>
        <Badge className={`${status.className} text-xs gap-1`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </div>
    </div>
  )
}
