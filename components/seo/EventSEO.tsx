"use client"

import Script from "next/script"
import { FAQSchema, getDefaultEventFAQs } from "./FAQSchema"
import { OrganizerSchema } from "./OrganizerSchema"
import { OfferSchema } from "./OfferSchema"

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

interface Organizer {
  id: string
  company_name?: string
  fantasy_name?: string
  email?: string
  phone?: string
  website?: string
  logo_url?: string
  address?: string
  city?: string
  state?: string
  description?: string
  social_instagram?: string
  social_facebook?: string
}

interface EventSEOProps {
  event: {
    id: string
    name: string
    slug?: string
    description?: string
    category?: string
    event_date: string
    start_time?: string
    end_time?: string
    location?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    country?: string
    banner_url?: string
    status?: string
    language?: string
    difficulty_level?: string
    race_type?: string
    major_access?: boolean
    major_access_type?: string
    distances?: string[]
    custom_distances?: string[]
    organizer?: Organizer
    ticket_batches?: Batch[]
    average_rating?: number
    total_reviews?: number
  }
  siteUrl?: string
  /** Se true, inclui FAQs automáticas (padrão: true) */
  includeFAQs?: boolean
  /** Se true, inclui schema do organizador (padrão: true) */
  includeOrganizer?: boolean
  /** Se true, inclui schema de ofertas/tickets (padrão: true) */
  includeOffers?: boolean
}

export function EventSEO({ 
  event, 
  siteUrl = "https://evemaster.app",
  includeFAQs = true,
  includeOrganizer = true,
  includeOffers = true
}: EventSEOProps) {
  // Construir URL canônica
  const canonicalUrl = `${siteUrl}/evento/${event.slug || event.id}`
  
  // Formatar data do evento
  const eventDate = new Date(event.event_date)
  const startDateTime = event.start_time 
    ? `${event.event_date}T${event.start_time}:00` 
    : `${event.event_date}T00:00:00`
  const endDateTime = event.end_time 
    ? `${event.event_date}T${event.end_time}:00` 
    : undefined

  // Obter preço mínimo e máximo dos tickets
  const allTickets = event.ticket_batches?.flatMap(b => b.tickets) || []
  const prices = allTickets.map(t => t.price).filter(p => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const isFree = prices.length === 0 || minPrice === 0

  // Calcular disponibilidade
  const totalAvailable = allTickets.reduce((sum, t) => sum + (t.available_quantity || t.quantity || 0), 0)
  const hasTickets = totalAvailable > 0 || allTickets.some(t => !t.quantity) // sem limite = disponível

  // Limpar descrição HTML
  const cleanDescription = event.description
    ?.replace(/<[^>]+>/g, '')
    ?.replace(/\s+/g, ' ')
    ?.trim()
    ?.substring(0, 300) || ""

  // Determinar tipo de evento esportivo
  const getSportsActivityType = () => {
    switch (event.category) {
      case "corrida": return "Running"
      case "ciclismo": return "Cycling"
      case "triatlo": return "Triathlon"
      case "natacao": return "Swimming"
      case "caminhada": return "Walking"
      case "trail-running": return "TrailRunning"
      default: return "SportsEvent"
    }
  }

  // Schema do Evento (SportsEvent)
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": ["Event", "SportsEvent"],
    "@id": canonicalUrl,
    "name": event.name,
    "description": cleanDescription,
    "url": canonicalUrl,
    "startDate": startDateTime,
    ...(endDateTime && { "endDate": endDateTime }),
    "eventStatus": event.status === "cancelled" 
      ? "https://schema.org/EventCancelled" 
      : "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "image": event.banner_url ? [
      event.banner_url,
      `${siteUrl}/api/og/evento/${event.slug || event.id}`
    ] : [`${siteUrl}/api/og/evento/${event.slug || event.id}`],
    "location": {
      "@type": "Place",
      "name": event.location || "Local a definir",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": event.address || "",
        "addressLocality": event.city || "",
        "addressRegion": event.state || "",
        "postalCode": event.zip_code || "",
        "addressCountry": event.country || "BR"
      },
      ...(event.city && event.state && {
        "geo": {
          "@type": "GeoCoordinates",
          "addressCountry": "BR"
        }
      })
    },
    ...(event.organizer && {
      "organizer": {
        "@type": "Organization",
        "name": event.organizer.fantasy_name || event.organizer.company_name || "Organizador",
        ...(event.organizer.email && { "email": event.organizer.email }),
        ...(event.organizer.phone && { "telephone": event.organizer.phone }),
        ...(event.organizer.website && { "url": event.organizer.website }),
        ...(event.organizer.logo_url && { "logo": event.organizer.logo_url })
      }
    }),
    "offers": hasTickets ? {
      "@type": "AggregateOffer",
      "url": canonicalUrl,
      "priceCurrency": "BRL",
      "lowPrice": minPrice,
      "highPrice": maxPrice,
      "availability": hasTickets 
        ? "https://schema.org/InStock" 
        : "https://schema.org/SoldOut",
      "validFrom": event.ticket_batches?.[0]?.start_date || event.event_date,
      "offerCount": allTickets.length
    } : {
      "@type": "Offer",
      "url": canonicalUrl,
      "price": 0,
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "description": "Evento gratuito"
    },
    "sport": getSportsActivityType(),
    "typicalAgeRange": "18-65",
    "isAccessibleForFree": isFree,
    "inLanguage": event.language === "es" ? "es" : event.language === "en" ? "en" : "pt-BR",
    ...(event.average_rating && event.total_reviews && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": event.average_rating,
        "reviewCount": event.total_reviews,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    ...(event.difficulty_level && {
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Dificuldade",
          "value": event.difficulty_level
        },
        ...(event.race_type ? [{
          "@type": "PropertyValue",
          "name": "Tipo de Prova",
          "value": event.race_type
        }] : []),
        ...(event.distances?.length ? [{
          "@type": "PropertyValue",
          "name": "Distâncias",
          "value": event.distances.join(", ")
        }] : [])
      ]
    }),
    "performer": {
      "@type": "Person",
      "name": "Participantes"
    }
  }

  // Schema de Breadcrumb
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Eventos",
        "item": `${siteUrl}/eventos`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": event.name,
        "item": canonicalUrl
      }
    ]
  }

  // Schema da Organização (site)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EveMaster",
    "url": siteUrl,
    "logo": `${siteUrl}/images/logo/logo.png`,
    "sameAs": [
      "https://www.instagram.com/evemaster.app",
      "https://www.facebook.com/evemaster.app"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Portuguese", "Spanish", "English"]
    }
  }

  // Schema WebPage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    "url": canonicalUrl,
    "name": event.name,
    "description": cleanDescription,
    "isPartOf": {
      "@id": `${siteUrl}#website`
    },
    "about": {
      "@id": canonicalUrl
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": event.banner_url || `${siteUrl}/api/og/evento/${event.slug || event.id}`
    },
    "datePublished": event.event_date,
    "inLanguage": event.language === "es" ? "es" : event.language === "en" ? "en" : "pt-BR"
  }

  // Combinar todos os schemas principais
  const combinedSchema = [
    eventSchema,
    breadcrumbSchema,
    organizationSchema,
    webPageSchema
  ]

  // Gerar FAQs automáticas
  const autoFAQs = getDefaultEventFAQs(
    event.name, 
    event.event_date, 
    event.location || event.city || ""
  )

  return (
    <>
      {/* JSON-LD Schema Principal - Event, Breadcrumb, Organization, WebPage */}
      <Script
        id="event-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema)
        }}
      />

      {/* FAQ Schema - Melhora CTR com perguntas frequentes no Google */}
      {includeFAQs && (
        <FAQSchema faqs={autoFAQs} pageUrl={canonicalUrl} />
      )}

      {/* Organizer Schema - Informações do organizador */}
      {includeOrganizer && event.organizer && (
        <OrganizerSchema organizer={event.organizer} siteUrl={siteUrl} />
      )}

      {/* Offer Schema - Preços dos ingressos */}
      {includeOffers && event.ticket_batches && event.ticket_batches.length > 0 && (
        <OfferSchema 
          event={{ id: event.id, name: event.name, slug: event.slug, event_date: event.event_date }}
          batches={event.ticket_batches}
          siteUrl={siteUrl}
        />
      )}
    </>
  )
}
