import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { apiLogger as logger } from '@/lib/utils/logger'

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

    // Buscar links do afiliado
    const { data: links, error: linksError } = await supabase
      .from('affiliate_links')
      .select(`
        *,
        event:events(
          id,
          name,
          slug,
          event_date,
          banner_image_url
        )
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    if (linksError) {
      logger.error('Erro ao buscar links:', linksError)
      return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 })
    }

    return NextResponse.json({ links: links || [] })
  } catch (error: any) {
    logger.error('Erro ao buscar links:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, title, utm_source, utm_medium, utm_campaign, utm_term, utm_content, src } = body

    if (!event_id) {
      return NextResponse.json({ error: 'event_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, referral_code')
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
    }

    // Verificar se o afiliado tem comissão configurada para este evento
    const { data: commission } = await supabase
      .from('event_affiliate_commissions')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('event_id', event_id)
      .single()

    if (!commission) {
      return NextResponse.json(
        { error: 'Você não é afiliado deste evento' },
        { status: 403 }
      )
    }

    // Buscar dados do evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, slug, name')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    // Gerar código curto único
    let shortCode: string
    let attempts = 0
    do {
      shortCode = crypto.randomBytes(4).toString('hex').toUpperCase()
      const { data: existing } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('short_code', shortCode)
        .single()
      
      if (!existing) break
      attempts++
      if (attempts > 10) {
        // Fallback para código mais longo
        shortCode = crypto.randomBytes(6).toString('hex').toUpperCase()
        break
      }
    } while (true)

    // Construir URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evemaster.com'
    const eventUrl = event.slug 
      ? `${baseUrl}/evento/${event.slug}`
      : `${baseUrl}/evento/${event_id}`

    // Construir parâmetros
    const params = new URLSearchParams()
    params.append('ref', affiliate.referral_code)
    
    if (utm_source) params.append('utm_source', utm_source)
    if (utm_medium) params.append('utm_medium', utm_medium)
    if (utm_campaign) params.append('utm_campaign', utm_campaign)
    if (utm_term) params.append('utm_term', utm_term)
    if (utm_content) params.append('utm_content', utm_content)
    if (src) params.append('src', src)

    const fullUrl = `${eventUrl}?${params.toString()}`
    const shortUrl = `${baseUrl}/ref/${shortCode}`

    // Criar link
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .insert({
        affiliate_id: affiliate.id,
        event_id: event_id,
        short_code: shortCode,
        original_url: eventUrl,
        full_url: fullUrl,
        title: title || `Link para ${event.name}`,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        src: src || null,
      })
      .select(`
        *,
        event:events(
          id,
          name,
          slug,
          event_date
        )
      `)
      .single()

    if (linkError) {
      logger.error('Erro ao criar link:', linkError)
      return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        short_url: shortUrl,
      },
    })
  } catch (error: any) {
    logger.error('Erro ao criar link:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

