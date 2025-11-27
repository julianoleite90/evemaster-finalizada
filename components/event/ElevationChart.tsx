"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Mountain } from "lucide-react"

interface ElevationChartProps {
  points: Array<{ lat: number; lon: number; ele: number; distance?: number }>
  distance: number
}

export default function ElevationChart({ points, distance }: ElevationChartProps) {
  if (points.length === 0) return null

  // Preparar dados para o gráfico
  const chartData = points.map((point, index) => {
    const dist = point.distance || (index / points.length) * distance
    return {
      distance: dist,
      elevation: Math.round(point.ele),
      km: (dist / 1000).toFixed(2),
    }
  })

  const maxElevation = Math.max(...points.map(p => p.ele))
  const minElevation = Math.min(...points.map(p => p.ele))
  const avgElevation = Math.round(points.reduce((sum, p) => sum + p.ele, 0) / points.length)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            {payload[0].payload.km} km
          </p>
          <p className="text-sm text-[#156634] font-medium">
            Elevação: {payload[0].value}m
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Título */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Gráfico de Altimetria
        </h4>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 p-3 md:p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium mb-0.5 md:mb-1">Mínima</p>
          <p className="text-sm md:text-lg font-bold text-gray-900">{minElevation}m</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium mb-0.5 md:mb-1">Média</p>
          <p className="text-sm md:text-lg font-bold text-[#156634]">{avgElevation}m</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium mb-0.5 md:mb-1">Máxima</p>
          <p className="text-sm md:text-lg font-bold text-gray-900">{maxElevation}m</p>
        </div>
      </div>

      {/* Gráfico 2D Profissional */}
      <div className="w-full h-[250px] md:h-[350px] rounded-lg overflow-hidden border bg-white p-2 md:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#156634" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#156634" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="km"
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(value) => `${value} km`}
              label={{ value: "Distância", position: "insideBottom", offset: -5, style: { fill: "#6b7280", fontSize: 10 } }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(value) => `${value}m`}
              label={{ value: "Elevação", angle: -90, position: "insideLeft", style: { fill: "#6b7280", fontSize: 10 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgElevation}
              stroke="#156634"
              strokeDasharray="5 5"
              label={{ value: "Média", position: "right", fill: "#156634", fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#156634"
              strokeWidth={3}
              fill="url(#elevationGradient)"
              dot={{ fill: "#156634", r: 2 }}
              activeDot={{ r: 5, fill: "#156634" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

