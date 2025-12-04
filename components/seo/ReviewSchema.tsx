"use client"

import Script from "next/script"

export interface Review {
  id: string
  rating: number
  comment?: string
  author?: string
  datePublished?: string
}

interface ReviewSchemaProps {
  reviews: Review[]
  eventName?: string
  organizerName?: string
  pageUrl: string
}

export function ReviewSchema({ reviews, eventName, organizerName, pageUrl }: ReviewSchemaProps) {
  if (!reviews || reviews.length === 0) {
    return null
  }

  // Calcular média de avaliações
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const reviewCount = reviews.length

  const aggregateRatingSchema = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": averageRating.toFixed(1),
    "reviewCount": reviewCount,
    "bestRating": 5,
    "worstRating": 1
  }

  // Criar schemas individuais de reviews
  const reviewSchemas = reviews
    .filter(r => r.comment && r.comment.trim().length > 0)
    .map((review, index) => ({
      "@context": "https://schema.org",
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author || "Avaliador"
      },
      "datePublished": review.datePublished || new Date().toISOString(),
      "reviewBody": review.comment,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "itemReviewed": {
        "@type": eventName ? "Event" : "Organization",
        "name": eventName || organizerName || "Item avaliado"
      }
    }))

  const schemas = [aggregateRatingSchema, ...reviewSchemas]

  return (
    <Script
      id="review-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
      }}
    />
  )
}

