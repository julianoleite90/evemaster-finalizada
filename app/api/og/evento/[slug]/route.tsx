import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { apiLogger as logger } from '@/lib/utils/logger'

export const runtime = 'edge'

// Função para buscar evento diretamente no Edge Runtime (sem usar cookies)
async function getEventBySlugEdge(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Criar cliente direto do Supabase (sem SSR/cookies) para Edge Runtime
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Verificar se é UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (uuidRegex.test(slug)) {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', slug)
      .single()

    if (error) return null
    return event
  } else {
    // Buscar por slug
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !events || events.length === 0) return null
    return events[0]
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Suportar tanto Promise quanto objeto direto (compatibilidade Next.js 14/15)
    const resolvedParams = 'then' in params ? await params : params
    const slug = resolvedParams.slug
    
    let event = null
    try {
      event = await getEventBySlugEdge(slug)
    } catch (error: any) {
      // Se o erro for "not found", retornar 404
      if (error?.code === 'PGRST116' || error?.message?.includes('not found')) {
        return new Response('Event not found', { status: 404 })
      }
      // Para outros erros, logar e retornar erro genérico
      logger.error('[OG Image] Erro ao buscar evento:', error)
      return new Response('Failed to generate image', { status: 500 })
    }
    
    if (!event || !event.name) {
      return new Response('Event not found', { status: 404 })
    }

    // Parse a data no formato YYYY-MM-DD como data local (não UTC)
    let eventDate = 'Data a definir'
    if (event.event_date) {
      try {
        const [year, month, day] = event.event_date.split('-').map(Number)
        const date = new Date(year, month - 1, day) // month é 0-indexed
        eventDate = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch (error) {
        // Se houver erro ao parsear a data, usar a string original
        eventDate = event.event_date
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#156634',
            backgroundImage: 'linear-gradient(45deg, #156634 0%, #1a7a3a 100%)',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0)',
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center',
              zIndex: 1,
            }}
          >
            {/* Event Name */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                lineHeight: 1.2,
                maxWidth: '800px',
              }}
            >
              {event.name}
            </h1>
            
            {/* Event Details */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                marginBottom: '30px',
                fontSize: '24px',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📅 {eventDate}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📍 {event.location || 'Local a definir'}
              </div>
            </div>
            
            {/* Category Badge */}
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '20px',
                color: 'white',
                marginBottom: '40px',
              }}
            >
              {event.category === 'corrida' ? 'Corrida' : event.category}
            </div>
            
            {/* EveMaster Logo/Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              🏃‍♂️ EveMaster
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    logger.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}


