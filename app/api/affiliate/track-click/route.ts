import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { link_id } = body

    if (!link_id) {
      return NextResponse.json({ error: 'link_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar dados do link
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, affiliate_id, event_id')
      .eq('id', link_id)
      .eq('is_active', true)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 })
    }

    // Capturar informações do request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null
    const userAgent = request.headers.get('user-agent') || null
    const referer = request.headers.get('referer') || null

    // Inserir clique
    const { error: clickError } = await supabase
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

    if (clickError) {
      logger.error('Erro ao registrar clique:', clickError)
      // Não falhar a requisição, apenas logar
    } else {
      // Atualizar contador de cliques
      try {
        const { error: rpcError } = await supabase.rpc('increment_link_clicks', { link_id: link.id })
        if (rpcError) {
          // Fallback: buscar valor atual e incrementar
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
        }
      } catch (err) {
        // Fallback: buscar valor atual e incrementar em caso de erro
        try {
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
        } catch (fallbackErr) {
          // Ignorar erro no fallback
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Erro ao rastrear clique:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

