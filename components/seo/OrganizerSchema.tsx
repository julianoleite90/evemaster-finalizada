"use client"

import Script from "next/script"

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

interface OrganizerSchemaProps {
  organizer: Organizer
  siteUrl?: string
}

export function OrganizerSchema({ organizer, siteUrl = "https://evemaster.app" }: OrganizerSchemaProps) {
  if (!organizer) {
    return null
  }

  const organizerSchema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": organizer.company_name || organizer.fantasy_name || "Organizador",
  }

  if (organizer.description) {
    organizerSchema.description = organizer.description
  }

  if (organizer.email) {
    organizerSchema.email = organizer.email
  }

  if (organizer.phone) {
    organizerSchema.telephone = organizer.phone
  }

  if (organizer.website) {
    organizerSchema.url = organizer.website
  } else {
    organizerSchema.url = siteUrl
  }

  if (organizer.logo_url) {
    organizerSchema.logo = organizer.logo_url
  }

  if (organizer.address || organizer.city) {
    organizerSchema.address = {
      "@type": "PostalAddress",
      ...(organizer.address && { streetAddress: organizer.address }),
      ...(organizer.city && { addressLocality: organizer.city }),
      ...(organizer.state && { addressRegion: organizer.state }),
    }
  }

  const sameAs: string[] = []
  if (organizer.social_instagram) {
    sameAs.push(organizer.social_instagram)
  }
  if (organizer.social_facebook) {
    sameAs.push(organizer.social_facebook)
  }
  if (sameAs.length > 0) {
    organizerSchema.sameAs = sameAs
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

