import { Metadata } from 'next'
import { getEventBySlug } from '@/lib/supabase/events-server'

type Props = {
  params: { slug: string }
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
  const event = await getEventBySlug(params.slug).catch(() => null)

  const title = event
    ? `${event.name} | EveMaster plataforma para eventos esportivos`
    : defaultTitle

  const description =
    stripHtml(event?.description) || event?.summary || defaultDescription

  const ogImage =
    event?.banner_url || `${siteUrl}/images/logo/logo.png`
  const canonicalUrl = event?.slug
    ? `${siteUrl}/evento/${event.slug}`
    : siteUrl

  return {
    title,
    description,
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
          alt: event?.name || 'EveMaster',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
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

