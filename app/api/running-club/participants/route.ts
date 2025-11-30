import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarEmailParticipanteClube } from '@/lib/email/resend'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      club_id,
      event_id,
      email,
      full_name,
      phone,
      cpf,
      birth_date,
      gender,
    } = body

    if (!club_id || !event_id || !email) {
      return NextResponse.json(
        { error: 'club_id, event_id e email são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o clube pertence ao usuário
    const { data: club, error: clubError } = await supabase
      .from('running_clubs')
      .select('*')
      .eq('id', club_id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (clubError || !club) {
      return NextResponse.json(
        { error: 'Clube não encontrado ou não autorizado' },
        { status: 404 }
      )
    }

    // Verificar se ainda há ingressos disponíveis
    const ticketsRemaining = club.tickets_allocated - (club.tickets_used || 0)
    if (ticketsRemaining <= 0) {
      return NextResponse.json(
        { error: 'Não há mais ingressos disponíveis para este clube' },
        { status: 400 }
      )
    }

    // Verificar se o participante já existe
    const { data: existingParticipant } = await supabase
      .from('running_club_participants')
      .select('id')
      .eq('club_id', club_id)
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Este participante já está cadastrado' },
        { status: 400 }
      )
    }

    // Buscar dados do evento
    const { data: event } = await supabase
      .from('events')
      .select('id, name, event_date, slug')
      .eq('id', event_id)
      .single()

    // Gerar token para completar inscrição (se apenas email)
    let token: string | null = null
    let status: string = 'pending'

    if (!full_name) {
      // Apenas email - gerar token e enviar email
      token = crypto.randomBytes(32).toString('hex')
      status = 'invited'
    } else {
      // Cadastro completo
      status = 'pending'
    }

    // Criar participante
    const { data: participant, error: participantError } = await supabase
      .from('running_club_participants')
      .insert({
        club_id,
        event_id,
        email: email.toLowerCase(),
        full_name: full_name || null,
        phone: phone || null,
        cpf: cpf || null,
        birth_date: birth_date || null,
        gender: gender || null,
        token,
        status,
      })
      .select()
      .single()

    if (participantError) {
      console.error('Erro ao criar participante:', participantError)
      return NextResponse.json(
        { error: 'Erro ao criar participante', details: participantError.message },
        { status: 500 }
      )
    }

    // Se apenas email, enviar email de convite
    if (!full_name && token) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evemaster.com'
      const eventUrl = event?.slug
        ? `${baseUrl}/inscricao/${event.slug}?club=${club_id}`
        : `${baseUrl}/inscricao/${event_id}?club=${club_id}`

      const emailResult = await enviarEmailParticipanteClube({
        email: email.toLowerCase(),
        nomeEvento: event?.name || 'Evento',
        dataEvento: event?.event_date
          ? new Date(event.event_date).toLocaleDateString('pt-BR')
          : undefined,
        linkInscricao: eventUrl,
        desconto: `${club.base_discount}%`,
        nomeClube: club.name || 'Clube de Corrida',
        token,
      })

      if (!emailResult.success) {
        console.error('Erro ao enviar email:', emailResult.error)
        // Não falhar a requisição se o email falhar
      }
    }

    return NextResponse.json({
      success: true,
      message: full_name
        ? 'Participante cadastrado com sucesso'
        : 'Email enviado para o participante',
      participant,
    })
  } catch (error: any) {
    console.error('Erro ao processar participante:', error)
    return NextResponse.json(
      { error: 'Erro ao processar participante', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const club_id = searchParams.get('club_id')

    if (!club_id) {
      return NextResponse.json({ error: 'club_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o clube pertence ao usuário
    const { data: club } = await supabase
      .from('running_clubs')
      .select('id')
      .eq('id', club_id)
      .eq('user_id', user.id)
      .single()

    if (!club) {
      return NextResponse.json(
        { error: 'Clube não encontrado ou não autorizado' },
        { status: 404 }
      )
    }

    // Buscar participantes
    const { data: participants, error: participantsError } = await supabase
      .from('running_club_participants')
      .select('*')
      .eq('club_id', club_id)
      .order('created_at', { ascending: false })

    if (participantsError) {
      console.error('Erro ao buscar participantes:', participantsError)
      return NextResponse.json(
        { error: 'Erro ao buscar participantes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ participants: participants || [] })
  } catch (error: any) {
    console.error('Erro ao buscar participantes:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: error.message },
      { status: 500 }
    )
  }
}

