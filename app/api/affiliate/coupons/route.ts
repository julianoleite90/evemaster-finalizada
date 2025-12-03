import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Buscar cupons do afiliado
    const { data: coupons, error: couponsError } = await supabase
      .from('affiliate_coupons')
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

    if (couponsError) {
      logger.error('Erro ao buscar cupons:', couponsError)
      return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 })
    }

    return NextResponse.json({ coupons: coupons || [] })
  } catch (error: any) {
    logger.error('Erro ao buscar cupons:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, code, discount_percentage, discount_amount, max_uses, expires_at, is_active } = body

    if (!event_id || !code) {
      return NextResponse.json(
        { error: 'Evento e código do cupom são obrigatórios' },
        { status: 400 }
      )
    }

    if (!discount_percentage && !discount_amount) {
      return NextResponse.json(
        { error: 'Informe o valor do desconto (percentual ou fixo)' },
        { status: 400 }
      )
    }

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

    // Verificar se o código já existe
    const { data: existingCoupon } = await supabase
      .from('affiliate_coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Este código de cupom já existe' },
        { status: 400 }
      )
    }

    // Criar cupom
    const { data: coupon, error: couponError } = await supabase
      .from('affiliate_coupons')
      .insert({
        event_id,
        affiliate_id: affiliate.id,
        code: code.toUpperCase(),
        discount_percentage: discount_percentage || null,
        discount_amount: discount_amount || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        is_active: is_active !== false,
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

    if (couponError) {
      logger.error('Erro ao criar cupom:', couponError)
      return NextResponse.json(
        { error: 'Erro ao criar cupom', details: couponError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      coupon,
    })
  } catch (error: any) {
    logger.error('Erro ao criar cupom:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

