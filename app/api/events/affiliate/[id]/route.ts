import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inviteId = params.id
    const body = await request.json()
    const { commission_type, commission_value } = body as {
      commission_type: 'percentage' | 'fixed'
      commission_value: number
    }

    if (!commission_type || commission_value === undefined || commission_value <= 0) {
      return NextResponse.json(
        { error: 'Tipo e valor da comissão são obrigatórios' },
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

    // Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from('event_affiliate_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('organizer_id', organizer.id)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado ou não pertence a você' },
        { status: 404 }
      )
    }

    // Atualizar convite
    const { error: updateInviteError } = await supabase
      .from('event_affiliate_invites')
      .update({
        commission_type,
        commission_value,
      })
      .eq('id', inviteId)

    if (updateInviteError) {
      logger.error('Erro ao atualizar convite:', updateInviteError)
      return NextResponse.json(
        { error: 'Erro ao atualizar convite', details: updateInviteError.message },
        { status: 500 }
      )
    }

    // Se o convite foi aceito, atualizar também a comissão
    if (invite.status === 'accepted' && invite.affiliate_id) {
      const { error: updateCommissionError } = await supabase
        .from('event_affiliate_commissions')
        .update({
          commission_type,
          commission_value,
        })
        .eq('event_id', invite.event_id)
        .eq('affiliate_id', invite.affiliate_id)

      if (updateCommissionError) {
        logger.error('Erro ao atualizar comissão:', updateCommissionError)
        // Não falhar a requisição se apenas a atualização da comissão falhar
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Afiliado atualizado com sucesso',
    })

  } catch (error: any) {
    logger.error('Erro ao atualizar afiliado:', error)
    return NextResponse.json(
      { error: 'Erro ao processar atualização', details: error.message },
      { status: 500 }
    )
  }
}

