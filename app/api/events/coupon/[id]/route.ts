import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id
    const body = await request.json()
    const { code, discount_percentage, discount_amount, affiliate_id, max_uses, expires_at, is_active } = body as {
      code?: string
      discount_percentage?: number | null
      discount_amount?: number | null
      affiliate_id?: string | null
      max_uses?: number | null
      expires_at?: string | null
      is_active?: boolean
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

    // Buscar cupom
    const { data: coupon, error: couponError } = await supabase
      .from('affiliate_coupons')
      .select(`
        *,
        event:events(
          id,
          organizer_id
        )
      `)
      .eq('id', couponId)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json(
        { error: 'Cupom não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o evento pertence ao organizador
    if (coupon.event?.organizer_id !== organizer.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este cupom' },
        { status: 403 }
      )
    }

    // Verificar se o código já existe (se foi alterado)
    if (code && code.toUpperCase() !== coupon.code) {
      const { data: existingCoupon } = await supabase
        .from('affiliate_coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .neq('id', couponId)
        .maybeSingle()

      if (existingCoupon) {
        return NextResponse.json(
          { error: 'Este código de cupom já existe' },
          { status: 400 }
        )
      }
    }

    // Verificar se affiliate_id é válido (se fornecido)
    if (affiliate_id) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('id', affiliate_id)
        .single()

      if (!affiliate) {
        return NextResponse.json(
          { error: 'Afiliado não encontrado' },
          { status: 404 }
        )
      }
    }

    // Atualizar cupom
    const updateData: any = {}
    if (code !== undefined) updateData.code = code.toUpperCase()
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage
    if (discount_amount !== undefined) updateData.discount_amount = discount_amount
    if (affiliate_id !== undefined) updateData.affiliate_id = affiliate_id
    if (max_uses !== undefined) updateData.max_uses = max_uses
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedCoupon, error: updateError } = await supabase
      .from('affiliate_coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single()

    if (updateError) {
      logger.error('Erro ao atualizar cupom:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar cupom', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cupom atualizado com sucesso',
      coupon: updatedCoupon,
    })

  } catch (error: any) {
    logger.error('Erro ao atualizar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao processar cupom', details: error.message },
      { status: 500 }
    )
  }
}

