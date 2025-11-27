import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2]

export async function middleware(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      // Se não houver variáveis, apenas continua sem autenticação
      return NextResponse.next({ request })
    }

    const supabaseResponse = NextResponse.next({
      request,
    })

    let supabase
    try {
      supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options?: CookieOptions) {
              try {
                supabaseResponse.cookies.set(name, value, options)
              } catch (error) {
                // Ignora erros ao setar cookies
              }
            },
            remove(name: string, options?: CookieOptions) {
              try {
                supabaseResponse.cookies.set(name, "", {
                  ...options,
                  maxAge: 0,
                })
              } catch (error) {
                // Ignora erros ao remover cookies
              }
            },
          },
        }
      )
    } catch (error) {
      // Se houver erro ao criar cliente, apenas continua
      console.error('Error creating Supabase client in middleware:', error)
      return NextResponse.next({ request })
    }

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    let user = null
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('Error getting user in middleware:', authError)
        }
        // Continue sem usuário se houver erro
      } else {
        user = authUser
      }
    } catch (error) {
      // Se houver erro inesperado, apenas continua sem usuário
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected error in middleware getUser:', error)
      }
    }

    // Verifica se precisa redirecionar para login
    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/register') &&
      !request.nextUrl.pathname.startsWith('/') &&
      request.nextUrl.pathname.startsWith('/dashboard')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse
  } catch (error) {
    // Se houver qualquer erro no middleware, apenas continua a requisição
    // Isso evita que erros quebrem toda a aplicação
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware error:', error)
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
