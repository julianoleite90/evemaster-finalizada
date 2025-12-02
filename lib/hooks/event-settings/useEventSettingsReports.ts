import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { parallelQueries, safeQuery } from "@/lib/supabase/query-safe"

interface ViewStats {
  totalViews: number
  viewsToday: number
  viewsLast7Days: number
  viewsLast30Days: number
  conversions: number
  conversionRate: number
}

interface ReportData {
  registrationsOverTime: Array<{ date: string; count: number; views: number }>
  revenueOverTime: Array<{ date: string; amount: number }>
  ticketsByCategory: Array<{ name: string; value: number; percent: number }>
  topCoupons: Array<{ code: string; uses: number; discount: number; revenue: number }>
  financialMetrics: {
    totalRevenue: number
    totalDiscounts: number
    netRevenue: number
    averageTicket: number
    estimatedRevenue: number
  }
  affiliatePerformance: Array<{ name: string; sales: number; commission: number; revenue: number }>
  byGender: Array<{ name: string; value: number; percent: number }>
  byAge: Array<{ name: string; value: number; percent: number }>
  byShirtSize: Array<{ name: string; value: number; percent: number }>
  loading: boolean
}

export function useEventSettingsReports(eventId: string) {
  const [viewStats, setViewStats] = useState<ViewStats>({
    totalViews: 0,
    viewsToday: 0,
    viewsLast7Days: 0,
    viewsLast30Days: 0,
    conversions: 0,
    conversionRate: 0
  })

  const [reportData, setReportData] = useState<ReportData>({
    registrationsOverTime: [],
    revenueOverTime: [],
    ticketsByCategory: [],
    topCoupons: [],
    financialMetrics: {
      totalRevenue: 0,
      totalDiscounts: 0,
      netRevenue: 0,
      averageTicket: 0,
      estimatedRevenue: 0
    },
    affiliatePerformance: [],
    byGender: [],
    byAge: [],
    byShirtSize: [],
    loading: false
  })

  // NOTA: A lógica completa de fetchViewStats e fetchReportData
  // foi mantida no arquivo original e será copiada aqui
  // Para manter o hook < 200 linhas, as funções complexas
  // podem ser movidas para utils/event-reports.ts

  return {
    viewStats,
    setViewStats,
    reportData,
    setReportData,
    // fetchViewStats e fetchReportData serão injetadas do componente original
  }
}

