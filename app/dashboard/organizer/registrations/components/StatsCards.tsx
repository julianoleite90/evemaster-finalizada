"use client"

import { Card, CardContent } from "@/components/ui/card"
import { User, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react"

interface Registration {
  statusPagamento: "paid" | "pending" | "cancelled"
  valor: number
}

interface StatsCardsProps {
  registrations: Registration[]
  selectedStatus: string
  onStatusChange: (status: string) => void
  formatCurrency: (value: number) => string
}

export function StatsCards({ 
  registrations, 
  selectedStatus, 
  onStatusChange,
  formatCurrency 
}: StatsCardsProps) {
  const totalPaid = registrations.filter((r) => r.statusPagamento === "paid").length
  const totalPending = registrations.filter((r) => r.statusPagamento === "pending").length
  const totalCancelled = registrations.filter((r) => r.statusPagamento === "cancelled").length
  const totalRevenue = registrations
    .filter((r) => r.statusPagamento === "paid")
    .reduce((sum, r) => sum + (Number(r.valor) || 0), 0)

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${selectedStatus === "all" ? "ring-2 ring-[#156634] bg-green-50/50" : ""}`}
        onClick={() => onStatusChange("all")}
      >
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-xl font-semibold mt-1">{registrations.length}</p>
            </div>
            <User className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${selectedStatus === "paid" ? "ring-2 ring-green-500 bg-green-50/50" : ""}`}
        onClick={() => onStatusChange("paid")}
      >
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pagas</p>
              <p className="text-xl font-semibold mt-1 text-green-600">{totalPaid}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${selectedStatus === "pending" ? "ring-2 ring-yellow-500 bg-yellow-50/50" : ""}`}
        onClick={() => onStatusChange("pending")}
      >
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
              <p className="text-xl font-semibold mt-1 text-yellow-600">{totalPending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${selectedStatus === "cancelled" ? "ring-2 ring-red-500 bg-red-50/50" : ""}`}
        onClick={() => onStatusChange("cancelled")}
      >
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cancelados</p>
              <p className="text-xl font-semibold mt-1 text-red-600">{totalCancelled}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500/50" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Receita</p>
              <p className="text-xl font-semibold mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

