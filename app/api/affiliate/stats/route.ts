import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger as logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const linkId = searchParams.get('link_id')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
    }

    // Construir query base
    let linksQuery = supabase
      .from('affiliate_links')
      .select('id')
      .eq('affiliate_id', affiliate.id)

    if (eventId) {
      linksQuery = linksQuery.eq('event_id', eventId)
    }
    if (linkId) {
      linksQuery = linksQuery.eq('id', linkId)
    }

    const { data: links, error: linksError } = await linksQuery

    if (linksError) {
      logger.error('Erro ao buscar links:', linksError)
      return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
    }

    const linkIds = links?.map(l => l.id) || []

    // Buscar cliques (só se houver links)
    let clicks: any[] = []
    if (linkIds.length > 0) {
      let clicksQuery = supabase
        .from('affiliate_link_clicks')
        .select('*')
        .in('link_id', linkIds)

      if (eventId) {
        clicksQuery = clicksQuery.eq('event_id', eventId)
      }

      const { data: clicksData, error: clicksError } = await clicksQuery
      if (!clicksError) {
        clicks = clicksData || []
      } else {
        logger.error('Erro ao buscar cliques:', clicksError)
      }
    }

    // Buscar conversões (buscar todas do afiliado, não apenas as com link_id)
    let conversionsQuery = supabase
      .from('affiliate_conversions')
      .select(`
        *,
        registration:registrations(
          id,
          athlete:athletes(
            id,
            first_name,
            last_name
          )
        ),
        payment:payments(
          id,
          total_amount,
          affiliate_commission
        )
      `)
      .eq('affiliate_id', affiliate.id)

    if (eventId) {
      conversionsQuery = conversionsQuery.eq('event_id', eventId)
    }
    if (linkId) {
      conversionsQuery = conversionsQuery.eq('link_id', linkId)
    }
    // Se não especificou link_id, buscar todas as conversões do afiliado (com ou sem link)

    const { data: conversions, error: conversionsError } = await conversionsQuery

    if (conversionsError) {
      logger.error('Erro ao buscar conversões:', conversionsError)
    }

    // Processar dados
    const totalClicks = clicks.length || 0
    const totalConversions = conversions?.length || 0
    
    const totalRevenue = conversions?.reduce((sum, conv) => {
      return sum + (parseFloat(conv.payment?.total_amount || '0') || 0)
    }, 0) || 0

    const totalCommission = conversions?.reduce((sum, conv) => {
      return sum + (parseFloat(conv.payment?.affiliate_commission || '0') || 0)
    }, 0) || 0

    // Agrupar cliques por data
    const clicksByDateMap = new Map<string, number>()
    clicks.forEach(click => {
      const date = new Date(click.clicked_at).toISOString().split('T')[0]
      clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1)
    })
    const clicksByDate = Array.from(clicksByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Agrupar conversões por data
    const conversionsByDateMap = new Map<string, number>()
    conversions?.forEach(conv => {
      const date = new Date(conv.converted_at).toISOString().split('T')[0]
      conversionsByDateMap.set(date, (conversionsByDateMap.get(date) || 0) + 1)
    })
    const conversionsByDate = Array.from(conversionsByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Agrupar cliques por link
    const clicksByLinkMap = new Map<string, number>()
    clicks.forEach(click => {
      clicksByLinkMap.set(click.link_id, (clicksByLinkMap.get(click.link_id) || 0) + 1)
    })

    // Buscar dados dos links para incluir título
    const { data: linksData } = await supabase
      .from('affiliate_links')
      .select('id, title, short_code')
      .in('id', Array.from(clicksByLinkMap.keys()))

    const clicksByLink = Array.from(clicksByLinkMap.entries())
      .map(([link_id, count]) => {
        const link = linksData?.find(l => l.id === link_id)
        return {
          link_id,
          title: link?.title || 'Sem título',
          short_code: link?.short_code || '',
          clicks: count,
        }
      })
      .sort((a, b) => b.clicks - a.clicks)

    // Preparar dados de conversões (ocultar dados sensíveis)
    const conversionsData = conversions?.map(conv => ({
      id: conv.id,
      converted_at: conv.converted_at,
      conversion_value: conv.conversion_value,
      commission_earned: conv.commission_earned,
      athlete_name: conv.registration?.athlete
        ? `${conv.registration.athlete.first_name} ${conv.registration.athlete.last_name?.charAt(0) || ''}.`
        : 'N/A',
    })) || []

    return NextResponse.json({
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      total_revenue: totalRevenue,
      total_commission: totalCommission,
      conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0,
      clicks_by_date: clicksByDate,
      conversions_by_date: conversionsByDate,
      clicks_by_link: clicksByLink,
      conversions: conversionsData,
    })
  } catch (error: any) {
    logger.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

