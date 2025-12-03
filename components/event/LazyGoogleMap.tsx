"use client"

import { useEffect, useRef, useState } from "react"

interface LazyGoogleMapProps {
  location?: string
  address?: string
  addressNumber?: string
  city?: string
  state?: string
  className?: string
}

/**
 * Componente de mapa do Google Maps com lazy loading
 * Só carrega quando entra na viewport do usuário
 */
export function LazyGoogleMap({
  location,
  address,
  addressNumber,
  city,
  state,
  className = "",
}: LazyGoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Observer para detectar quando o componente entra na viewport
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  // Construir query de busca para o Google Maps
  const buildMapQuery = () => {
    const parts: string[] = []
    
    if (address) {
      parts.push(address)
      if (addressNumber) parts.push(addressNumber)
    }
    
    if (location && !parts.length) {
      parts.push(location)
    }
    
    if (city) parts.push(city)
    if (state) parts.push(state)
    parts.push("Brasil")

    return encodeURIComponent(parts.join(", "))
  }

  const mapQuery = buildMapQuery()

  // Se não tiver informações suficientes, não renderizar
  if (!location && !address && !city) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[200px] md:h-[300px] rounded-lg overflow-hidden ${className}`}
    >
      {!isVisible && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-sm text-gray-500">Carregando mapa...</p>
        </div>
      )}
      
      {isVisible && (
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"}&q=${mapQuery}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização do evento"
          onLoad={() => setHasLoaded(true)}
          className={`transition-opacity duration-300 ${hasLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      
      {isVisible && !hasLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#156634] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LazyGoogleMap

