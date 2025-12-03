"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle, Clock, XCircle } from "lucide-react"

interface Registration {
  id: string
  numeroInscricao: string
  nome: string
  email: string
  evento: string
  categoria: string
  dataInscricao: string
  statusPagamento: "paid" | "pending" | "cancelled"
  valor: number
  cupomCodigo?: string
  cupomDesconto?: number
  clubeNome?: string
}

interface RegistrationRowProps {
  registration: Registration
  formatDate: (date: string, includeTime?: boolean) => string
  formatCurrency: (value: number) => string
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] gap-4 pr-1">
          Pago <CheckCircle className="h-3 w-3" />
        </Badge>
      )
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px] gap-4 pr-1">
          Pendente <Clock className="h-3 w-3" />
        </Badge>
      )
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] gap-4 pr-1">
          Cancelado <XCircle className="h-3 w-3" />
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>
  }
}

export function RegistrationRow({ registration, formatDate, formatCurrency }: RegistrationRowProps) {
  return (
    <Link
      href={`/dashboard/organizer/registrations/${registration.id}`}
      className="block hover:bg-gray-50/50 transition-colors"
    >
      <div className="px-4 py-3">
        {/* Desktop: Layout em grid */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,240px)_minmax(0,350px)_minmax(0,140px)_minmax(0,100px)_minmax(0,100px)_minmax(0,120px)] gap-6 items-center">
          {/* Nome, Email e ID */}
          <div className="min-w-0 overflow-hidden select-text">
            <p className="text-sm font-medium text-gray-900 truncate" title={registration.nome}>
              {registration.nome}
            </p>
            <p className="text-xs text-gray-600 truncate mt-0.5" title={registration.email}>
              {registration.email}
            </p>
            <p className="font-mono text-[10px] text-gray-400 truncate mt-0.5" title={registration.numeroInscricao}>
              {registration.numeroInscricao}
            </p>
          </div>

          {/* Evento */}
          <div className="min-w-0 overflow-hidden select-text">
            <p className="text-sm text-gray-700 truncate" title={registration.evento}>
              {registration.evento}
            </p>
          </div>

          {/* Data/Hora */}
          <div className="select-text">
            <p className="text-sm text-gray-600" title={formatDate(registration.dataInscricao, true)}>
              {formatDate(registration.dataInscricao, true)}
            </p>
          </div>

          {/* Categoria */}
          <div>
            <Badge variant="outline" className="text-xs select-text">
              {registration.categoria}
            </Badge>
          </div>

          {/* Valor */}
          <div className="select-text">
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(Number(registration.valor) || 0)}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex flex-col gap-1 flex-1">
              {getStatusBadge(registration.statusPagamento)}
              <div className="flex flex-wrap gap-1">
                {registration.cupomCodigo && (
                  <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    {registration.cupomCodigo}
                    {registration.cupomDesconto && ` (-${registration.cupomDesconto}%)`}
                  </span>
                )}
                {registration.clubeNome && (
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={registration.clubeNome}>
                    {registration.clubeNome}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        {/* Mobile: Layout em stack */}
        <div className="md:hidden space-y-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{registration.nome}</p>
              <p className="text-xs text-gray-500 truncate">{registration.email}</p>
              <p className="font-mono text-[10px] text-gray-400 truncate">{registration.numeroInscricao}</p>
            </div>
            {getStatusBadge(registration.statusPagamento)}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{registration.evento}</span>
            <span>{registration.categoria}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatDate(registration.dataInscricao, true)}</span>
            <span className="text-sm font-medium">{formatCurrency(Number(registration.valor) || 0)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
