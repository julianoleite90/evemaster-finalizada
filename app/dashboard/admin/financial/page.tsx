"use client"

import { logger } from "@/lib/utils/logger"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, DollarSign, TrendingUp } from "lucide-react"

export default function FinancialPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformRevenue: 0,
    organizerRevenue: 0,
    affiliateCommissions: 0,
    totalTransactions: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Buscar todos os pagamentos aprovados
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .eq("payment_status", "paid")

      if (error) throw error

      const totalRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
      const platformRevenue = payments?.reduce((sum, p) => sum + (Number(p.platform_amount) || 0), 0) || 0
      const organizerRevenue = payments?.reduce((sum, p) => sum + (Number(p.organizer_amount) || 0), 0) || 0
      const affiliateCommissions = payments?.reduce((sum, p) => sum + (Number(p.affiliate_commission) || 0), 0) || 0

      setStats({
        totalRevenue,
        platformRevenue,
        organizerRevenue,
        affiliateCommissions,
        totalTransactions: payments?.length || 0,
      })
    } catch (error: any) {
      logger.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Visão geral financeira da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de transações aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita da Plataforma</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.platformRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxas e parcelamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita dos Organizadores</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.organizerRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor repassado aos organizadores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões de Afiliados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.affiliateCommissions)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total pago em comissões
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>
            Informações sobre transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Total de Transações</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">
                {stats.totalTransactions > 0
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(stats.totalRevenue / stats.totalTransactions)
                  : "R$ 0,00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

