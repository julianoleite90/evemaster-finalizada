import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

type CookieStore = Awaited<ReturnType<typeof cookies>>
type CookieOptions = Parameters<CookieStore["set"]>[2]

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
