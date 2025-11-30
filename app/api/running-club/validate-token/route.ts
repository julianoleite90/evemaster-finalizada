import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar clube pelo token
    const { data: club, error: clubError } = await supabase
      .from('running_clubs')
      .select(`
        *,
        events:event_id (
          id,
          name,
          event_date
        )
      `)
      .eq('token', token)
      .single()

    if (clubError || !club) {
      return NextResponse.json(
        { error: 'Convite inválido ou não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já foi aceito
    if (club.status === 'accepted') {
      return NextResponse.json(
        { error: 'Este convite já foi aceito' },
        { status: 400 }
      )
    }

    // Verificar se expirou
    if (club.expires_at && new Date(club.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Este convite expirou' },
        { status: 400 }
      )
    }

    return NextResponse.json({ club })
  } catch (error: any) {
    console.error('Erro ao validar token:', error)
    return NextResponse.json(
      { error: 'Erro ao processar convite', details: error.message },
      { status: 500 }
    )
  }
}

