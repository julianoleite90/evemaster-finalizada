import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Esta função pode ser chamada por um cron job ou webhook
// para prorrogar automaticamente os prazos dos clubes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar clubes que estão no prazo final e têm extend_on_deadline = true
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const { data: clubsToExtend, error: fetchError } = await supabase
      .from('running_clubs')
      .select('*')
      .eq('extend_on_deadline', true)
      .eq('status', 'accepted')
      .lte('deadline', hoje.toISOString().split('T')[0])
      .is('extended_at', null) // Ainda não foi prorrogado

    if (fetchError) {
      console.error('Erro ao buscar clubes para prorrogar:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar clubes' },
        { status: 500 }
      )
    }

    if (!clubsToExtend || clubsToExtend.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum clube precisa ser prorrogado',
        extended: 0,
      })
    }

    // Prorrogar cada clube por 24 horas
    let extendedCount = 0
    for (const club of clubsToExtend) {
      const currentDeadline = new Date(club.deadline)
      const newDeadline = new Date(currentDeadline)
      newDeadline.setDate(newDeadline.getDate() + 1) // Adicionar 24 horas

      const { error: updateError } = await supabase
        .from('running_clubs')
        .update({
          deadline: newDeadline.toISOString().split('T')[0],
          extended_at: new Date().toISOString(),
        })
        .eq('id', club.id)

      if (updateError) {
        console.error(`Erro ao prorrogar clube ${club.id}:`, updateError)
        continue
      }

      extendedCount++
    }

    return NextResponse.json({
      success: true,
      message: `${extendedCount} clube(s) prorrogado(s) com sucesso`,
      extended: extendedCount,
      total: clubsToExtend.length,
    })
  } catch (error: any) {
    console.error('Erro ao prorrogar prazos:', error)
    return NextResponse.json(
      { error: 'Erro ao processar prorrogação', details: error.message },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar clubes que precisam ser prorrogados (útil para debug)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { data: clubsToExtend, error: fetchError } = await supabase
      .from('running_clubs')
      .select('id, name, email, deadline, extend_on_deadline, status')
      .eq('extend_on_deadline', true)
      .eq('status', 'accepted')
      .lte('deadline', hoje.toISOString().split('T')[0])
      .is('extended_at', null)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar clubes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clubs: clubsToExtend || [],
      count: clubsToExtend?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: error.message },
      { status: 500 }
    )
  }
}

