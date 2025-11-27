import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

type CookieStore = Awaited<ReturnType<typeof cookies>>
type CookieOptions = Parameters<CookieStore["set"]>[2]

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Em vez de lançar erro, loga e retorna um cliente com valores vazios
    // Isso evita crashes em produção
    console.error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
    // Retorna um cliente com valores vazios para evitar crash
    const cookieStore = await cookies()
    return createServerClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options?: CookieOptions) {
            try {
              cookieStore.set(name, value, options)
            } catch {
              // ignore in server components without writable cookies
            }
          },
          remove(name: string, options?: CookieOptions) {
            try {
              cookieStore.set(name, "", {
                ...options,
                maxAge: 0,
              })
            } catch {
              // ignore in server components without writable cookies
            }
          },
        },
      }
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // ignore in server components without writable cookies
          }
        },
        remove(name: string, options?: CookieOptions) {
          try {
            cookieStore.set(name, "", {
              ...options,
              maxAge: 0,
            })
          } catch {
            // ignore in server components without writable cookies
          }
        },
      },
    }
  )
}
