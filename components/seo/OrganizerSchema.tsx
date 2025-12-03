"use client"

import Script from "next/script"

interface OrganizerSchemaProps {
  organizer: {
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
  siteUrl?: string
}

/**
 * Componente para gerar schema JSON-LD de Organization
 * Melhora SEO e aparência nos resultados de busca
 */
export function OrganizerSchema({ organizer, siteUrl = "https://evemaster.app" }: OrganizerSchemaProps) {
  if (!organizer) return null

  const organizerName = organizer.fantasy_name || organizer.company_name || "Organizador"
  const organizerUrl = organizer.website || `${siteUrl}/organizador/${organizer.id}`

  const sameAs: string[] = []
  if (organizer.social_instagram) sameAs.push(`https://instagram.com/${organizer.social_instagram.replace('@', '')}`)
  if (organizer.social_facebook) sameAs.push(`https://facebook.com/${organizer.social_facebook}`)

  const organizerSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizerUrl,
    "name": organizerName,
    "url": organizerUrl,
    ...(organizer.logo_url && { "logo": organizer.logo_url }),
    ...(organizer.description && { "description": organizer.description }),
    ...(organizer.email && { "email": organizer.email }),
    ...(organizer.phone && { "telephone": organizer.phone }),
    ...(organizer.address && {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": organizer.address,
        ...(organizer.city && { "addressLocality": organizer.city }),
        ...(organizer.state && { "addressRegion": organizer.state }),
        "addressCountry": "BR"
      }
    }),
    ...(sameAs.length > 0 && { "sameAs": sameAs }),
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      ...(organizer.email && { "email": organizer.email }),
      ...(organizer.phone && { "telephone": organizer.phone }),
      "availableLanguage": ["Portuguese", "Spanish", "English"]
    }
  }

  return (
    <Script
      id="organizer-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizerSchema)
      }}
    />
  )
}

