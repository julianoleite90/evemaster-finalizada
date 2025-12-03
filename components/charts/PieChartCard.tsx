"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export interface ChartDataItem {
  name: string
  value: number
  percent?: number
}

interface PieChartCardProps {
  title: string
  data: ChartDataItem[]
  colors?: string[]
  maxItems?: number
  showProgressBars?: boolean
}

// Paletas de cores predefinidas
export const CHART_COLORS = {
  category: ['#156634', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'],
  gender: ['#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'],
  age: ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316'],
  shirt: ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'],
  default: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
}

/**
 * Componente reutilizável de gráfico de pizza com barras de progresso
 * Usado na Home do Dashboard e nos Relatórios de Evento
 */
export function PieChartCard({ 
  title, 
  data, 
  colors = CHART_COLORS.default,
  maxItems = 10,
  showProgressBars = true
}: PieChartCardProps) {
  if (!data || data.length === 0) {
    return null
  }

  // Calcular total e percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercent = data.map(item => ({
    ...item,
    calculatedPercent: total > 0 ? (item.value / total) * 100 : 0
  }))

  // Limitar quantidade de itens nas barras
  const displayData = dataWithPercent.slice(0, maxItems)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-2 text-center">{title}</p>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={dataWithPercent}
            cx="50%"
            cy="50%"
            outerRadius={45}
            innerRadius={20}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {dataWithPercent.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => {
              const pct = total > 0 ? (Number(value) / total) * 100 : 0
              return [`${value} (${pct.toFixed(0)}%)`]
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.name
              }
              return label
            }}
            contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {showProgressBars && (
        <div className="space-y-1.5 mt-2">
          {displayData.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span 
                  className="text-gray-600 truncate max-w-[60px]" 
                  title={item.name}
                >
                  {item.name}
                </span>
                <span className="font-medium text-gray-800">
                  {item.calculatedPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all" 
                  style={{ 
                    width: `${item.calculatedPercent}%`, 
                    backgroundColor: colors[idx % colors.length] 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface DistributionChartsCardProps {
  categoryData?: ChartDataItem[]
  genderData?: ChartDataItem[]
  ageData?: ChartDataItem[]
  shirtSizeData?: ChartDataItem[]
  showShirtSize?: boolean
}

/**
 * Card completo com múltiplos gráficos de distribuição
 * Layout igual ao da Home do Dashboard
 */
export function DistributionChartsCard({
  categoryData = [],
  genderData = [],
  ageData = [],
  shirtSizeData = [],
  showShirtSize = false
}: DistributionChartsCardProps) {
  const hasData = categoryData.length > 0 || genderData.length > 0 || ageData.length > 0 || (showShirtSize && shirtSizeData.length > 0)
  
  if (!hasData) {
    return null
  }

  const gridCols = showShirtSize ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {categoryData.length > 0 && (
        <PieChartCard 
          title="Categoria" 
          data={categoryData} 
          colors={CHART_COLORS.category}
        />
      )}
      
      {genderData.length > 0 && (
        <PieChartCard 
          title="Gênero" 
          data={genderData} 
          colors={CHART_COLORS.gender}
        />
      )}
      
      {ageData.length > 0 && (
        <PieChartCard 
          title="Faixa Etária" 
          data={ageData} 
          colors={CHART_COLORS.age}
        />
      )}
      
      {showShirtSize && shirtSizeData.length > 0 && (
        <PieChartCard 
          title="Camiseta" 
          data={shirtSizeData} 
          colors={CHART_COLORS.shirt}
        />
      )}
    </div>
  )
}

export default PieChartCard

