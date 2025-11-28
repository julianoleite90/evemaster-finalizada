import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, code, discount_percentage, discount_amount, affiliate_id, max_uses, expires_at, is_active } = body as {
      event_id: string
      code: string
      discount_percentage?: number | null
      discount_amount?: number | null
      affiliate_id?: string | null
      max_uses?: number | null
      expires_at?: string | null
      is_active: boolean
    }

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

    // Verificar se o usuário está autenticado e é organizador
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar organizador
    const { data: organizer, error: orgError } = await supabase
      .from('organizers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !organizer) {
      return NextResponse.json(
        { error: 'Organizador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o evento pertence ao organizador
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('organizer_id', organizer.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento não encontrado ou não pertence a você' },
        { status: 404 }
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

    // Verificar se affiliate_id é válido (se fornecido)
    if (affiliate_id && affiliate_id !== "") {
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('id', affiliate_id)
        .single()

      if (affiliateError || !affiliate) {
        return NextResponse.json(
          { error: 'Afiliado não encontrado' },
          { status: 404 }
        )
      }
    }

    // Criar cupom
    const { data: coupon, error: couponError } = await supabase
      .from('affiliate_coupons')
      .insert({
        event_id,
        affiliate_id: affiliate_id || null,
        code: code.toUpperCase(),
        discount_percentage: discount_percentage || null,
        discount_amount: discount_amount || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (couponError) {
      console.error('Erro ao criar cupom:', couponError)
      return NextResponse.json(
        { error: 'Erro ao criar cupom', details: couponError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cupom criado com sucesso',
      coupon,
    })

  } catch (error: any) {
    console.error('Erro ao criar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao processar cupom', details: error.message },
      { status: 500 }
    )
  }
}

