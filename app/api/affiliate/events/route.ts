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

    // Buscar eventos onde o afiliado tem comissão configurada
    const { data: commissions, error: commissionsError } = await supabase
      .from('event_affiliate_commissions')
      .select(`
        *,
        event:events(
          id,
          name,
          slug,
          event_date,
          banner_image_url,
          description,
          location,
          organizer:organizers(
            id,
            name
          )
        )
      `)
      .eq('affiliate_id', affiliate.id)

    if (commissionsError) {
      logger.error('Erro ao buscar eventos:', commissionsError)
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
    }

    // Formatar dados
    const events = commissions?.map(comm => ({
      ...comm.event,
      commission_type: comm.commission_type,
      commission_value: comm.commission_value,
    })) || []

    return NextResponse.json({ events })
  } catch (error: any) {
    logger.error('Erro ao buscar eventos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

