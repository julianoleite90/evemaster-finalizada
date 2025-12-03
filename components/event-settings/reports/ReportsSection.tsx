"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, TrendingUp, Users, DollarSign, Shirt } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts"

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

interface ReportsSectionProps {
  viewStats: ViewStats
  reportData: ReportData
  subMenu: string
  setSubMenu: (value: string) => void
}

// Cores para os gráficos - mesmas cores da home
const COLORS_CATEGORY = ['#156634', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6']
const COLORS_GENDER = ['#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4']
const COLORS_AGE = ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316']
const COLORS_SHIRT = ['#156634', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6']

export function ReportsSection({ viewStats, reportData, subMenu, setSubMenu }: ReportsSectionProps) {
  // Preparar dados para o gráfico de área (últimos registros)
  const areaChartData = reportData.registrationsOverTime.slice(-7).map(item => ({
    date: item.date.split(' ')[0], // Pegar apenas o dia
    inscricoes: item.count,
    acessos: item.views,
  }))

  return (
    <div className="space-y-6">
      {/* View Stats Card - Layout compacto */}
      <Card className="shadow-sm border-0 bg-gradient-to-r from-gray-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-[#156634]" />
            Estatísticas de Visualizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-2xl font-bold text-[#156634]">{viewStats.totalViews}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{viewStats.viewsToday}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{viewStats.viewsLast7Days}</p>
              <p className="text-xs text-muted-foreground">7 dias</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-2xl font-bold text-orange-600">{viewStats.viewsLast30Days}</p>
              <p className="text-xs text-muted-foreground">30 dias</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-2xl font-bold text-green-600">{viewStats.conversions}</p>
              <p className="text-xs text-muted-foreground">Conversões</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-2xl font-bold text-indigo-600">{viewStats.conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {reportData.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#156634]" />
          <span className="ml-2 text-muted-foreground">Carregando dados...</span>
        </div>
      )}

      {/* Gráficos Principais - Linha + Barras de Camisetas */}
      {!reportData.loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de Linha - Inscrições ao Longo do Tempo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#156634]" />
                Inscrições ao Longo do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.registrationsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={reportData.registrationsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Inscrições"
                      stroke="#156634"
                      strokeWidth={2}
                      dot={{ fill: "#156634", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="Visualizações"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: "#6366f1", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum dado de inscrição disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras Verticais (Prédio) - Camisetas */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shirt className="h-5 w-5 text-[#156634]" />
                Distribuição de Camisetas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.byShirtSize.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={reportData.byShirtSize} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} unid. (${props.payload.percent.toFixed(1)}%)`,
                        'Quantidade'
                      ]}
                      contentStyle={{ 
                        fontSize: '12px', 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Quantidade" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    >
                      {reportData.byShirtSize.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_SHIRT[index % COLORS_SHIRT.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum dado de camiseta disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bloco com 3 Gráficos de Pizza */}
      {!reportData.loading && (reportData.ticketsByCategory.length > 0 || reportData.byGender.length > 0 || reportData.byAge.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição de Inscritos</CardTitle>
            <CardDescription>Categoria, Gênero e Faixa Etária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* Pizza - Categoria */}
              {reportData.ticketsByCategory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Categoria</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={reportData.ticketsByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={45}
                        innerRadius={20}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {reportData.ticketsByCategory.map((entry, index) => (
                          <Cell key={`cell-cat-${index}`} fill={COLORS_CATEGORY[index % COLORS_CATEGORY.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} (${(props.payload.percent).toFixed(0)}%)`,
                          props.payload.name
                        ]}
                        contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {reportData.ticketsByCategory.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-600 truncate max-w-[60px]" title={item.name}>{item.name}</span>
                          <span className="font-medium text-gray-800">{item.percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ width: `${item.percent}%`, backgroundColor: COLORS_CATEGORY[idx % COLORS_CATEGORY.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pizza - Gênero */}
              {reportData.byGender.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Gênero</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={reportData.byGender}
                        cx="50%"
                        cy="50%"
                        outerRadius={45}
                        innerRadius={20}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {reportData.byGender.map((entry, index) => (
                          <Cell key={`cell-sex-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} (${(props.payload.percent).toFixed(0)}%)`,
                          props.payload.name
                        ]}
                        contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {reportData.byGender.map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium text-gray-800">{item.percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ width: `${item.percent}%`, backgroundColor: COLORS_GENDER[idx % COLORS_GENDER.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pizza - Idade */}
              {reportData.byAge.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Faixa Etária</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={reportData.byAge}
                        cx="50%"
                        cy="50%"
                        outerRadius={45}
                        innerRadius={20}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {reportData.byAge.map((entry, index) => (
                          <Cell key={`cell-age-${index}`} fill={COLORS_AGE[index % COLORS_AGE.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} (${(props.payload.percent).toFixed(0)}%)`,
                          props.payload.name
                        ]}
                        contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {reportData.byAge.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="font-medium text-gray-800">{item.percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ width: `${item.percent}%`, backgroundColor: COLORS_AGE[idx % COLORS_AGE.length] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholders */}
              {reportData.ticketsByCategory.length === 0 && (
                <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
                  Sem dados de categoria
                </div>
              )}
              {reportData.byGender.length === 0 && (
                <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
                  Sem dados de gênero
                </div>
              )}
              {reportData.byAge.length === 0 && (
                <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
                  Sem dados de idade
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para relatórios detalhados */}
      <Tabs value={subMenu} onValueChange={setSubMenu}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
          <TabsTrigger value="afiliados" className="text-xs">Afiliados</TabsTrigger>
          <TabsTrigger value="camisetas" className="text-xs">Camisetas Detalhado</TabsTrigger>
        </TabsList>

        {/* Financeiro */}
        <TabsContent value="financeiro" className="mt-6 space-y-6">
          {!reportData.loading && (
            <>
              {/* Métricas Financeiras */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">
                        R$ {reportData.financialMetrics.totalRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Receita Total</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-600">
                        R$ {reportData.financialMetrics.totalDiscounts.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Descontos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#156634]">
                        R$ {reportData.financialMetrics.netRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Receita Líquida</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">
                        R$ {reportData.financialMetrics.averageTicket.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ticket Médio</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">
                        R$ {reportData.financialMetrics.estimatedRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Projeção</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Receita ao longo do tempo */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#156634]" />
                    Receita ao Longo do Tempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.revenueOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={reportData.revenueOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Bar dataKey="amount" name="Receita" fill="#156634" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Nenhum dado de receita disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Cupons */}
              {reportData.topCoupons.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Cupons Utilizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reportData.topCoupons.map((coupon) => (
                        <div key={coupon.code} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div>
                            <span className="font-mono font-bold text-sm">{coupon.code}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">{coupon.uses} usos</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-red-600">-R$ {coupon.discount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Afiliados */}
        <TabsContent value="afiliados" className="mt-6">
          {!reportData.loading && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance dos Afiliados</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.affiliatePerformance.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.affiliatePerformance.map((affiliate) => (
                      <div key={affiliate.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <p className="text-sm text-muted-foreground">{affiliate.sales} vendas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#156634]">R$ {affiliate.revenue.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Comissão: R$ {affiliate.commission.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado de afiliado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Camisetas Detalhado */}
        <TabsContent value="camisetas" className="mt-6">
          {!reportData.loading && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-[#156634]" />
                  Distribuição por Tamanho de Camiseta
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.byShirtSize.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={reportData.byShirtSize} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={40} />
                        <Tooltip />
                        <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                          {reportData.byShirtSize.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_SHIRT[index % COLORS_SHIRT.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {reportData.byShirtSize.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS_SHIRT[index % COLORS_SHIRT.length] }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{item.value}</span>
                            <span className="text-muted-foreground ml-2">({item.percent.toFixed(1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado de tamanho de camiseta disponível
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
