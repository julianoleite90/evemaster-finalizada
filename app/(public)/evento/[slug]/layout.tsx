import { Metadata } from 'next'
import { getEventBySlug } from '@/lib/supabase/events-server'
import { generateEventMetadata } from '@/lib/seo/event-metadata'
import { eventLogger as logger } from '@/lib/utils/logger'

// Forçar renderização dinâmica - NÃO CACHEAR
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ slug: string }> | { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Suportar tanto Promise quanto objeto direto (compatibilidade Next.js 14/15)
  const resolvedParams = 'then' in params ? await params : params
  const slug = resolvedParams.slug
  
  logger.log('[SEO] Gerando metadata para slug:', slug)
  
  let event = null
  
  try {
    event = await getEventBySlug(slug)
    logger.log('[SEO] Evento encontrado:', event?.name || 'NULL')
  } catch (error: any) {
    logger.error('[SEO] Erro ao buscar evento:', error?.message)
  }
  
  // Usar a função otimizada de geração de metadata
  return generateEventMetadata(event, slug)
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Preconnect para domínios externos - acelera carregamento */}
      <link rel="preconnect" href="https://maps.google.com" />
      <link rel="preconnect" href="https://tile.openstreetmap.org" />
      <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
      <link rel="dns-prefetch" href="https://maps.google.com" />
      <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
      {children}
    </>
  )
}
