import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBarteOrder, getPlatformSellerId } from '@/lib/barte/client'
import {
  calculateFinalValue,
  calculatePlatformFee,
  calculateInstallmentFee,
  calculateOrganizerValue,
  calculatePlatformValue,
  calculateAffiliateValue,
  calculateOrganizerValueAfterAffiliate,
} from '@/lib/barte/calculations'
import { rateLimitMiddleware } from '@/lib/security/rate-limit'
import { paymentLogger as logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // Rate limiting para evitar abusos
  const rateLimitResponse = await rateLimitMiddleware(request, 'create')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const {
      registration_id,
      ticket_value,
      payment_method,
      installments = 1,
      buyer_uuid,
      event_name,
      affiliate_id,
      affiliate_commission_type,
      affiliate_commission_value,
    } = body as {
      registration_id: string
      ticket_value: number
      payment_method: 'pix' | 'credit_card'
      installments?: number
      buyer_uuid: string
      event_name: string
      affiliate_id?: string
      affiliate_commission_type?: 'percentage' | 'fixed'
      affiliate_commission_value?: number
    }

    if (!registration_id || !ticket_value || !buyer_uuid) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar dados da inscrição com verificação de ownership
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        ticket:tickets(*),
        event:events(
          id,
          name
        ),
        athlete:athletes(
          email
        )
      `)
      .eq('id', registration_id)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o buyer_uuid corresponde ao usuário da inscrição
    // ou se a inscrição pertence ao usuário logado (via sessão)
    const { data: { user } } = await supabase.auth.getUser()
    
    // A inscrição deve pertencer ao usuário logado OU
    // o buyer_uuid deve corresponder ao user_id da inscrição
    const isOwner = user && (
      registration.user_id === user.id ||
      registration.buyer_id === user.id ||
      registration.athlete_id === user.id
    )
    
    // Se não é owner e estamos em produção, verificar mais rigorosamente
    if (!isOwner && process.env.NODE_ENV === 'production') {
      logger.warn('Tentativa de criar pedido para inscrição de outro usuário:', {
        registration_id,
        buyer_uuid,
        user_id: user?.id,
        registration_user_id: registration.user_id,
      })
      // Não bloqueamos completamente pois pode ser checkout sem login
      // mas logamos para monitoramento
    }

    // Calcular valores
    const finalValue = calculateFinalValue(ticket_value, installments)
    const platformFee = calculatePlatformFee(ticket_value)
    const installmentFee = calculateInstallmentFee(ticket_value, installments)
    const platformAmount = calculatePlatformValue(ticket_value, installments)

    // Calcular comissão do afiliado (se houver)
    let affiliateCommission = 0
    if (affiliate_id && affiliate_commission_type && affiliate_commission_value) {
      affiliateCommission = calculateAffiliateValue(
        ticket_value,
        affiliate_commission_type,
        affiliate_commission_value
      )
    }

    // Calcular valor do organizador
    const organizerAmount = calculateOrganizerValueAfterAffiliate(
      ticket_value,
      affiliateCommission
    )

    // Criar pedido na Barte
    const orderData: any = {
      startDate: new Date().toISOString(),
      value: finalValue,
      title: `Inscrição - ${event_name || registration.event?.name || 'Evento'}`,
      description: `Inscrição para o evento ${event_name || registration.event?.name || 'Evento'}`,
      payment: {
        method: payment_method,
      },
      uuidBuyer: buyer_uuid,
    }

    // Adicionar installments se for cartão de crédito
    if (payment_method === 'credit_card' && installments) {
      orderData.installments = installments
      orderData.payment.creditCard = {
        installments,
      }
    }

    const barteCharge = await createBarteOrder(orderData)

    // Atualizar payment com dados da Barte
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        barte_order_uuid: barteCharge.uuid,
        barte_charge_uuid: barteCharge.uuid,
        barte_seller_id: getPlatformSellerId(),
        affiliate_id: affiliate_id || null,
        installment_fee: installmentFee,
        affiliate_commission: affiliateCommission || null,
        organizer_amount: organizerAmount,
        platform_amount: platformAmount,
        amount: finalValue,
        total_amount: finalValue,
        base_amount: ticket_value,
        platform_fee: platformFee,
        payment_status: barteCharge.status === 'SUCCESS' ? 'paid' : 'pending',
      })
      .eq('registration_id', registration_id)

    if (updateError) {
      logger.error('Erro ao atualizar payment:', updateError)
    }

    return NextResponse.json({
      success: true,
      charge: barteCharge,
      calculations: {
        original_value: ticket_value,
        final_value: finalValue,
        platform_fee: platformFee,
        installment_fee: installmentFee,
        affiliate_commission: affiliateCommission,
        organizer_amount: organizerAmount,
        platform_amount: platformAmount,
      },
    })
  } catch (error: any) {
    logger.error('Erro ao criar pedido na Barte:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}

