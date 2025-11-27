import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2]

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    return NextResponse.next({ request })
  }

  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name: string, options?: CookieOptions) {
          supabaseResponse.cookies.set(name, "", {
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

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
      console.error('Error getting user in middleware:', authError)
      // Continue sem usuário se houver erro
    } else {
      user = authUser
    }
  } catch (error) {
    console.error('Unexpected error in middleware getUser:', error)
    // Continue sem usuário se houver erro inesperado
  }

  // Nota: A criação do usuário em public.users é feita via trigger no banco
  // ou em server components/API routes para evitar problemas no Edge Runtime

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/') &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you might be causing the browser to delete the cookies
  // set by Supabase Auth, which will make your users randomly get logged out.

  return supabaseResponse
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
