import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Verificar se estamos no browser
  if (typeof window === 'undefined') {
    throw new Error('createClient() can only be called in the browser. Use createClient() from lib/supabase/server.ts for server-side code.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
