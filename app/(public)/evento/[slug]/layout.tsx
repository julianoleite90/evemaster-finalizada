import { Metadata } from 'next'
import { getEventBySlug } from '@/lib/supabase/events-server'

// Forçar renderização dinâmica - NÃO CACHEAR
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ slug: string }> | { slug: string }
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.app'
const defaultTitle = 'EveMaster - Plataforma para Eventos Esportivos'
const defaultDescription =
  'Encontre e gerencie eventos esportivos com a EveMaster, plataforma completa de ingressos e inscrições.'

const stripHtml = (value?: string) =>
  value
    ? value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : ''

// Função para garantir que a URL seja absoluta
const ensureAbsoluteUrl = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null
  
  const trimmedUrl = url.trim()
  
  // Se já é uma URL absoluta (começa com http:// ou https://), retornar como está
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl
  }
  
  // Se é uma URL relativa, converter para absoluta usando o siteUrl
  if (trimmedUrl.startsWith('/')) {
    return `${siteUrl}${trimmedUrl}`
  }
  
  // Se não começa com /, assumir que é relativa e adicionar /
  return `${siteUrl}/${trimmedUrl}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Suportar tanto Promise quanto objeto direto (compatibilidade Next.js 14/15)
  const resolvedParams = 'then' in params ? await params : params
  const slug = resolvedParams.slug
  
  console.log('[Metadata] ===== INÍCIO generateMetadata =====')
  console.log('[Metadata] Slug recebido:', slug)
  
  let event = null
  
  try {
    console.log('[Metadata] Chamando getEventBySlug...')
    event = await getEventBySlug(slug)
    console.log('[Metadata] Resultado de getEventBySlug:', event ? {
      id: event.id,
      name: event.name,
      slug: event.slug,
      status: event.status,
      hasBanner: !!event.banner_url,
      banner_url: event.banner_url
    } : 'NULL - EVENTO NÃO ENCONTRADO')
  } catch (error: any) {
    console.error('[Metadata] ERRO ao buscar evento:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    })
    // Continua com valores padrão se houver erro
  }
  
  if (!event) {
    console.error(`[Metadata] ⚠️ EVENTO É NULL para slug: ${slug}`)
    console.error('[Metadata] Isso significa que getEventBySlug retornou null')
    console.error('[Metadata] Verifique: 1) Se o slug está correto 2) Se o evento existe 3) Se RLS permite leitura')
  } else {
    console.log('[Metadata] ✅ Evento encontrado, gerando meta tags...')
  }

  // Se não encontrou o evento ou não tem nome, usar valores padrão
  if (!event || !event.name || !event.name.trim()) {
    return {
      title: {
        absolute: defaultTitle,
      },
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

  // Título do evento
  const eventTitle = event.name.trim()

  const description =
    event?.description || event?.summary
      ? stripHtml(event.description || event.summary).substring(0, 200) // Limitar a 200 caracteres
      : defaultDescription

  // USAR O BANNER DO EVENTO como imagem OG (se existir)
  // Garantir que o banner_url seja uma URL absoluta válida
  const bannerUrl = ensureAbsoluteUrl(event.banner_url)
  const ogImage = bannerUrl 
    ? bannerUrl 
    : `${siteUrl}/api/og/evento/${event.slug || slug}`
    
  const canonicalUrl = `${siteUrl}/evento/${event.slug || slug}`
  
  // Debug: log para verificar o que está sendo usado (sempre logar em produção também para debug)
  console.log('[Event Metadata - generateMetadata]', {
    slug,
    eventName: eventTitle,
    hasBanner: !!event.banner_url,
    bannerUrl: event.banner_url,
    normalizedBannerUrl: bannerUrl,
    ogImage,
    canonicalUrl,
  })

  return {
    title: {
      absolute: eventTitle, // TÍTULO DO EVENTO (sem sufixo do site, sobrescreve completamente o layout pai)
    },
    description,
    openGraph: {
      title: eventTitle, // TÍTULO DO EVENTO
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
      title: eventTitle, // TÍTULO DO EVENTO
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

