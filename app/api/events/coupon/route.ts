import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitMiddleware } from '@/lib/security/rate-limit'
import { criarCupomSchema, validateRequest, formatZodErrors } from '@/lib/schemas/api-validation'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, 'create')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    
    // Validação com Zod
    const validation = validateRequest(criarCupomSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: formatZodErrors(validation.error) },
        { status: 400 }
      )
    }
    
    const { event_id, code, discount_percentage, discount_amount, affiliate_id, max_uses, expires_at, is_active } = validation.data

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
      .eq('code', code)
      .maybeSingle()

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Este código de cupom já existe' },
        { status: 400 }
      )
    }

    // Verificar se affiliate_id é válido (se fornecido)
    if (affiliate_id) {
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
        code,
        discount_percentage: discount_percentage || null,
        discount_amount: discount_amount || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (couponError) {
      logger.error('Erro ao criar cupom:', couponError)
      return NextResponse.json(
        { error: 'Erro ao criar cupom' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cupom criado com sucesso',
      coupon,
    })

  } catch (error: any) {
    logger.error('Erro ao criar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao processar cupom' },
      { status: 500 }
    )
  }
}
