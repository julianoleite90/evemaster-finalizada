"use client"

import { logger } from "@/lib/utils/logger"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, TrendingUp, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalOrganizers: 0,
    totalAffiliates: 0,
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    activeOrganizers: 0,
    activeAffiliates: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Verificar se é admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userData?.role !== "ADMIN") {
          toast.error("Acesso negado")
          return
        }

        // Buscar estatísticas
        const [
          { count: pendingOrgs },
          { count: pendingAffs },
          { count: totalOrgs },
          { count: totalAffs },
          { count: totalUsers },
          { count: totalEvents },
          { data: revenueData },
          { count: activeOrgs },
          { count: activeAffs },
        ] = await Promise.all([
          supabase.from("organizers").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("organizers").select("*", { count: "exact", head: true }),
          supabase.from("affiliates").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("payments").select("amount").eq("payment_status", "paid"),
          supabase.from("organizers").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("is_active", true),
        ])

        const totalRevenue = revenueData?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

        setStats({
          pendingApprovals: (pendingOrgs || 0) + (pendingAffs || 0),
          totalOrganizers: totalOrgs || 0,
          totalAffiliates: totalAffs || 0,
          totalUsers: totalUsers || 0,
          totalEvents: totalEvents || 0,
          totalRevenue,
          activeOrganizers: activeOrgs || 0,
          activeAffiliates: activeAffs || 0,
        })
      } catch (error) {
        logger.error("Erro ao buscar dados:", error)
        toast.error("Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastros aguardando aprovação
            </p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/dashboard/admin/approvals">Ver aprovações →</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Organizadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeOrganizers} ativos
            </p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/dashboard/admin/organizers">Ver organizadores →</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Afiliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeAffiliates} ativos
            </p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/dashboard/admin/affiliates">Ver afiliados →</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos cadastrados
            </p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/dashboard/admin/events">Ver eventos →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários cadastrados
            </p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/dashboard/admin/users">Ver usuários →</Link>
            </Button>
          </CardContent>
        </Card>
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
              Receita acumulada
            </p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/dashboard/admin/financial">Ver financeiro →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/dashboard/admin/approvals">
                <AlertCircle className="h-5 w-5 mb-2" />
                <span className="font-semibold">Aprovar Cadastros</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {stats.pendingApprovals} pendente{stats.pendingApprovals !== 1 ? "s" : ""}
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/dashboard/admin/organizers">
                <Users className="h-5 w-5 mb-2" />
                <span className="font-semibold">Gerenciar Organizadores</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Configurar taxas e IDs da Barte
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/dashboard/admin/users">
                <Users className="h-5 w-5 mb-2" />
                <span className="font-semibold">Gerenciar Usuários</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Ativar/desativar usuários
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
