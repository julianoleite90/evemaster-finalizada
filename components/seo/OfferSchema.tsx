"use client"

import Script from "next/script"

interface Ticket {
  id: string
  category: string
  price: number
  quantity?: number | null
  available_quantity?: number
  description?: string
}

interface Batch {
  id: string
  name: string
  start_date: string
  end_date: string
  tickets: Ticket[]
}

interface OfferSchemaProps {
  event: {
    id: string
    name: string
    slug?: string
    event_date: string
  }
  batches: Batch[]
  siteUrl?: string
}

/**
 * Componente para gerar schema JSON-LD de Offers (ingressos/inscrições)
 * Exibe preços nos resultados de busca
 */
export function OfferSchema({ event, batches, siteUrl = "https://evemaster.app" }: OfferSchemaProps) {
  if (!batches || batches.length === 0) return null

  const canonicalUrl = `${siteUrl}/evento/${event.slug || event.id}`
  
  // Flatten all tickets
  const allTickets = batches.flatMap(b => 
    b.tickets.map(t => ({
      ...t,
      batchName: b.name,
      validFrom: b.start_date,
      validThrough: b.end_date
    }))
  )

  if (allTickets.length === 0) return null

  // Calcular agregado
  const prices = allTickets.map(t => t.price).filter(p => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `Inscrição - ${event.name}`,
    "url": canonicalUrl,
    "category": "Event Registration",
    "offers": {
      "@type": "AggregateOffer",
      "url": canonicalUrl,
      "priceCurrency": "BRL",
      "lowPrice": minPrice,
      "highPrice": maxPrice,
      "offerCount": allTickets.length,
      "availability": "https://schema.org/InStock",
      "validFrom": batches[0]?.start_date,
      "offers": allTickets.slice(0, 10).map(ticket => ({
        "@type": "Offer",
        "name": ticket.category,
        "price": ticket.price,
        "priceCurrency": "BRL",
        "url": canonicalUrl,
        "availability": (ticket.available_quantity || ticket.quantity || 0) > 0 || !ticket.quantity
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
        "validFrom": ticket.validFrom,
        "validThrough": ticket.validThrough,
        ...(ticket.description && { "description": ticket.description }),
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": ticket.price,
          "priceCurrency": "BRL",
          "valueAddedTaxIncluded": true
        },
        "seller": {
          "@type": "Organization",
          "name": "EveMaster"
        }
      }))
    }
  }

  return (
    <Script
      id="offer-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(offerSchema)
      }}
    />
  )
}

