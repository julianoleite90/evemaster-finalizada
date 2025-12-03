import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { authLogger as logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body as { cpf: string }

    logger.log('Verificar CPF recebido:', { cpf })

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar CPF - apenas números
    const cleanCPF = cpf.replace(/\D/g, '')
    logger.log('CPF limpo:', cleanCPF)
    
    if (cleanCPF.length !== 11) {
      logger.warn('CPF inválido - tamanho:', cleanCPF.length)
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Configuração incompleta')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Buscar usuário pelo CPF na tabela users
    logger.log('Buscando no banco por CPF:', cleanCPF)
    let { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, cpf')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    logger.log('Resultado da busca em users:', { 
      encontrado: !!userData, 
      erro: userError?.message,
      userId: userData?.id,
      email: userData?.email 
    })

    // 2. Se não encontrou em users, buscar na tabela athletes
    if (!userData && !userError) {
      logger.log('Não encontrado em users, buscando em athletes...')
      
      const { data: athleteData, error: athleteError } = await supabaseAdmin
        .from('athletes')
        .select('id, email, full_name, cpf, registration_id')
        .eq('cpf', cleanCPF)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      logger.log('Resultado da busca em athletes:', { 
        encontrado: !!athleteData, 
        erro: athleteError?.message,
        athleteEmail: athleteData?.email,
        registrationId: athleteData?.registration_id
      })

      if (athleteData && athleteData.registration_id) {
        // Buscar o user_id através da registration
        const { data: regData } = await supabaseAdmin
          .from('registrations')
          .select('user_id')
          .eq('id', athleteData.registration_id)
          .maybeSingle()
        
        logger.log('Registration encontrada:', { user_id: regData?.user_id })

        if (regData?.user_id) {
          // Buscar dados do usuário pelo user_id
          const { data: userFromReg } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, phone, cpf')
            .eq('id', regData.user_id)
            .maybeSingle()
          
          if (userFromReg) {
            userData = userFromReg
            logger.log('✅ Usuário encontrado via athletes->registrations->users:', userFromReg.email)
          }
        }
      }
    }

    if (userError) {
      logger.error('Erro ao buscar:', userError)
      return NextResponse.json(
        { error: 'Erro ao verificar CPF' },
        { status: 500 }
      )
    }

    if (!userData) {
      // CPF não encontrado em nenhuma tabela
      logger.log('CPF não encontrado no banco (nem em users nem em athletes)')
      return NextResponse.json({
        exists: false,
        message: 'CPF não cadastrado'
      })
    }

    // CPF encontrado - retornar dados parciais (mascarar email para privacidade)
    const maskedEmail = userData.email 
      ? userData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : null

    return NextResponse.json({
      exists: true,
      message: 'CPF já cadastrado',
      userData: {
        id: userData.id,
        maskedEmail,
        fullName: userData.full_name,
      }
    })

  } catch (error: any) {
    logger.error('Erro na verificação de CPF:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
