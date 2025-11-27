import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 125.450</div>
            <p className="text-xs text-muted-foreground">
              Receita Recorrente Mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Take Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">
              Taxa da plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.234</div>
            <p className="text-xs text-muted-foreground">
              +234 este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eventos Pendentes</CardTitle>
            <CardDescription>
              Eventos aguardando moderação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Maratona Internacional</p>
                  <p className="text-xs text-muted-foreground">Organizador: João Silva</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-green-600 hover:underline">Aprovar</button>
                  <button className="text-xs text-red-600 hover:underline">Rejeitar</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Corrida Noturna SP</p>
                  <p className="text-xs text-muted-foreground">Organizador: Maria Santos</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-green-600 hover:underline">Aprovar</button>
                  <button className="text-xs text-red-600 hover:underline">Rejeitar</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas da Plataforma</CardTitle>
            <CardDescription>
              Métricas gerais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Eventos</span>
                <span className="text-sm font-medium">342</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Inscrições</span>
                <span className="text-sm font-medium">45.678</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receita Total</span>
                <span className="text-sm font-medium">R$ 2.345.678</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Organizadores Ativos</span>
                <span className="text-sm font-medium">127</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
