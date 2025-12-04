"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface Registration {
  id: string
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
  const total = registrations.length
  const paid = registrations.filter(r => r.statusPagamento === "paid").length
  const pending = registrations.filter(r => r.statusPagamento === "pending").length
  const cancelled = registrations.filter(r => r.statusPagamento === "cancelled").length
  
  const totalRevenue = registrations
    .filter(r => r.statusPagamento === "paid")
    .reduce((sum, r) => sum + (r.valor || 0), 0)

  const stats = [
    {
      label: "Total",
      value: total,
      icon: Users,
      status: "all",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      hoverColor: "hover:bg-gray-100",
    },
    {
      label: "Pagas",
      value: paid,
      icon: CheckCircle,
      status: "paid",
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
    },
    {
      label: "Pendentes",
      value: pending,
      icon: Clock,
      status: "pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      hoverColor: "hover:bg-yellow-100",
    },
    {
      label: "Canceladas",
      value: cancelled,
      icon: XCircle,
      status: "cancelled",
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverColor: "hover:bg-red-100",
    },
    {
      label: "Receita",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      status: "revenue",
      color: "text-[#156634]",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      isRevenue: true,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        const isSelected = selectedStatus === stat.status
        const isClickable = !stat.isRevenue

        return (
          <Card
            key={stat.status}
            className={cn(
              "cursor-pointer transition-all",
              isSelected && "ring-2 ring-[#156634]",
              isClickable && stat.hoverColor
            )}
            onClick={() => isClickable && onStatusChange(stat.status)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>
                {stat.value}
              </div>
              {!stat.isRevenue && typeof stat.value === 'number' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {total > 0 ? `${((stat.value / total) * 100).toFixed(1)}%` : "0%"} do total
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

