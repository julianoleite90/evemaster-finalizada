// API para convidar afiliados para eventos
import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarEmailConviteAfiliado } from '@/lib/email/resend'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, email, commission_type, commission_value } = body as {
      event_id: string
      email: string
      commission_type: 'percentage' | 'fixed'
      commission_value: number
    }

    if (!event_id || !email || !commission_type || commission_value === undefined) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (commission_value <= 0) {
      return NextResponse.json(
        { error: 'O valor da comissão deve ser maior que zero' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    logger.log('[Affiliate Invite] Usuário autenticado:', user.id, user.email)

    // Buscar organizador direto ou via organização
    let organizerId: string | null = null

    // 1. Verificar se é organizador direto
    const { data: directOrganizer } = await supabase
      .from('organizers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (directOrganizer) {
      organizerId = directOrganizer.id
      logger.log('[Affiliate Invite] Organizador direto encontrado:', organizerId)
    } else {
      // 2. Verificar se é membro de alguma organização
      const { data: orgMember } = await supabase
        .from('organization_users')
        .select('organizer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (orgMember) {
        organizerId = orgMember.organizer_id
        logger.log('[Affiliate Invite] Membro de organização encontrado:', organizerId)
      }
    }

    if (!organizerId) {
      logger.error('[Affiliate Invite] Organizador não encontrado para user:', user.id)
      return NextResponse.json(
        { error: 'Organizador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o evento pertence ao organizador
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, event_date')
      .eq('id', event_id)
      .eq('organizer_id', organizerId)
      .maybeSingle()

    if (eventError || !event) {
      logger.error('[Affiliate Invite] Evento não encontrado:', { event_id, organizerId, error: eventError })
      return NextResponse.json(
        { error: 'Evento não encontrado ou não pertence a você' },
        { status: 404 }
      )
    }

    logger.log('[Affiliate Invite] Evento encontrado:', event.name)

    // Verificar se já existe convite pendente ou aceito para este email e evento
    const { data: existingInvite } = await supabase
      .from('event_affiliate_invites')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('email', email.toLowerCase())
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Já existe um convite pendente ou aceito para este email' },
        { status: 400 }
      )
    }

    // Gerar token único para o convite
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Expira em 30 dias

    // Criar convite
    const { data: invite, error: inviteError } = await supabase
      .from('event_affiliate_invites')
      .insert({
        event_id,
        organizer_id: organizerId,
        email: email.toLowerCase(),
        commission_type,
        commission_value,
        status: 'pending',
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      logger.error('Erro ao criar convite:', inviteError)
      return NextResponse.json(
        { error: 'Erro ao criar convite', details: inviteError.message },
        { status: 500 }
      )
    }

    // Buscar data do evento se necessário
    let eventDate: string | undefined = undefined
    if (event.event_date) {
      eventDate = new Date(event.event_date).toLocaleDateString('pt-BR')
    }

    // Enviar email de convite
    const emailResult = await enviarEmailConviteAfiliado({
      email: email.toLowerCase(),
      nomeEvento: event.name,
      dataEvento: eventDate,
      comissao: commission_type === 'percentage' 
        ? `${commission_value}%` 
        : `R$ ${commission_value.toFixed(2)}`,
      tipoComissao: commission_type,
      token,
      usuarioExiste: false, // Simplificado - sempre trata como novo usuário
    })

    if (!emailResult.success) {
      logger.error('Erro ao enviar email:', emailResult.error)
      // Não falhar a requisição se o email falhar, apenas logar
    }

    return NextResponse.json({
      success: true,
      message: 'Convite criado e email enviado com sucesso',
      invite_id: invite.id,
      user_exists: false,
      email_sent: emailResult.success,
    })

  } catch (error: any) {
    logger.error('Erro ao enviar convite:', error)
    return NextResponse.json(
      { error: 'Erro ao processar convite', details: error.message },
      { status: 500 }
    )
  }
}

