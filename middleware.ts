import { NextResponse, type NextRequest } from "next/server"

export const config = {
  // Apenas rotas específicas que precisam de proteção
  // IMPORTANTE: Next.js 14 middleware já roda no Edge Runtime automaticamente
  matcher: [
    '/dashboard/:path*',
    '/my-account/:path*',
  ],
}

export function middleware(request: NextRequest) {
  // Middleware MÍNIMO para compatibilidade máxima com Edge Runtime
  const { pathname } = request.nextUrl
  
  // Verificar se há cookie de autenticação do Supabase
  // Nome do cookie: sb-<project-ref>-auth-token (pode ter sufixos .0, .1, etc)
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(
    cookie => cookie.name.startsWith('sb-') && (
      cookie.name.endsWith('-auth-token') ||
      cookie.name.includes('-auth-token.')
    )
  )
  
  // Se não tem cookie de auth, redirecionar para login
  if (!hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  
  // Tem auth, continuar
  return NextResponse.next()
}
