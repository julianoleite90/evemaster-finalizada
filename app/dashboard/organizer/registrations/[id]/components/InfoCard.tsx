"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface InfoCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  className?: string
}

export function InfoCard({ title, icon: Icon, children, className = "" }: InfoCardProps) {
  return (
    <Card className={`border-gray-200 shadow-sm ${className}`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  )
}

interface InfoRowProps {
  label: string
  value: string | ReactNode
  icon?: LucideIcon
  onClick?: () => void
  copyable?: boolean
}

export function InfoRow({ label, value, icon: Icon, onClick, copyable }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {onClick || copyable ? (
          <p 
            className="text-sm text-gray-900 cursor-pointer hover:text-green-600 transition-colors"
            onClick={onClick}
          >
            {value}
          </p>
        ) : (
          <p className="text-sm text-gray-900">{value}</p>
        )}
      </div>
    </div>
  )
}

interface QuickStatProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: "green" | "yellow" | "red" | "blue" | "gray"
}

export function QuickStat({ label, value, icon: Icon, color = "gray" }: QuickStatProps) {
  const colorClasses = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorClasses[color]}`}>
      <Icon className="h-5 w-5" />
      <div>
        <p className="text-xs opacity-80">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

