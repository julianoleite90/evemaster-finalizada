"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"

interface LazyGoogleMapProps {
  location?: string
  address?: string
  addressNumber?: string
  city?: string
  state?: string
}

/**
 * Mapa do Google Maps com lazy loading otimizado
 * Só carrega o iframe quando o usuário rolar até próximo do mapa
 * ou quando clicar para carregar
 */
export function LazyGoogleMap({ 
  location, 
  address, 
  addressNumber, 
  city, 
  state 
}: LazyGoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Construir query de busca
  const searchQuery = encodeURIComponent(
    `${location || ''}${address ? ', ' + address : ''}${addressNumber ? ', ' + addressNumber : ''}${city && state ? ', ' + city + ' - ' + state : ''}`
  )

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Carregar quando estiver 200px antes de entrar na viewport
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { 
        rootMargin: '200px', // Começar a carregar 200px antes de aparecer
        threshold: 0 
      }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleClick = () => {
    if (!shouldLoad) {
      setShouldLoad(true)
    }
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-[250px] md:h-[400px] rounded-lg overflow-hidden border relative bg-gray-100"
    >
      {!shouldLoad ? (
        // Placeholder clicável antes de carregar
        <button
          onClick={handleClick}
          className="w-full h-full flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition-colors cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full bg-[#156634]/10 flex items-center justify-center group-hover:bg-[#156634]/20 transition-colors">
            <MapPin className="h-8 w-8 text-[#156634]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Clique para carregar o mapa</p>
            <p className="text-xs text-gray-500 mt-1">
              {city && state ? `${city}, ${state}` : location || 'Ver localização'}
            </p>
          </div>
        </button>
      ) : (
        <>
          {/* Loading indicator */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[#156634]/30 border-t-[#156634] rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Carregando mapa...</p>
              </div>
            </div>
          )}
          
          {/* Google Maps iframe */}
          <iframe
            src={`https://maps.google.com/maps?q=${searchQuery}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="eager" // Carregar imediatamente quando decidimos mostrar
            referrerPolicy="no-referrer-when-downgrade"
            className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleLoad}
          />
        </>
      )}
    </div>
  )
}

export default LazyGoogleMap

