"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

interface FiltersCardProps {
  selectedEvent: string
  setSelectedEvent: (value: string) => void
  selectedStatus: string
  setSelectedStatus: (value: string) => void
  selectedClub: string
  setSelectedClub: (value: string) => void
  selectedCoupon: string
  setSelectedCoupon: (value: string) => void
  selectedAffiliate: string
  setSelectedAffiliate: (value: string) => void
  dateFrom: string
  setDateFrom: (value: string) => void
  dateTo: string
  setDateTo: (value: string) => void
  eventos: string[]
  clubesList: Array<{ id: string; name: string }>
  couponsList: Array<{ code: string }>
  affiliatesList: Array<{ id: string; name: string }>
  clearFilters: () => void
  hasActiveFilters: boolean
}

export function FiltersCard({
  selectedEvent,
  setSelectedEvent,
  selectedStatus,
  setSelectedStatus,
  selectedClub,
  setSelectedClub,
  selectedCoupon,
  setSelectedCoupon,
  selectedAffiliate,
  setSelectedAffiliate,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  eventos,
  clubesList,
  couponsList,
  affiliatesList,
  clearFilters,
  hasActiveFilters,
}: FiltersCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Filtros Avançados</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
        
        {/* Primeira linha: Evento e Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Evento</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos os eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {eventos.map((evento) => (
                  <SelectItem key={evento} value={evento}>
                    {evento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Status do Pagamento</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segunda linha: Clube, Cupom, Afiliado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Clube</Label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_club">Com clube</SelectItem>
                <SelectItem value="without_club">Sem clube</SelectItem>
                {clubesList.map((clube) => (
                  <SelectItem key={clube.id} value={clube.id}>
                    {clube.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Cupom de Desconto</Label>
            <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_coupon">Com cupom</SelectItem>
                <SelectItem value="without_coupon">Sem cupom</SelectItem>
                {couponsList.map((coupon) => (
                  <SelectItem key={coupon.code} value={coupon.code}>
                    {coupon.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Afiliado</Label>
            <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_affiliate">Com afiliado</SelectItem>
                <SelectItem value="without_affiliate">Sem afiliado</SelectItem>
                {affiliatesList.map((affiliate) => (
                  <SelectItem key={affiliate.id} value={affiliate.id}>
                    {affiliate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Terceira linha: Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Data Inicial</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Data Final</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
