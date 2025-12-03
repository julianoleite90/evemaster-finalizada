import { Metadata } from 'next'

interface EventOrganizer {
  company_name?: string
  fantasy_name?: string
}

interface EventData {
  id: string
  name: string
  slug?: string
  description?: string
  category?: string
  event_date: string
  start_time?: string
  location?: string
  address?: string
  city?: string
  state?: string
  country?: string
  banner_url?: string
  status?: string
  language?: string
  difficulty_level?: string
  race_type?: string
  major_access?: boolean
  organizer?: EventOrganizer
}

const SITE_URL = 'https://evemaster.app'
const SITE_NAME = 'EveMaster'

/**
 * Gera metadata otimizada para SEO de páginas de evento
 * @param event - Dados do evento (pode ser null se não encontrado)
 * @param slug - Slug do evento para URL
 * @returns Metadata do Next.js
 */
export function generateEventMetadata(event: EventData | null, slug: string): Metadata {
  // Metadata padrão para evento não encontrado
  if (!event) {
    return {
      title: 'Evento não encontrado | EveMaster',
      description: 'O evento que você está procurando não foi encontrado. Explore outros eventos esportivos na EveMaster.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  // Limpar descrição HTML
  const cleanDescription = event.description
    ?.replace(/<[^>]+>/g, '')
    ?.replace(/\s+/g, ' ')
    ?.trim()
    ?.substring(0, 160) || ''

  // Formatar data do evento
  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  // Construir localização
  const locationParts = [event.city, event.state].filter(Boolean)
  const location = locationParts.join(', ') || event.location || ''

  // Título otimizado para SEO
  const title = `${event.name} - ${formattedDate}${location ? ` | ${location}` : ''}`
  
  // Descrição otimizada
  const description = cleanDescription || 
    `Inscreva-se para ${event.name}${location ? ` em ${location}` : ''}. ${formattedDate}. Garanta sua vaga!`

  // URL canônica
  const canonicalUrl = `${SITE_URL}/evento/${event.slug || slug}`

  // Imagem Open Graph
  const ogImage = event.banner_url || `${SITE_URL}/api/og/evento/${event.slug || slug}`

  // Keywords baseadas no evento
  const keywords = [
    event.name,
    event.category,
    event.race_type,
    event.difficulty_level,
    event.city,
    event.state,
    'evento esportivo',
    'corrida',
    'inscrição',
    'EveMaster'
  ].filter(Boolean).join(', ')

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: event.name,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: event.name,
        },
      ],
      locale: event.language === 'es' ? 'es_AR' : event.language === 'en' ? 'en_US' : 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description,
      images: [ogImage],
      creator: '@evemasterapp',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'event:start_date': event.event_date,
      'event:location': location,
      'event:category': event.category || '',
    },
  }
}

export default generateEventMetadata

