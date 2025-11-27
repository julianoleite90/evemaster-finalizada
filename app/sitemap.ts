import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://evemaster.com.br'
  
  // URLs estáticas
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termos-de-uso`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // URLs dinâmicas dos eventos
  let eventUrls: MetadataRoute.Sitemap = []
  
  try {
    const supabase = createClient()
    const { data: events } = await supabase
      .from('events')
      .select('slug, updated_at, created_at')
      .not('slug', 'is', null)
      .eq('draft', false) // Apenas eventos publicados
      .order('created_at', { ascending: false })

    if (events) {
      eventUrls = events.map((event) => ({
        url: `${baseUrl}/evento/${event.slug}`,
        lastModified: new Date(event.updated_at || event.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error generating sitemap for events:', error)
  }

  return [...staticUrls, ...eventUrls]
}