import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

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

  // Rastrear clique ANTES de redirecionar
  try {
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      null
    const userAgent = headersList.get('user-agent') || null
    const referer = headersList.get('referer') || null

    // Inserir clique
    await supabase
      .from('affiliate_link_clicks')
      .insert({
        link_id: link.id,
        affiliate_id: link.affiliate_id,
        event_id: link.event_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        clicked_at: new Date().toISOString(),
      })

    // Incrementar contador de cliques no link
    const { data: currentLink } = await supabase
      .from('affiliate_links')
      .select('click_count')
      .eq('id', link.id)
      .single()
    
    if (currentLink) {
      await supabase
        .from('affiliate_links')
        .update({ click_count: (currentLink.click_count || 0) + 1 })
        .eq('id', link.id)
    }
  } catch (err) {
    // Não bloquear o redirect se falhar o tracking
    console.error('Erro ao rastrear clique:', err)
  }

  // Redirecionar para a URL completa
  redirect(link.full_url)
}
