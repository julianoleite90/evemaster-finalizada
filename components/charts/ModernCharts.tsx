"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export interface ChartDataItem {
  name: string
  value: number
  percent?: number
}

// Paletas de cores premium
export const MODERN_COLORS = {
  category: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  gender: ['#2563eb', '#f472b6', '#a78bfa', '#22d3ee'],
  age: ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316'],
  shirt: ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'],
  vibrant: ['#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04'],
}

interface ModernDonutChartProps {
  title: string
  data: ChartDataItem[]
  colors?: string[]
  icon?: React.ReactNode
}

/**
 * Gráfico de Donut Moderno com legenda lateral
 */
export function ModernDonutChart({ 
  title, 
  data, 
  colors = MODERN_COLORS.vibrant,
  icon
}: ModernDonutChartProps) {
  if (!data || data.length === 0) return null

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercent = data.map(item => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-gray-500">{icon}</span>}
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercent}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {dataWithPercent.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    className="drop-shadow-sm"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const pct = total > 0 ? (Number(value) / total) * 100 : 0
                  return [`${value} (${pct.toFixed(1)}%)`, name]
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  padding: '8px 12px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centro do donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{total}</span>
            <span className="text-[10px] text-gray-500">total</span>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex-1 space-y-2">
          {dataWithPercent.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="text-xs text-gray-600 truncate flex-1" title={item.name}>
                {item.name}
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {item.percent.toFixed(0)}%
              </span>
            </div>
          ))}
          {dataWithPercent.length > 5 && (
            <div className="text-[10px] text-gray-400 pl-5">
              +{dataWithPercent.length - 5} mais
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ModernHorizontalBarsProps {
  title: string
  data: ChartDataItem[]
  colors?: string[]
  icon?: React.ReactNode
  showValues?: boolean
}

/**
 * Gráfico de Barras Horizontais Moderno
 */
export function ModernHorizontalBars({ 
  title, 
  data, 
  colors = MODERN_COLORS.vibrant,
  icon,
  showValues = true
}: ModernHorizontalBarsProps) {
  if (!data || data.length === 0) return null

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-gray-500">{icon}</span>}
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <span className="ml-auto text-xs text-gray-400">{total} total</span>
      </div>

      {/* Barras */}
      <div className="space-y-3">
        {data.slice(0, 6).map((item, idx) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0
          const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700 font-medium truncate max-w-[120px]" title={item.name}>
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  {showValues && (
                    <span className="text-xs text-gray-500">{item.value}</span>
                  )}
                  <span className="text-xs font-semibold text-gray-900 w-10 text-right">
                    {percent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${widthPercent}%`, 
                    backgroundColor: colors[idx % colors.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ModernDistributionGridProps {
  categoryData?: ChartDataItem[]
  genderData?: ChartDataItem[]
  ageData?: ChartDataItem[]
  shirtSizeData?: ChartDataItem[]
}

/**
 * Grid de distribuição com design moderno
 */
export function ModernDistributionGrid({
  categoryData = [],
  genderData = [],
  ageData = [],
  shirtSizeData = []
}: ModernDistributionGridProps) {
  const hasData = categoryData.length > 0 || genderData.length > 0 || ageData.length > 0 || shirtSizeData.length > 0
  
  if (!hasData) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categoryData.length > 0 && (
        <ModernDonutChart 
          title="Por Categoria" 
          data={categoryData} 
          colors={MODERN_COLORS.category}
        />
      )}
      
      {genderData.length > 0 && (
        <ModernDonutChart 
          title="Por Gênero" 
          data={genderData} 
          colors={MODERN_COLORS.gender}
        />
      )}
      
      {ageData.length > 0 && (
        <ModernHorizontalBars 
          title="Faixa Etária" 
          data={ageData} 
          colors={MODERN_COLORS.age}
          showValues={false}
        />
      )}
      
      {shirtSizeData.length > 0 && (
        <ModernHorizontalBars 
          title="Tamanho Camiseta" 
          data={shirtSizeData} 
          colors={MODERN_COLORS.shirt}
          showValues={true}
        />
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
  orange: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  red: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
}

/**
 * Card de estatística moderno
 */
export function ModernStatCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  trend,
  color = 'green'
}: StatCardProps) {
  const classes = colorClasses[color]

  return (
    <div className={`${classes.bg} ${classes.border} border rounded-2xl p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`text-xl font-bold ${classes.text} mt-0.5`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${classes.text} opacity-50`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

