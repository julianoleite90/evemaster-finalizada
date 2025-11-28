import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBarteSplit, getPlatformSellerId, getBarteCharge } from '@/lib/barte/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, charge_uuid } = body as {
      payment_id: string
      charge_uuid: string
    }

    if (!payment_id || !charge_uuid) {
      return NextResponse.json(
        { error: 'payment_id e charge_uuid são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar dados do pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        registration:registrations(
          id,
          event_id,
          ticket_id,
          event:events(
            id,
            organizer_id
          ),
          ticket:tickets(*)
        )
      `)
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o split já foi criado
    if (payment.split_created) {
      return NextResponse.json(
        { error: 'Split já foi criado para este pagamento' },
        { status: 409 }
      )
    }

    // Verificar se a charge foi aprovada
    const platformSellerId = getPlatformSellerId()
    const charge = await getBarteCharge(platformSellerId, charge_uuid)

    if (charge.status !== 'SUCCESS' && charge.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Charge ainda não foi aprovada' },
        { status: 400 }
      )
    }

    // Buscar organizador e seller ID
    const { data: organizer, error: orgError } = await supabase
      .from('organizers')
      .select('id, barte_seller_id')
      .eq('id', payment.registration?.event?.organizer_id)
      .single()

    if (orgError || !organizer) {
      return NextResponse.json(
        { error: 'Organizador não encontrado' },
        { status: 404 }
      )
    }

    if (!organizer.barte_seller_id) {
      return NextResponse.json(
        { error: 'Organizador não possui seller ID da Barte configurado' },
        { status: 400 }
      )
    }

    // Preparar sellers para split
    const sellers: Array<{ idSeller: number; value: number; type: 'fixed' | 'percent' }> = []

    // 1. Plataforma (taxa + parcelamento)
    if (payment.platform_amount && payment.platform_amount > 0) {
      sellers.push({
        idSeller: platformSellerId,
        value: payment.platform_amount,
        type: 'fixed',
      })
    }

    // 2. Afiliado (se houver comissão)
    if (payment.affiliate_commission && payment.affiliate_commission > 0 && payment.affiliate_id) {
      // Buscar seller ID do afiliado
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, barte_seller_id')
        .eq('id', payment.affiliate_id)
        .single()

      if (affiliate?.barte_seller_id) {
        sellers.push({
          idSeller: affiliate.barte_seller_id,
          value: payment.affiliate_commission,
          type: 'fixed',
        })
      } else {
        console.warn(`Afiliado ${payment.affiliate_id} não possui barte_seller_id configurado`)
      }
    }

    // 3. Organizador (valor do ingresso menos comissão do afiliado)
    if (payment.organizer_amount && payment.organizer_amount > 0) {
      sellers.push({
        idSeller: organizer.barte_seller_id,
        value: payment.organizer_amount,
        type: 'fixed',
      })
    }

    if (sellers.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum seller configurado para split' },
        { status: 400 }
      )
    }

    // Criar split na Barte
    const splitResult = await createBarteSplit(platformSellerId, charge_uuid, { sellers })

    // Atualizar payment com dados do split
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        barte_split_uuid: splitResult[0]?.uuid || null,
        split_created: true,
        split_created_at: new Date().toISOString(),
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Erro ao atualizar payment com split:', updateError)
    }

    return NextResponse.json({
      success: true,
      split: splitResult,
      sellers,
    })
  } catch (error: any) {
    console.error('Erro ao criar split na Barte:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar split' },
      { status: 500 }
    )
  }
}

