import { ImageResponse } from 'next/og'
import { getEventBySlug } from '@/lib/supabase/events'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await getEventBySlug(params.slug)
    
    if (!event) {
      return new Response('Event not found', { status: 404 })
    }

    const eventDate = new Date(event.event_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

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
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
import { getEventBySlug } from '@/lib/supabase/events'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await getEventBySlug(params.slug)
    
    if (!event) {
      return new Response('Event not found', { status: 404 })
    }

    const eventDate = new Date(event.event_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

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
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
import { getEventBySlug } from '@/lib/supabase/events'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await getEventBySlug(params.slug)
    
    if (!event) {
      return new Response('Event not found', { status: 404 })
    }

    const eventDate = new Date(event.event_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

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
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
import { getEventBySlug } from '@/lib/supabase/events'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await getEventBySlug(params.slug)
    
    if (!event) {
      return new Response('Event not found', { status: 404 })
    }

    const eventDate = new Date(event.event_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

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
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
import { getEventBySlug } from '@/lib/supabase/events'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await getEventBySlug(params.slug)
    
    if (!event) {
      return new Response('Event not found', { status: 404 })
    }

    const eventDate = new Date(event.event_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

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
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}


