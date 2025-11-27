import { NextResponse, type NextRequest } from "next/server"

export const config = {
  // Matcher para excluir apenas assets estáticos e API routes
  // Nota: Middleware automaticamente usa Edge Runtime no Next.js 14
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)',
  ],
}

export function middleware(request: NextRequest) {
  // Middleware ultra-leve para Edge Runtime
  // NUNCA fazer chamadas HTTP ou operações pesadas aqui
  
  const { pathname } = request.nextUrl
  
  // Rotas protegidas que exigem autenticação
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/my-account')
  
  // Se não for rota protegida, apenas continuar
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // Verificar se há cookie de autenticação do Supabase
  // Nome padrão: sb-<project-ref>-auth-token
  const authCookie = request.cookies.getAll().find(
    cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )
  
  // Se tentando acessar rota protegida sem cookie de auth
  if (!authCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preservar URL original para redirect após login
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  
  // Continuar normalmente
  return NextResponse.next()
}
