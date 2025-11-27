import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma URL de evento com UUID
  const eventoMatch = pathname.match(/^\/evento\/([^\/]+)$/)
  
  if (eventoMatch) {
    const slug = eventoMatch[1]
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    // Se é um UUID, tentar buscar o slug
    if (uuidRegex.test(slug)) {
      try {
        const supabase = await createClient()
        
        const { data: event } = await supabase
          .from('events')
          .select('slug')
          .eq('id', slug)
          .single()
        
        if (event && event.slug) {
          // Redirecionar para a URL com slug
          const url = request.nextUrl.clone()
          url.pathname = `/evento/${event.slug}`
          return NextResponse.redirect(url, 301) // Redirect permanente
        }
      } catch (error) {
        console.error('Erro ao buscar slug para redirecionamento:', error)
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/evento/:path*'
  ]
}
