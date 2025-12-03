import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLogger as logger } from '@/lib/utils/logger'

// Esta função libera ingressos não usados após o prazo final
// Pode ser chamada por um cron job ou webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Buscar clubes que passaram do prazo final e têm release_after_deadline = true
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const { data: clubsToRelease, error: fetchError } = await supabase
      .from('running_clubs')
      .select('*')
      .eq('release_after_deadline', true)
      .eq('status', 'accepted')
      .lt('deadline', hoje.toISOString().split('T')[0])
      .is('released_at', null) // Ainda não foi liberado

    if (fetchError) {
      logger.error('Erro ao buscar clubes para liberar:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar clubes' },
        { status: 500 }
      )
    }

    if (!clubsToRelease || clubsToRelease.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum clube precisa ter ingressos liberados',
        released: 0,
      })
    }

    // Liberar ingressos não usados
    let releasedCount = 0
    for (const club of clubsToRelease) {
      const ticketsUsed = club.tickets_used || 0
      const ticketsAllocated = club.tickets_allocated
      const ticketsRemaining = ticketsAllocated - ticketsUsed

      if (ticketsRemaining > 0) {
        // Atualizar status do clube e marcar como liberado
        const { error: updateError } = await supabase
          .from('running_clubs')
          .update({
            status: 'completed',
            released_at: new Date().toISOString(),
            // Os ingressos não usados ficam disponíveis automaticamente
            // pois não estão mais reservados para o clube
          })
          .eq('id', club.id)

        if (updateError) {
          logger.error(`Erro ao liberar ingressos do clube ${club.id}:`, updateError)
          continue
        }

        releasedCount++
      } else {
        // Todos os ingressos foram usados, apenas marcar como completo
        const { error: updateError } = await supabase
          .from('running_clubs')
          .update({
            status: 'completed',
            released_at: new Date().toISOString(),
          })
          .eq('id', club.id)

        if (updateError) {
          logger.error(`Erro ao atualizar clube ${club.id}:`, updateError)
          continue
        }

        releasedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `${releasedCount} clube(s) processado(s) com sucesso`,
      released: releasedCount,
      total: clubsToRelease.length,
    })
  } catch (error: any) {
    logger.error('Erro ao liberar ingressos:', error)
    return NextResponse.json(
      { error: 'Erro ao processar liberação', details: error.message },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar clubes que precisam ter ingressos liberados
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { data: clubsToRelease, error: fetchError } = await supabase
      .from('running_clubs')
      .select('id, name, email, deadline, tickets_allocated, tickets_used, release_after_deadline, status')
      .eq('release_after_deadline', true)
      .eq('status', 'accepted')
      .lt('deadline', hoje.toISOString().split('T')[0])
      .is('released_at', null)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar clubes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clubs: clubsToRelease || [],
      count: clubsToRelease?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: error.message },
      { status: 500 }
    )
  }
}

