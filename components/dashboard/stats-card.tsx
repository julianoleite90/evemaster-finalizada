"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  currentValue: number | string
  previousValue: number | string
  icon?: React.ReactNode
  formatType?: "number" | "currency" | "percent"
  showComparison?: boolean
}

export function StatsCard({
  title,
  currentValue,
  previousValue,
  icon,
  formatType = "number",
  showComparison = true,
}: StatsCardProps) {
  const formatValue = (value: number | string): string => {
    const numValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.,]/g, "").replace(",", "."))
    
    switch (formatType) {
      case "currency":
        return `R$ ${numValue.toLocaleString('pt-BR')}`
      case "percent":
        return `${numValue.toFixed(1)}%`
      default:
        return numValue.toLocaleString('pt-BR')
    }
  }

  const current = typeof currentValue === "number" ? currentValue : parseFloat(String(currentValue).replace(/[^\d.,]/g, "").replace(",", "."))
  const previous = typeof previousValue === "number" ? previousValue : parseFloat(String(previousValue).replace(/[^\d.,]/g, "").replace(",", "."))
  
  const difference = current - previous
  const percentChange = previous !== 0 ? ((difference / previous) * 100) : 0
  const isPositive = difference >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
        {showComparison && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {isPositive ? (
              <ArrowUp className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600" />
            )}
            <span className={cn(
              "font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {Math.abs(percentChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">
              vs. {formatValue(previousValue)} ontem
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

