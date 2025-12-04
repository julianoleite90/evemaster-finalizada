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

export function OfferSchema({ event, batches, siteUrl = "https://evemaster.app" }: OfferSchemaProps) {
  if (!batches || batches.length === 0) {
    return null
  }

  const canonicalUrl = `${siteUrl}/evento/${event.slug || event.id}`
  const allTickets = batches.flatMap(b => b.tickets)
  const prices = allTickets.map(t => t.price).filter(p => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const totalAvailable = allTickets.reduce((sum, t) => sum + (t.available_quantity || t.quantity || 0), 0)
  const hasTickets = totalAvailable > 0 || allTickets.some(t => !t.quantity)

  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    "url": canonicalUrl,
    "priceCurrency": "BRL",
    "lowPrice": minPrice,
    "highPrice": maxPrice,
    "availability": hasTickets 
      ? "https://schema.org/InStock" 
      : "https://schema.org/SoldOut",
    "validFrom": batches[0]?.start_date || event.event_date,
    "offerCount": allTickets.length,
    "itemOffered": {
      "@type": "Event",
      "name": event.name,
      "startDate": event.event_date
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

