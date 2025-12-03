import { NextResponse, type NextRequest } from "next/server"

export const config = {
  // Apenas rotas específicas que precisam de proteção
  // IMPORTANTE: Next.js 14 middleware já roda no Edge Runtime automaticamente
  matcher: [
    '/dashboard/:path*',
    '/my-account/:path*',
  ],
}

/**
 * Verifica se o cookie de autenticação do Supabase está presente e não expirado
 * Nome do cookie: sb-<project-ref>-auth-token (pode ter sufixos .0, .1, etc)
 */
function validateAuthCookie(cookies: { name: string; value: string }[]): {
  hasAuth: boolean
  isExpired: boolean
} {
  const authCookie = cookies.find(
    cookie => cookie.name.startsWith('sb-') && (
      cookie.name.endsWith('-auth-token') ||
      cookie.name.includes('-auth-token.')
    )
  )
  
  if (!authCookie || !authCookie.value) {
    return { hasAuth: false, isExpired: false }
  }
  
  // Tentar decodificar o token JWT para verificar expiração
  try {
    // O cookie do Supabase pode estar em formato base64 JSON
    const tokenParts = authCookie.value.split('.')
    
    if (tokenParts.length >= 2) {
      // É um JWT - verificar expiração do payload
      const payload = JSON.parse(atob(tokenParts[1]))
      const exp = payload.exp
      
      if (exp) {
        const now = Math.floor(Date.now() / 1000)
        if (exp < now) {
          return { hasAuth: true, isExpired: true }
        }
      }
    } else {
      // Pode ser o formato chunk do Supabase SSR - tentar parsear como JSON
      const decoded = decodeURIComponent(authCookie.value)
      try {
        const parsed = JSON.parse(decoded)
        if (parsed.expires_at) {
          const expiresAt = new Date(parsed.expires_at).getTime()
          if (expiresAt < Date.now()) {
            return { hasAuth: true, isExpired: true }
          }
        }
      } catch {
        // Se não conseguir parsear, considerar válido (deixa o Supabase validar)
      }
    }
  } catch {
    // Se não conseguir decodificar, considerar válido (deixa o Supabase validar server-side)
  }
  
  return { hasAuth: true, isExpired: false }
}

/**
 * Determina a URL de login apropriada baseada na rota
 */
function getLoginUrl(pathname: string): string {
  if (pathname.startsWith('/dashboard/organizer')) {
    return '/login/organizer'
  }
  if (pathname.startsWith('/dashboard/affiliate')) {
    return '/login/affiliate'
  }
  if (pathname.startsWith('/dashboard/admin')) {
    return '/login/admin'
  }
  if (pathname.startsWith('/dashboard/running-club')) {
    return '/login/organizer'
  }
  // Para /my-account ou outras rotas, usar login geral
  return '/login'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookies = request.cookies.getAll()
  
  // Validar cookie de autenticação
  const { hasAuth, isExpired } = validateAuthCookie(cookies)
  
  // Se não tem cookie de auth ou está expirado, redirecionar para login
  if (!hasAuth || isExpired) {
    const url = request.nextUrl.clone()
    url.pathname = getLoginUrl(pathname)
    url.searchParams.set('from', pathname)
    
    if (isExpired) {
      url.searchParams.set('expired', '1')
    }
    
    return NextResponse.redirect(url)
  }
  
  // Adicionar headers de segurança
  const response = NextResponse.next()
  
  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevenir MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Prevenir XSS (navegadores modernos)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}
