import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2]

export async function middleware(request: NextRequest) {
  // Sempre retorna uma resposta válida, mesmo em caso de erro
  let response = NextResponse.next({ request })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Se não houver variáveis de ambiente, apenas continua
    if (!supabaseUrl || !supabaseAnonKey) {
      return response
    }

    // Criar response antes de criar o cliente (importante para cookies)
    response = NextResponse.next({ request })

    // Criar cliente Supabase para gerenciar sessão e cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options?: CookieOptions) {
            // Atualizar cookies na response
            response.cookies.set(name, value, options)
          },
          remove(name: string, options?: CookieOptions) {
            // Remover cookies da response
            response.cookies.set(name, "", {
              ...options,
              maxAge: 0,
            })
          },
        },
      }
    )

    // IMPORTANTE: Chamar getUser() para atualizar tokens/cookies automaticamente
    // Isso é necessário para renovar tokens expirados e manter a sessão ativa
    // No Edge Runtime, essa chamada pode falhar, então sempre capturamos erros
    // Se falhar, os cookies já foram configurados e a sessão será verificada nas páginas
    try {
      await supabase.auth.getUser()
    } catch {
      // Ignora erros silenciosamente - a aplicação continua funcionando
      // A verificação de autenticação será feita nas páginas se necessário
    }

    // IMPORTANTE: Sempre retornar a response que foi passada para o createServerClient
    // Isso garante que os cookies sejam preservados corretamente
    return response
  } catch (error) {
    // Qualquer erro inesperado: retorna response padrão
    // Isso garante que a aplicação nunca quebre por causa do middleware
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
