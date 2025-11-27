import { NextResponse, type NextRequest } from "next/server"

export const config = {
  // Declaração explícita do runtime para Vercel
  runtime: 'edge',
  // Matcher otimizado - apenas rotas que realmente precisam de middleware
  matcher: [
    '/dashboard/:path*',
    '/my-account/:path*',
  ],
}

export function middleware(request: NextRequest) {
  // Middleware ultra-leve para Edge Runtime
  // NUNCA fazer chamadas HTTP ou operações pesadas aqui
  
  const { pathname } = request.nextUrl
  
  // Verificar se há cookie de autenticação do Supabase
  // Nome padrão: sb-<project-ref>-auth-token
  const authCookie = request.cookies.getAll().find(
    cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )
  
  // Rotas protegidas que exigem autenticação
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/my-account')
  
  // Se tentando acessar rota protegida sem cookie de auth
  if (isProtectedRoute && !authCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preservar URL original para redirect após login
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  
  // Continuar normalmente
  return NextResponse.next()
}
