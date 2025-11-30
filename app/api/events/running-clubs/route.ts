import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarEmailConviteClube } from '@/lib/email/resend'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'event_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar organizador
    const { data: organizer, error: orgError } = await supabase
      .from('organizers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !organizer) {
      return NextResponse.json({ error: 'Organizador não encontrado' }, { status: 404 })
    }

    // Buscar clubes do evento
    const { data: clubs, error: clubsError } = await supabase
      .from('running_clubs')
      .select('*')
      .eq('event_id', eventId)
      .eq('organizer_id', organizer.id)
      .order('created_at', { ascending: false })

    if (clubsError) {
      console.error('Erro ao buscar clubes:', clubsError)
      return NextResponse.json({ error: 'Erro ao buscar clubes' }, { status: 500 })
    }

    return NextResponse.json({ clubs: clubs || [] })
  } catch (error: any) {
    console.error('Erro ao buscar clubes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      event_id,
      email,
      tickets_allocated,
      base_discount,
      progressive_discount_threshold,
      progressive_discount_value,
      deadline,
      extend_on_deadline,
      release_after_deadline,
    } = body

    if (!event_id || !email || !tickets_allocated || !deadline) {
      return NextResponse.json(
        { error: 'event_id, email, tickets_allocated e deadline são obrigatórios' },
        { status: 400 }
      )
    }

    if (tickets_allocated <= 0) {
      return NextResponse.json(
        { error: 'A quantidade de ingressos deve ser maior que zero' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar organizador
    const { data: organizer, error: orgError } = await supabase
      .from('organizers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !organizer) {
      return NextResponse.json({ error: 'Organizador não encontrado' }, { status: 404 })
    }

    // Verificar se o evento pertence ao organizador
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, event_date')
      .eq('id', event_id)
      .eq('organizer_id', organizer.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento não encontrado ou não pertence a você' },
        { status: 404 }
      )
    }

    // Verificar se já existe clube com este email para este evento
    const { data: existingClub } = await supabase
      .from('running_clubs')
      .select('id')
      .eq('event_id', event_id)
      .eq('email', email.toLowerCase())
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existingClub) {
      return NextResponse.json(
        { error: 'Já existe um clube cadastrado com este email para este evento' },
        { status: 400 }
      )
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Expira em 30 dias

    // Criar clube
    const { data: club, error: clubError } = await supabase
      .from('running_clubs')
      .insert({
        event_id,
        organizer_id: organizer.id,
        email: email.toLowerCase(),
        tickets_allocated,
        base_discount: base_discount || 0,
        progressive_discount_threshold: progressive_discount_threshold || null,
        progressive_discount_value: progressive_discount_value || null,
        deadline,
        extend_on_deadline: extend_on_deadline || false,
        release_after_deadline: release_after_deadline !== false,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single()

    if (clubError) {
      console.error('Erro ao criar clube:', clubError)
      return NextResponse.json(
        { error: 'Erro ao criar clube', details: clubError.message },
        { status: 500 }
      )
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    // Buscar data do evento
    let eventDate: string | undefined = undefined
    if (event.event_date) {
      eventDate = new Date(event.event_date).toLocaleDateString('pt-BR')
    }

    // Enviar email de convite
    const emailResult = await enviarEmailConviteClube({
      email: email.toLowerCase(),
      nomeEvento: event.name,
      dataEvento: eventDate,
      quantidadeIngressos: tickets_allocated,
      desconto: base_discount ? `${base_discount}%` : '0%',
      token,
      usuarioExiste: !!existingUser,
    })

    if (!emailResult.success) {
      console.error('Erro ao enviar email:', emailResult.error)
      // Não falhar a requisição se o email falhar
    }

    return NextResponse.json({
      success: true,
      message: 'Clube criado e email enviado com sucesso',
      club,
      email_sent: emailResult.success,
    })
  } catch (error: any) {
    console.error('Erro ao criar clube:', error)
    return NextResponse.json(
      { error: 'Erro ao processar clube', details: error.message },
      { status: 500 }
    )
  }
}

