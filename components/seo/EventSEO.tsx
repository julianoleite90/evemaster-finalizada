import Head from 'next/head'

interface EventSEOProps {
  title: string
  description: string
  ogImage?: string
  slug: string
  eventName: string
  eventDate?: string
  location?: string
  organizer?: string
}

export default function EventSEO({
  title,
  description,
  ogImage,
  slug,
  eventName,
  eventDate,
  location,
  organizer
}: EventSEOProps) {
  const url = `https://evemaster.com.br/evento/${slug}`
  const dynamicOgImage = ogImage || `https://evemaster.com.br/api/og/evento/${slug}`
  
  // Gerar keywords baseado nos dados do evento
  const keywords = [
    eventName,
    'evento esportivo',
    'inscrições',
    'EveMaster',
    location,
    organizer,
    'corrida',
    'esporte',
    'competição'
  ].filter(Boolean).join(', ')

  // Structured data para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": eventName,
    "description": description,
    "startDate": eventDate,
    "location": location ? {
      "@type": "Place",
      "name": location
    } : undefined,
    "organizer": organizer ? {
      "@type": "Organization",
      "name": organizer
    } : undefined,
    "url": url,
    "image": dynamicOgImage
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EveMaster" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EveMaster" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={dynamicOgImage} />
      <meta property="twitter:creator" content="@evemaster" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#156634" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </Head>
  )
}

interface EventSEOProps {
  title: string
  description: string
  ogImage?: string
  slug: string
  eventName: string
  eventDate?: string
  location?: string
  organizer?: string
}

export default function EventSEO({
  title,
  description,
  ogImage,
  slug,
  eventName,
  eventDate,
  location,
  organizer
}: EventSEOProps) {
  const url = `https://evemaster.com.br/evento/${slug}`
  const dynamicOgImage = ogImage || `https://evemaster.com.br/api/og/evento/${slug}`
  
  // Gerar keywords baseado nos dados do evento
  const keywords = [
    eventName,
    'evento esportivo',
    'inscrições',
    'EveMaster',
    location,
    organizer,
    'corrida',
    'esporte',
    'competição'
  ].filter(Boolean).join(', ')

  // Structured data para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": eventName,
    "description": description,
    "startDate": eventDate,
    "location": location ? {
      "@type": "Place",
      "name": location
    } : undefined,
    "organizer": organizer ? {
      "@type": "Organization",
      "name": organizer
    } : undefined,
    "url": url,
    "image": dynamicOgImage
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EveMaster" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EveMaster" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={dynamicOgImage} />
      <meta property="twitter:creator" content="@evemaster" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#156634" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </Head>
  )
}

interface EventSEOProps {
  title: string
  description: string
  ogImage?: string
  slug: string
  eventName: string
  eventDate?: string
  location?: string
  organizer?: string
}

export default function EventSEO({
  title,
  description,
  ogImage,
  slug,
  eventName,
  eventDate,
  location,
  organizer
}: EventSEOProps) {
  const url = `https://evemaster.com.br/evento/${slug}`
  const dynamicOgImage = ogImage || `https://evemaster.com.br/api/og/evento/${slug}`
  
  // Gerar keywords baseado nos dados do evento
  const keywords = [
    eventName,
    'evento esportivo',
    'inscrições',
    'EveMaster',
    location,
    organizer,
    'corrida',
    'esporte',
    'competição'
  ].filter(Boolean).join(', ')

  // Structured data para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": eventName,
    "description": description,
    "startDate": eventDate,
    "location": location ? {
      "@type": "Place",
      "name": location
    } : undefined,
    "organizer": organizer ? {
      "@type": "Organization",
      "name": organizer
    } : undefined,
    "url": url,
    "image": dynamicOgImage
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EveMaster" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EveMaster" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={dynamicOgImage} />
      <meta property="twitter:creator" content="@evemaster" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#156634" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </Head>
  )
}

interface EventSEOProps {
  title: string
  description: string
  ogImage?: string
  slug: string
  eventName: string
  eventDate?: string
  location?: string
  organizer?: string
}

export default function EventSEO({
  title,
  description,
  ogImage,
  slug,
  eventName,
  eventDate,
  location,
  organizer
}: EventSEOProps) {
  const url = `https://evemaster.com.br/evento/${slug}`
  const dynamicOgImage = ogImage || `https://evemaster.com.br/api/og/evento/${slug}`
  
  // Gerar keywords baseado nos dados do evento
  const keywords = [
    eventName,
    'evento esportivo',
    'inscrições',
    'EveMaster',
    location,
    organizer,
    'corrida',
    'esporte',
    'competição'
  ].filter(Boolean).join(', ')

  // Structured data para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": eventName,
    "description": description,
    "startDate": eventDate,
    "location": location ? {
      "@type": "Place",
      "name": location
    } : undefined,
    "organizer": organizer ? {
      "@type": "Organization",
      "name": organizer
    } : undefined,
    "url": url,
    "image": dynamicOgImage
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EveMaster" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EveMaster" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={dynamicOgImage} />
      <meta property="twitter:creator" content="@evemaster" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#156634" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </Head>
  )
}

interface EventSEOProps {
  title: string
  description: string
  ogImage?: string
  slug: string
  eventName: string
  eventDate?: string
  location?: string
  organizer?: string
}

export default function EventSEO({
  title,
  description,
  ogImage,
  slug,
  eventName,
  eventDate,
  location,
  organizer
}: EventSEOProps) {
  const url = `https://evemaster.com.br/evento/${slug}`
  const dynamicOgImage = ogImage || `https://evemaster.com.br/api/og/evento/${slug}`
  
  // Gerar keywords baseado nos dados do evento
  const keywords = [
    eventName,
    'evento esportivo',
    'inscrições',
    'EveMaster',
    location,
    organizer,
    'corrida',
    'esporte',
    'competição'
  ].filter(Boolean).join(', ')

  // Structured data para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": eventName,
    "description": description,
    "startDate": eventDate,
    "location": location ? {
      "@type": "Place",
      "name": location
    } : undefined,
    "organizer": organizer ? {
      "@type": "Organization",
      "name": organizer
    } : undefined,
    "url": url,
    "image": dynamicOgImage
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EveMaster" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EveMaster" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={dynamicOgImage} />
      <meta property="twitter:creator" content="@evemaster" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#156634" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
    </Head>
  )
}
