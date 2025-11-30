import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RefRedirectPage({
  params,
  searchParams,
}: {
  params: { code: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const code = params.code

  // Buscar link pelo código curto
  const { data: link, error } = await supabase
    .from('affiliate_links')
    .select('full_url, id, affiliate_id, event_id')
    .eq('short_code', code)
    .eq('is_active', true)
    .single()

  if (error || !link) {
    // Se não encontrar, redirecionar para home
    redirect('/')
  }

  // Redirecionar para a URL completa
  // O tracking será feito via script no lado do cliente
  redirect(link.full_url)
}

