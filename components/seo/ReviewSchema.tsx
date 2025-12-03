"use client"

import Script from "next/script"

interface Review {
  author: string
  rating: number
  content?: string
  datePublished?: string
}

interface ReviewSchemaProps {
  reviews: Review[]
  itemReviewed: {
    type: string
    name: string
    url: string
  }
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
    bestRating?: number
    worstRating?: number
  }
}

/**
 * Componente para gerar schema JSON-LD de Reviews
 * Exibe estrelas de avaliação nos resultados de busca do Google
 */
export function ReviewSchema({ reviews, itemReviewed, aggregateRating }: ReviewSchemaProps) {
  if (!reviews || reviews.length === 0) return null

  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": itemReviewed.type || "Event",
    "name": itemReviewed.name,
    "url": itemReviewed.url,
    ...(aggregateRating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": aggregateRating.ratingValue,
        "reviewCount": aggregateRating.reviewCount,
        "bestRating": aggregateRating.bestRating || 5,
        "worstRating": aggregateRating.worstRating || 1
      }
    }),
    "review": reviews.slice(0, 5).map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      ...(review.content && { "reviewBody": review.content }),
      ...(review.datePublished && { "datePublished": review.datePublished })
    }))
  }

  return (
    <Script
      id="review-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(reviewSchema)
      }}
    />
  )
}

