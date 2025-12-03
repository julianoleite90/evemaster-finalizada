"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, X, Send, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface RegistrationHeaderProps {
  registration: {
    atleta?: { nome: string; email?: string }
    numeroInscricao: string
    dataInscricao: string
    statusPagamento: string
  }
  formatDate: (date: string, includeTime?: boolean) => string
  onTransfer: () => void
  onCancel: () => void
  onResendEmail: () => void
  resendingEmail: boolean
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    paid: { label: "Pago", className: "bg-green-100 text-green-700 border-green-200" },
    confirmed: { label: "Confirmado", className: "bg-green-100 text-green-700 border-green-200" },
    pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 border-red-200" },
    refunded: { label: "Reembolsado", className: "bg-gray-100 text-gray-700 border-gray-200" },
    pending_refund: { label: "Reembolso Pendente", className: "bg-orange-100 text-orange-700 border-orange-200" },
  }
  
  const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  return <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>{config.label}</Badge>
}

export function RegistrationHeader({
  registration,
  formatDate,
  onTransfer,
  onCancel,
  onResendEmail,
  resendingEmail,
}: RegistrationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/organizer/registrations">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {registration.atleta?.nome || "Inscrição"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500 font-mono">{registration.numeroInscricao}</p>
            <span className="text-gray-300">•</span>
            <p className="text-sm text-gray-500">{formatDate(registration.dataInscricao, true)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {getStatusBadge(registration.statusPagamento)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onResendEmail} disabled={resendingEmail || !registration?.atleta?.email}>
              {resendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Reenviar Confirmação
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onTransfer}>
              <Edit className="mr-2 h-4 w-4" />
              Transferir Inscrição
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCancel} className="text-red-600 focus:text-red-600">
              <X className="mr-2 h-4 w-4" />
              Cancelar e Reembolsar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

