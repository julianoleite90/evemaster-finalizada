import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { data: profiles, error } = await supabase
      .from('saved_participant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Erro ao buscar perfis:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar perfis salvos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profiles: profiles || [],
    })
  } catch (error: any) {
    logger.error('Erro ao buscar perfis salvos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfis salvos' },
      { status: 500 }
    )
  }
}

