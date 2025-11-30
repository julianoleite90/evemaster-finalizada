import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBarteSplit, getPlatformSellerId } from '@/lib/barte/client'

/**
 * Webhook para receber notificações da Barte sobre mudanças de status de pagamento
 * Quando um pagamento é aprovado, criar o split automaticamente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificar autenticação (se a Barte enviar um token)
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.BARTE_WEBHOOK_SECRET
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { charge_uuid, status, event_type } = body as {
      charge_uuid: string
      status: string
      event_type?: string
    }

    if (!charge_uuid || !status) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Só processar se o status for SUCCESS ou PAID
    if (status !== 'SUCCESS' && status !== 'PAID') {
      return NextResponse.json({ success: true, message: 'Status não requer split' })
    }

    const supabase = await createClient()

    // Buscar payment pela charge UUID
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        registration:registrations(
          id,
          event_id,
          event:events(
            id,
            organizer_id
          )
        )
      `)
      .eq('barte_charge_uuid', charge_uuid)
      .single()

    if (paymentError || !payment) {
      console.error('Payment não encontrado para charge:', charge_uuid)
      return NextResponse.json(
        { error: 'Payment não encontrado' },
        { status: 404 }
      )
    }

    // Se o split já foi criado, não fazer nada
    if (payment.split_created) {
      return NextResponse.json({ success: true, message: 'Split já criado' })
    }

    // Atualizar status do pagamento
    await supabase
      .from('payments')
      .update({
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
      })
      .eq('id', payment.id)

    // Registrar conversão de afiliado (se houver)
    if (payment.affiliate_id && payment.affiliate_commission && payment.affiliate_commission > 0) {
      // Buscar link mais recente do afiliado para este evento (se houver)
      const { data: recentLink } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('affiliate_id', payment.affiliate_id)
        .eq('event_id', payment.registration?.event_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Registrar conversão
      try {
        const { error: conversionError } = await supabase
          .from('affiliate_conversions')
          .insert({
            link_id: recentLink?.id || null,
            affiliate_id: payment.affiliate_id,
            event_id: payment.registration?.event_id,
            registration_id: payment.registration?.id,
            payment_id: payment.id,
            conversion_value: parseFloat(payment.total_amount || '0'),
            commission_earned: parseFloat(payment.affiliate_commission || '0'),
            converted_at: new Date().toISOString(),
          })
        
        if (conversionError) {
          console.error('Erro ao registrar conversão:', conversionError)
          // Não falhar o webhook se a conversão não for registrada
        }
      } catch (err) {
        console.error('Erro ao registrar conversão:', err)
        // Não falhar o webhook se a conversão não for registrada
      }

      // Atualizar contador de conversões do link (se houver)
      if (recentLink?.id) {
        try {
          const { error: rpcError } = await supabase.rpc('increment_link_conversions', { link_id: recentLink.id })
          if (rpcError) {
            // Fallback: buscar valor atual e incrementar
            const { data: currentLink } = await supabase
              .from('affiliate_links')
              .select('conversion_count')
              .eq('id', recentLink.id)
              .single()
            
            if (currentLink) {
              await supabase
                .from('affiliate_links')
                .update({ conversion_count: (currentLink.conversion_count || 0) + 1 })
                .eq('id', recentLink.id)
            }
          }
        } catch (err) {
          // Fallback: buscar valor atual e incrementar em caso de erro
          try {
            const { data: currentLink } = await supabase
              .from('affiliate_links')
              .select('conversion_count')
              .eq('id', recentLink.id)
              .single()
            
            if (currentLink) {
              await supabase
                .from('affiliate_links')
                .update({ conversion_count: (currentLink.conversion_count || 0) + 1 })
                .eq('id', recentLink.id)
            }
          } catch (fallbackErr) {
            // Ignorar erro no fallback
          }
        }
      }
    }

    // Criar split automaticamente
    try {
      const splitResponse = await fetch(`${request.nextUrl.origin}/api/barte/create-split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: payment.id,
          charge_uuid,
        }),
      })

      if (!splitResponse.ok) {
        const error = await splitResponse.json()
        console.error('Erro ao criar split:', error)
        // Não falhar o webhook, apenas logar o erro
      }
    } catch (splitError) {
      console.error('Erro ao chamar create-split:', splitError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no webhook da Barte:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

