import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Se não houver variáveis, apenas continua
    if (!supabaseUrl || !supabaseAnonKey) {
      return response
    }

    // Criar cliente Supabase APENAS para gerenciar cookies
    // Não fazemos chamadas HTTP aqui para evitar problemas no Edge Runtime
    createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options?: CookieOptions) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options?: CookieOptions) {
            response.cookies.set(name, "", {
              ...options,
              maxAge: 0,
            })
          },
        },
      }
    )

    // Apenas retorna a response com cookies gerenciados
    // A verificação de autenticação será feita nas páginas
    return response
  } catch (error) {
    // Qualquer erro: retorna response padrão
    return response
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
