import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
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

    // Buscar comissões do afiliado
    const { data: commissions, error: commissionsError } = await supabase
      .from('event_affiliate_commissions')
      .select('event_id, commission_type, commission_value')
      .eq('affiliate_id', affiliate.id)

    if (commissionsError) {
      logger.error('Erro ao buscar comissões:', commissionsError)
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
    }

    if (!commissions || commissions.length === 0) {
      logger.log(`[Affiliate Events] Nenhuma comissão encontrada para afiliado ${affiliate.id}`)
      return NextResponse.json({ events: [] })
    }

    logger.log(`[Affiliate Events] Encontradas ${commissions.length} comissões para afiliado ${affiliate.id}`)

    // Buscar eventos separadamente
    const eventIds = commissions.map(c => c.event_id)
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id, name, slug, event_date, banner_image_url, description, location, organizer_id')
      .in('id', eventIds)

    if (eventsError) {
      logger.error('Erro ao buscar eventos:', eventsError)
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
    }

    // Buscar organizadores dos eventos
    const organizerIds = [...new Set(eventsData?.map(e => e.organizer_id).filter(Boolean) || [])]
    let organizersMap: Record<string, any> = {}
    
    if (organizerIds.length > 0) {
      const { data: organizersData, error: organizersError } = await supabase
        .from('organizers')
        .select('id, company_name, fantasy_name')
        .in('id', organizerIds)

      if (!organizersError && organizersData) {
        organizersMap = organizersData.reduce((acc, org) => {
          acc[org.id] = org
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Combinar dados
    const events = commissions
      .map(comm => {
        const event = eventsData?.find(e => e.id === comm.event_id)
        if (!event) return null

        return {
          ...event,
          commission_type: comm.commission_type,
          commission_value: comm.commission_value,
          organizer: event.organizer_id && organizersMap[event.organizer_id] ? {
            id: organizersMap[event.organizer_id].id,
            company_name: organizersMap[event.organizer_id].company_name,
            fantasy_name: organizersMap[event.organizer_id].fantasy_name,
          } : null,
        }
      })
      .filter(Boolean) as any[]

    logger.log(`[Affiliate Events] Retornando ${events.length} eventos para afiliado ${affiliate.id}`)

    return NextResponse.json({ events })
  } catch (error: any) {
    logger.error('Erro ao buscar eventos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

