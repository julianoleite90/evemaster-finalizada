"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, TrendingUp, DollarSign, Users, Tag, Loader2, BarChart3, Activity, Target, Zap } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts"
import { ModernDistributionGrid, ModernStatCard } from "@/components/charts"
import type { ViewStats, ReportData } from "../types"

interface ReportsSectionProps {
  viewStats: ViewStats
  reportData: ReportData
  subMenu: string
  setSubMenu: (value: string) => void
}

export function ReportsSection({ viewStats, reportData, subMenu, setSubMenu }: ReportsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Tabs de Navegação */}
      <div className="bg-gray-100/80 p-1.5 rounded-2xl inline-flex gap-1">
        {[
          { id: 'inscricoes', label: 'Inscrições', icon: Users },
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
          { id: 'afiliados', label: 'Afiliados', icon: TrendingUp },
          { id: 'cupons', label: 'Cupons', icon: Tag },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setSubMenu(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              subMenu === tab.id 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      {reportData.loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Carregando relatórios...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tab: Inscrições */}
          {subMenu === "inscricoes" && (
            <div className="space-y-6">
              {/* Stats Cards - Visualizações */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <ModernStatCard
                  title="Total Visualizações"
                  value={viewStats.totalViews.toLocaleString('pt-BR')}
                  color="blue"
                  icon={<Eye className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Visualizações Hoje"
                  value={viewStats.viewsToday.toLocaleString('pt-BR')}
                  color="purple"
                  icon={<Activity className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Visualizações 7 Dias"
                  value={viewStats.viewsLast7Days.toLocaleString('pt-BR')}
                  color="orange"
                  icon={<BarChart3 className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Visualizações 30 Dias"
                  value={viewStats.viewsLast30Days.toLocaleString('pt-BR')}
                  color="blue"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Inscrições"
                  value={viewStats.conversions.toLocaleString('pt-BR')}
                  color="green"
                  icon={<Users className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Taxa Conversão"
                  value={`${viewStats.conversionRate.toFixed(1)}%`}
                  color="green"
                  icon={<Target className="h-5 w-5" />}
                />
              </div>

              {/* Gráfico de Área - Inscrições ao Longo do Tempo */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">Inscrições ao Longo do Tempo</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Evolução das inscrições e visualizações</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-gray-600">Inscrições</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Visualizações</span>
                    </div>
                  </div>
                </div>
                
                {reportData.registrationsOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={reportData.registrationsOverTime}>
                      <defs>
                        <linearGradient id="colorInscrições" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                          padding: '12px 16px',
                        }}
                        labelStyle={{ color: '#111827', fontWeight: '600', marginBottom: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fill="url(#colorInscrições)"
                        name="Inscrições"
                        dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5}
                        fill="url(#colorViews)"
                        name="Visualizações"
                        dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma inscrição registrada ainda</p>
                  </div>
                )}
              </div>

              {/* Distribuição - Design Moderno */}
              {(reportData.ticketsByCategory.length > 0 || reportData.byGender.length > 0 || reportData.byAge.length > 0 || reportData.byShirtSize.length > 0) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Distribuição de Inscritos</h3>
                  <ModernDistributionGrid
                    categoryData={reportData.ticketsByCategory}
                    genderData={reportData.byGender}
                    ageData={reportData.byAge}
                    shirtSizeData={reportData.byShirtSize}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Financeiro */}
          {subMenu === "financeiro" && (
            <div className="space-y-6">
              {/* Métricas Financeiras */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <ModernStatCard
                  title="Receita Total"
                  value={`R$ ${reportData.financialMetrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  color="green"
                  icon={<DollarSign className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Descontos"
                  value={`R$ ${reportData.financialMetrics.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  color="red"
                  icon={<Tag className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Receita Líquida"
                  value={`R$ ${reportData.financialMetrics.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  color="blue"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Ticket Médio"
                  value={`R$ ${reportData.financialMetrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  color="purple"
                  icon={<Zap className="h-5 w-5" />}
                />
                <ModernStatCard
                  title="Estimativa*"
                  value={`R$ ${reportData.financialMetrics.estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  subtitle="Baseado nos últimos 7 dias"
                  color="orange"
                  icon={<Target className="h-5 w-5" />}
                />
              </div>

              {/* Gráfico de Receita */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">Receita ao Longo do Tempo</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Evolução da receita diária</p>
                  </div>
                </div>
                
                {reportData.revenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={reportData.revenueOverTime}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `R$ ${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                          padding: '12px 16px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fill="url(#colorReceita)"
                        dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <DollarSign className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma receita registrada ainda</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Afiliados */}
          {subMenu === "afiliados" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">Performance dos Afiliados</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Vendas e comissões por afiliado</p>
                  </div>
                </div>
                
                {reportData.affiliatePerformance.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={reportData.affiliatePerformance} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11, fill: '#9ca3af' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#9ca3af' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                            padding: '12px 16px',
                          }}
                        />
                        <Bar 
                          dataKey="sales" 
                          fill="#10b981" 
                          name="Vendas"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#3b82f6" 
                          name="Receita (R$)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Lista de Afiliados */}
                    <div className="mt-6 space-y-3">
                      {reportData.affiliatePerformance.map((affiliate, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-emerald-700 font-semibold text-sm">
                                {affiliate.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{affiliate.name}</p>
                              <p className="text-xs text-gray-500">{affiliate.sales} vendas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">
                              R$ {affiliate.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">
                              Comissão: R$ {affiliate.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhum afiliado com vendas ainda</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Cupons */}
          {subMenu === "cupons" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">Cupons Mais Utilizados</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Análise de uso e performance</p>
                  </div>
                </div>
                
                {reportData.topCoupons.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={reportData.topCoupons} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis 
                          dataKey="code" 
                          tick={{ fontSize: 11, fill: '#9ca3af' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#9ca3af' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                            padding: '12px 16px',
                          }}
                        />
                        <Bar 
                          dataKey="uses" 
                          fill="#10b981" 
                          name="Usos"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar 
                          dataKey="discount" 
                          fill="#ef4444" 
                          name="Desconto (R$)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Lista de Cupons */}
                    <div className="mt-6 space-y-3">
                      {reportData.topCoupons.map((coupon, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                              <Tag className="h-4 w-4 text-violet-700" />
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-gray-900">{coupon.code}</p>
                              <p className="text-xs text-gray-500">{coupon.uses} utilizações</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-rose-600">
                              -R$ {coupon.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">
                              Receita: R$ {coupon.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Tag className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhum cupom utilizado ainda</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
