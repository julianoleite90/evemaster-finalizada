"use client"

import { Loader2 } from "lucide-react"

/**
 * Loading state para componentes carregados dinamicamente
 */
export function DynamicLoader({ 
  message = "Carregando...",
  size = "default"
}: { 
  message?: string
  size?: "small" | "default" | "large"
}) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6", 
    large: "h-8 w-8"
  }

  return (
    <div className="flex items-center justify-center p-4 text-muted-foreground">
      <Loader2 className={`animate-spin mr-2 ${sizeClasses[size]}`} />
      <span className="text-sm">{message}</span>
    </div>
  )
}

/**
 * Loading state para editor de texto (ReactQuill)
 */
export function EditorLoader() {
  return (
    <div className="border rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
      <span className="text-sm text-muted-foreground">Carregando editor...</span>
    </div>
  )
}

/**
 * Loading state para mapas (GPX/Leaflet)
 */
export function MapLoader() {
  return (
    <div className="border rounded-lg p-8 bg-gray-100 flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-[#156634] mb-2" />
      <span className="text-sm text-muted-foreground">Carregando mapa...</span>
    </div>
  )
}

export default DynamicLoader

