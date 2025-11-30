import { Metadata } from 'next'
import { getEventBySlug } from '@/lib/supabase/events-server'

type Props = {
  params: Promise<{ slug: string }> | { slug: string }
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.com.br'
const defaultTitle = 'EveMaster - Plataforma para Eventos Esportivos'
const defaultDescription =
  'Encontre e gerencie eventos esportivos com a EveMaster, plataforma completa de ingressos e inscrições.'

const stripHtml = (value?: string) =>
  value
    ? value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : ''

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Suportar tanto Promise quanto objeto direto (compatibilidade Next.js 14/15)
  const resolvedParams = 'then' in params ? await params : params
  const slug = resolvedParams.slug
  
  let event = null
  
  try {
    event = await getEventBySlug(slug)
    
    // Debug: verificar se o evento foi encontrado
    if (!event) {
      console.warn(`[Metadata] Evento não encontrado para slug: ${slug}`)
    } else {
      console.log(`[Metadata] Evento encontrado: ${event.name} (slug: ${slug})`)
    }
  } catch (error) {
    console.error('[Metadata] Erro ao buscar evento para metadata:', error)
    // Continua com valores padrão
  }

  // Se não encontrou o evento, usar valores padrão
  if (!event || !event.name) {
    console.warn(`[Metadata] Usando valores padrão para slug: ${slug}`)
    return {
      title: defaultTitle,
      description: defaultDescription,
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        url: `${siteUrl}/evento/${slug}`,
        siteName: 'EveMaster',
        images: [
          {
            url: `${siteUrl}/images/logo/logo.png`,
            width: 1200,
            height: 630,
            alt: 'EveMaster',
          },
        ],
        locale: 'pt_BR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: [`${siteUrl}/images/logo/logo.png`],
      },
      alternates: {
        canonical: `${siteUrl}/evento/${slug}`,
      },
    }
  }

  // Título do evento (sem o sufixo genérico para melhor compartilhamento)
  const eventTitle = event.name.trim() || defaultTitle
  const title = eventTitle

  const description =
    event?.description || event?.summary
      ? stripHtml(event.description || event.summary).substring(0, 200) // Limitar a 200 caracteres
      : defaultDescription

  // Usar a API de OG image que gera dinamicamente com o nome do evento
  const eventSlug = event.slug || slug
  const ogImage = `${siteUrl}/api/og/evento/${eventSlug}`
    
  const canonicalUrl = `${siteUrl}/evento/${eventSlug}`

  console.log(`[Metadata] Gerando metadata para evento: ${eventTitle}`)
  console.log(`[Metadata] OG Image URL: ${ogImage}`)

  return {
    title: `${title} | EveMaster`,
    description,
    openGraph: {
      title: eventTitle, // Título do evento sem sufixo para melhor compartilhamento
      description,
      url: canonicalUrl,
      siteName: 'EveMaster',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: eventTitle,
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: eventTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

