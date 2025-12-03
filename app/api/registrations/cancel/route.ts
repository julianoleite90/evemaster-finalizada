import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentLogger as logger } from '@/lib/utils/logger'

const BARTE_API_URL = process.env.BARTE_API_URL || 'https://api.barte.com'
const BARTE_API_TOKEN = process.env.BARTE_API_TOKEN
const BARTE_SELLER_ID = process.env.BARTE_SELLER_ID

/**
 * Cancelar inscrição e processar reembolso
 */
export async function POST(request: NextRequest) {
  try {
    const { registration_id, reason } = await request.json()

    if (!registration_id) {
      return NextResponse.json(
        { error: 'ID da inscrição não fornecido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar inscrição com dados relacionados
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        payments(*),
        tickets(id, quantity, category),
        events(organizer_id, name),
        athletes(email, full_name)
      `)
      .eq('id', registration_id)
      .single()

    if (regError || !registration) {
      logger.error('Inscrição não encontrada:', regError)
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão (organizador do evento OU membro com permissão pode cancelar)
    const event = Array.isArray(registration.events) ? registration.events[0] : registration.events
    
    logger.log('🔍 Verificando permissão - event.organizer_id:', event?.organizer_id, 'user.id:', user.id)
    
    // Buscar o organizer por ID OU por user_id (suporta ambos os formatos)
    let organizer = null
    
    // Tentativa 1: organizer_id é o ID da tabela organizers
    const { data: organizerById } = await supabase
      .from('organizers')
      .select('id, user_id')
      .eq('id', event?.organizer_id)
      .maybeSingle()
    
    if (organizerById) {
      organizer = organizerById
      logger.log('✅ Organizer encontrado por id:', organizer.id)
    } else {
      // Tentativa 2: organizer_id é o user_id do auth.users
      const { data: organizerByUserId } = await supabase
        .from('organizers')
        .select('id, user_id')
        .eq('user_id', event?.organizer_id)
        .maybeSingle()
      
      if (organizerByUserId) {
        organizer = organizerByUserId
        logger.log('✅ Organizer encontrado por user_id:', organizer.id)
      }
    }
    
    let hasPermission = false
    
    // 1. É o dono da organização?
    if (organizer?.user_id === user.id) {
      hasPermission = true
      logger.log('✅ Usuário é o dono da organização')
    }
    
    // 2. O organizer_id do evento é diretamente o user_id do usuário logado?
    if (!hasPermission && event?.organizer_id === user.id) {
      hasPermission = true
      logger.log('✅ Usuário é o organizer_id direto do evento')
    }
    
    // 3. É um membro da organização com permissão?
    if (!hasPermission && organizer?.id) {
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('can_cancel_registrations, can_edit_registrations, can_delete, is_active')
        .eq('user_id', user.id)
        .eq('organizer_id', organizer.id)
        .eq('is_active', true)
        .maybeSingle()
      
      logger.log('🔍 Verificando organization_users:', orgUser)
      
      if (orgUser && (orgUser.can_cancel_registrations || orgUser.can_delete)) {
        hasPermission = true
        logger.log('✅ Usuário é membro com permissão de cancelar')
      }
    }
    
    if (!hasPermission) {
      logger.warn('❌ Usuário sem permissão para cancelar:', { 
        userId: user.id, 
        organizerId: organizer?.id,
        eventOrganizerId: event?.organizer_id 
      })
      return NextResponse.json(
        { error: 'Você não tem permissão para cancelar esta inscrição' },
        { status: 403 }
      )
    }

    // Verificar se já está cancelada
    if (registration.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Esta inscrição já foi cancelada' },
        { status: 400 }
      )
    }

    const payment = Array.isArray(registration.payments) ? registration.payments[0] : registration.payments
    const ticket = Array.isArray(registration.tickets) ? registration.tickets[0] : registration.tickets
    const athlete = Array.isArray(registration.athletes) ? registration.athletes[0] : registration.athletes

    let refundProcessed = false
    let refundDetails = null

    // Tentar processar reembolso na Barte se houver pagamento
    if (payment?.barte_charge_uuid && payment.payment_status === 'paid') {
      try {
        if (BARTE_API_TOKEN && BARTE_SELLER_ID) {
          // Tentar cancelar/reembolsar na Barte
          const refundResponse = await fetch(
            `${BARTE_API_URL}/v2/seller/${BARTE_SELLER_ID}/charges/${payment.barte_charge_uuid}/refund`,
            {
              method: 'POST',
              headers: {
                'x-token-api': BARTE_API_TOKEN,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reason: reason || 'Cancelamento solicitado pelo organizador',
              }),
            }
          )

          if (refundResponse.ok) {
            refundDetails = await refundResponse.json()
            refundProcessed = true
            logger.log('✅ Reembolso processado na Barte:', refundDetails)
          } else {
            const errorData = await refundResponse.json().catch(() => ({}))
            logger.warn('⚠️ Erro ao processar reembolso na Barte:', errorData)
            // Continuar mesmo se falhar - marcar para reembolso manual
          }
        }
      } catch (barteError) {
        logger.error('Erro ao comunicar com Barte:', barteError)
        // Continuar mesmo se falhar
      }
    }

    // Atualizar status da inscrição para cancelada
    const { error: updateRegError } = await supabase
      .from('registrations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason || 'Cancelamento solicitado pelo organizador',
      })
      .eq('id', registration_id)

    if (updateRegError) {
      logger.error('Erro ao atualizar status da inscrição:', updateRegError)
      return NextResponse.json(
        { error: 'Erro ao cancelar inscrição' },
        { status: 500 }
      )
    }

    // Atualizar status do pagamento
    if (payment) {
      const { error: updatePayError } = await supabase
        .from('payments')
        .update({
          payment_status: refundProcessed ? 'refunded' : 'pending_refund',
          refund_requested_at: new Date().toISOString(),
          refund_processed_at: refundProcessed ? new Date().toISOString() : null,
          refund_reason: reason || 'Cancelamento solicitado pelo organizador',
        })
        .eq('registration_id', registration_id)

      if (updatePayError) {
        logger.warn('Erro ao atualizar pagamento:', updatePayError)
      }
    }

    // Restaurar quantidade do ticket
    if (ticket?.id) {
      const { error: updateTicketError } = await supabase
        .from('tickets')
        .update({
          quantity: (ticket.quantity || 0) + 1,
        })
        .eq('id', ticket.id)

      if (updateTicketError) {
        logger.warn('Erro ao restaurar quantidade do ticket:', updateTicketError)
      }
    }

    // Enviar email de notificação (se configurado)
    if (athlete?.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/cancellation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: athlete.email,
            nome: athlete.full_name,
            evento: event?.name,
            registration_number: registration.registration_number,
            refund_amount: payment?.total_amount || payment?.amount || 0,
            refund_processed: refundProcessed,
          }),
        })
      } catch (emailError) {
        logger.warn('Erro ao enviar email de cancelamento:', emailError)
        // Não falhar por causa do email
      }
    }

    return NextResponse.json({
      success: true,
      message: refundProcessed 
        ? 'Inscrição cancelada e reembolso processado com sucesso'
        : 'Inscrição cancelada. Reembolso será processado em até 5 dias úteis.',
      refund_processed: refundProcessed,
      refund_details: refundDetails,
      registration_id,
    })

  } catch (error: any) {
    logger.error('Erro ao cancelar inscrição:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar inscrição' },
      { status: 500 }
    )
  }
}

