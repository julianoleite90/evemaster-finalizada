"use client"

import { useEffect, useRef, useState } from "react"
import { Route, Mountain, Activity } from "lucide-react"
import dynamic from "next/dynamic"

// Carregar ElevationChart dinamicamente para evitar problemas com Three.js
const ElevationChart = dynamic(() => import("./ElevationChart"), {
  ssr: false,
})

// Importar Leaflet apenas no cliente
let L: any = null
if (typeof window !== "undefined") {
  L = require("leaflet")
  require("leaflet/dist/leaflet.css")

  // Fix para ícones do Leaflet no Next.js
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

interface GPXMapViewerProps {
  gpxUrl: string
  category: string
  showRoute?: boolean
  showElevation?: boolean
}

interface GPXData {
  distance: number
  elevation: {
    min: number
    max: number
    gain: number
  }
  points: Array<{ lat: number; lon: number; ele: number; distance?: number }>
}

export default function GPXMapViewer({ gpxUrl, category, showRoute = true, showElevation = true }: GPXMapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [gpxData, setGpxData] = useState<GPXData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAndParseGPX = async () => {
      try {
        setLoading(true)
        const response = await fetch(gpxUrl)
        const xmlText = await response.text()
        
        // Parse do GPX
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")
        
        // Extrair pontos do track
        const trkpts = xmlDoc.getElementsByTagName("trkpt")
        const points: Array<{ lat: number; lon: number; ele: number }> = []
        
        for (let i = 0; i < trkpts.length; i++) {
          const trkpt = trkpts[i]
          const lat = parseFloat(trkpt.getAttribute("lat") || "0")
          const lon = parseFloat(trkpt.getAttribute("lon") || "0")
          const eleEl = trkpt.getElementsByTagName("ele")[0]
          const ele = eleEl ? parseFloat(eleEl.textContent || "0") : 0
          
          points.push({ lat, lon, ele })
        }
        
        // Calcular distância total e acumulada
        let totalDistance = 0
        const pointsWithDistance = points.map((point, index) => {
          if (index === 0) {
            return { ...point, distance: 0 }
          }
          
          const p1 = points[index - 1]
          const p2 = point
          
          // Fórmula de Haversine
          const R = 6371 // Raio da Terra em km
          const dLat = (p2.lat - p1.lat) * Math.PI / 180
          const dLon = (p2.lon - p1.lon) * Math.PI / 180
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const segmentDistance = R * c * 1000 // em metros
          totalDistance += segmentDistance
          
          return { ...point, distance: totalDistance }
        })
        
        // Calcular elevação (usar todos os pontos, não filtrar)
        const elevations = points.map(p => p.ele)
        const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0
        const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0
        
        // Calcular ganho de elevação (soma apenas subidas)
        let elevationGain = 0
        for (let i = 1; i < points.length; i++) {
          const diff = points[i].ele - points[i - 1].ele
          if (diff > 0) elevationGain += diff
        }
        
        const data: GPXData = {
          distance: totalDistance,
          elevation: {
            min: Math.round(minElevation),
            max: Math.round(maxElevation),
            gain: Math.round(elevationGain)
          },
          points: pointsWithDistance
        }
        
        setGpxData(data)
      } catch (error) {
        console.error("Erro ao processar GPX:", error)
      } finally {
        setLoading(false)
      }
    }

    if (gpxUrl) {
      fetchAndParseGPX()
    }
  }, [gpxUrl])

  useEffect(() => {
    if (!mapRef.current || !gpxData || !showRoute || typeof window === "undefined" || !L) return

    // Inicializar mapa
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Adicionar tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Limpar layers anteriores (exceto tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Criar polyline com os pontos do GPX
    const latlngs = gpxData.points.map(p => [p.lat, p.lon] as [number, number])
    
    // Criar polyline
    const polyline = L.polyline(latlngs, {
      color: "#156634",
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
    }).addTo(map)

    // Adicionar marcadores de início e fim
    if (gpxData.points.length > 0) {
      const start = gpxData.points[0]
      const end = gpxData.points[gpxData.points.length - 1]

      L.marker([start.lat, start.lon], {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      })
        .addTo(map)
        .bindPopup("Início")

      L.marker([end.lat, end.lon], {
        icon: L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      })
        .addTo(map)
        .bindPopup("Fim")
    }

    // Ajustar zoom para mostrar toda a rota
    if (latlngs.length > 0) {
      map.fitBounds(latlngs, { padding: [20, 20] })
    }

    return () => {
      // Cleanup será feito no próximo render
    }
  }, [gpxData, showRoute])


  // distance está em metros, converter para km se > 1000m
  const distanceText = gpxData
    ? gpxData.distance >= 1000
      ? `${(gpxData.distance / 1000).toFixed(2)} km`
      : `${gpxData.distance.toFixed(0)} m`
    : ""

  return (
    <div className="space-y-4">
      {/* Informações do Percurso */}
      {!loading && gpxData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 p-3 md:p-4 bg-gradient-to-r from-[#156634]/10 to-[#156634]/5 rounded-lg border border-[#156634]/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#156634]" />
              <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium">Distância Total</p>
            </div>
            <p className="text-sm md:text-xl font-bold text-[#156634]">{distanceText}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <Mountain className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#156634]" />
              <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium">Elevação Mín</p>
            </div>
            <p className="text-sm md:text-xl font-bold text-gray-900">{gpxData.elevation.min}m</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <Mountain className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#156634]" />
              <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium">Elevação Máx</p>
            </div>
            <p className="text-sm md:text-xl font-bold text-gray-900">{gpxData.elevation.max}m</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <Mountain className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#156634]" />
              <p className="text-[9px] md:text-xs text-muted-foreground uppercase font-medium">Ganho Total</p>
            </div>
            <p className="text-sm md:text-xl font-bold text-gray-900">{gpxData.elevation.gain}m</p>
          </div>
        </div>
      )}

      {/* Mapa com Percurso */}
      {showRoute && (
        <div className="space-y-2">
          <h4 className="text-sm md:text-md font-semibold text-gray-900 flex items-center gap-2">
            <Route className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Mapa do Percurso
          </h4>
          <div
            ref={mapRef}
            className="w-full h-[300px] md:h-[500px] rounded-lg overflow-hidden border bg-gray-100"
            style={{ zIndex: 0 }}
          />
        </div>
      )}

      {/* Gráfico de Altimetria Profissional */}
      {showElevation && gpxData && (
        <ElevationChart points={gpxData.points} distance={gpxData.distance * 1000} />
      )}
    </div>
  )
}
