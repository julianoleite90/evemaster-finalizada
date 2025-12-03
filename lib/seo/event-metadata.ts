import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.app'

interface EventForSEO {
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
  distances?: string[]
  organizer?: {
    company_name?: string
    fantasy_name?: string
  }
}

// Limpar HTML de uma string
export function stripHtml(value?: string): string {
  return value
    ? value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : ''
}

// Garantir URL absoluta
export function ensureAbsoluteUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null
  
  const trimmedUrl = url.trim()
  
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl
  }
  
  if (trimmedUrl.startsWith('/')) {
    return `${siteUrl}${trimmedUrl}`
  }
  
  return `${siteUrl}/${trimmedUrl}`
}

// Formatar data para display
export function formatEventDate(date: string, language: string = 'pt'): string {
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }
  
  const locale = language === 'es' ? 'es-ES' : language === 'en' ? 'en-US' : 'pt-BR'
  return d.toLocaleDateString(locale, options)
}

// Gerar keywords automáticas
export function generateKeywords(event: EventForSEO): string[] {
  const keywords: string[] = [
    event.name,
    'evento esportivo',
    'inscrição',
    'corrida',
    'esporte'
  ]
  
  if (event.category) {
    keywords.push(event.category)
    
    switch (event.category) {
      case 'corrida':
        keywords.push('corrida de rua', 'maratona', 'meia maratona', 'running', 'atletismo')
        break
      case 'ciclismo':
        keywords.push('ciclismo', 'bike', 'pedal', 'cycling', 'mtb')
        break
      case 'triatlo':
        keywords.push('triatlo', 'triathlon', 'ironman', 'natação', 'ciclismo', 'corrida')
        break
      case 'trail-running':
        keywords.push('trail running', 'trilha', 'montanha', 'ultra', 'trail')
        break
    }
  }
  
  if (event.city) keywords.push(event.city)
  if (event.state) keywords.push(event.state)
  if (event.distances) keywords.push(...event.distances)
  if (event.difficulty_level) keywords.push(event.difficulty_level)
  if (event.race_type) keywords.push(event.race_type)
  
  // Remover duplicatas e retornar
  return [...new Set(keywords.filter(Boolean))]
}

// Gerar título SEO otimizado
export function generateSEOTitle(event: EventForSEO): string {
  const parts: string[] = [event.name]
  
  if (event.city && event.state) {
    parts.push(`${event.city}/${event.state}`)
  } else if (event.city) {
    parts.push(event.city)
  }
  
  if (event.event_date) {
    const date = new Date(event.event_date)
    const month = date.toLocaleDateString('pt-BR', { month: 'short' })
    const year = date.getFullYear()
    parts.push(`${month} ${year}`)
  }
  
  return parts.join(' | ')
}

// Gerar descrição SEO otimizada
export function generateSEODescription(event: EventForSEO): string {
  let description = ''
  
  // Começar com a descrição do evento se existir
  if (event.description) {
    description = stripHtml(event.description).substring(0, 120)
  }
  
  // Adicionar informações do evento
  const infoParts: string[] = []
  
  if (event.event_date) {
    infoParts.push(`Data: ${formatEventDate(event.event_date, event.language)}`)
  }
  
  if (event.city) {
    infoParts.push(`Local: ${event.city}${event.state ? `/${event.state}` : ''}`)
  }
  
  if (event.distances?.length) {
    infoParts.push(`Distâncias: ${event.distances.join(', ')}`)
  }
  
  if (infoParts.length > 0) {
    if (description) {
      description += '. '
    }
    description += infoParts.join(' • ')
  }
  
  // Garantir que não exceda 160 caracteres
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }
  
  return description || `Inscreva-se no ${event.name}. Evento esportivo com inscrição online.`
}

// Gerar metadata completa para Next.js
export function generateEventMetadata(event: EventForSEO | null, slug: string): Metadata {
  const defaultTitle = 'EveMaster - Plataforma para Eventos Esportivos'
  const defaultDescription = 'Encontre e gerencie eventos esportivos com a EveMaster, plataforma completa de ingressos e inscrições.'
  
  if (!event || !event.name?.trim()) {
    return {
      title: { absolute: defaultTitle },
      description: defaultDescription,
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        url: `${siteUrl}/evento/${slug}`,
        siteName: 'EveMaster',
        images: [{ url: `${siteUrl}/images/logo/logo.png`, width: 1200, height: 630, alt: 'EveMaster' }],
        locale: 'pt_BR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: [`${siteUrl}/images/logo/logo.png`],
      },
      alternates: { canonical: `${siteUrl}/evento/${slug}` },
    }
  }

  const title = generateSEOTitle(event)
  const description = generateSEODescription(event)
  const keywords = generateKeywords(event)
  const canonicalUrl = `${siteUrl}/evento/${event.slug || slug}`
  const bannerUrl = ensureAbsoluteUrl(event.banner_url)
  const ogImage = bannerUrl || `${siteUrl}/api/og/evento/${event.slug || slug}`
  
  // Determinar locale
  const locale = event.language === 'es' ? 'es_ES' : event.language === 'en' ? 'en_US' : 'pt_BR'
  const alternateLocales = ['pt_BR', 'es_ES', 'en_US'].filter(l => l !== locale)

  return {
    title: { absolute: title },
    description,
    keywords: keywords.join(', '),
    authors: [
      { name: event.organizer?.fantasy_name || event.organizer?.company_name || 'EveMaster' }
    ],
    creator: 'EveMaster',
    publisher: 'EveMaster',
    category: event.category || 'Eventos Esportivos',
    classification: 'Eventos',
    
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'EveMaster',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: event.name,
          type: 'image/jpeg',
        },
        // Imagem quadrada para algumas plataformas
        {
          url: ogImage,
          width: 600,
          height: 600,
          alt: event.name,
        }
      ],
      locale,
      alternateLocale: alternateLocales,
      type: 'website',
      countryName: 'Brazil',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@evemaster_app',
      site: '@evemaster_app',
    },
    
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'pt-BR': `${siteUrl}/evento/${event.slug || slug}`,
        'es': `${siteUrl}/es/evento/${event.slug || slug}`,
        'en': `${siteUrl}/en/evento/${event.slug || slug}`,
      },
    },
    
    robots: {
      index: event.status !== 'cancelled' && event.status !== 'draft',
      follow: true,
      nocache: false,
      googleBot: {
        index: event.status !== 'cancelled' && event.status !== 'draft',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    
    other: {
      'msapplication-TileColor': '#156634',
      'theme-color': '#156634',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'format-detection': 'telephone=no',
      // Event specific
      'event:start_date': event.event_date,
      'event:location': event.location || '',
      'event:category': event.category || '',
    },
  }
}

// Gerar JSON-LD schema para o evento
export function generateEventSchema(event: EventForSEO) {
  const canonicalUrl = `${siteUrl}/evento/${event.slug || event.id}`
  
  const startDateTime = event.start_time 
    ? `${event.event_date}T${event.start_time}:00` 
    : `${event.event_date}T00:00:00`
  
  const endDateTime = event.end_time 
    ? `${event.event_date}T${event.end_time}:00` 
    : undefined

  const cleanDescription = stripHtml(event.description).substring(0, 300)

  return {
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
      }
    },
    ...(event.organizer && {
      "organizer": {
        "@type": "Organization",
        "name": event.organizer.fantasy_name || event.organizer.company_name || "Organizador"
      }
    }),
    "inLanguage": event.language === "es" ? "es" : event.language === "en" ? "en" : "pt-BR"
  }
}

