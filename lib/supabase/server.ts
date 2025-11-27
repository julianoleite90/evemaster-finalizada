import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

type CookieStore = Awaited<ReturnType<typeof cookies>>
type CookieOptions = Parameters<CookieStore["set"]>[2]

export async function createClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set SUPABASE_URL/SUPABASE_ANON_KEY (or the NEXT_PUBLIC_ equivalents).'
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
