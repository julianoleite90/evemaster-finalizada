import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body as { cpf: string }

    console.log('🔍 [API verificar-cpf] Recebido:', { cpf })

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar CPF - apenas números
    const cleanCPF = cpf.replace(/\D/g, '')
    console.log('🔍 [API verificar-cpf] CPF limpo:', cleanCPF)
    
    if (cleanCPF.length !== 11) {
      console.log('❌ [API verificar-cpf] CPF inválido - tamanho:', cleanCPF.length)
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [API verificar-cpf] Configuração incompleta')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Buscar usuário pelo CPF na tabela users
    console.log('🔍 [API verificar-cpf] Buscando no banco por CPF:', cleanCPF)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, cpf, address, address_number, address_complement, neighborhood, city, state, zip_code')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    console.log('🔍 [API verificar-cpf] Resultado da busca:', { 
      encontrado: !!userData, 
      erro: userError?.message,
      userId: userData?.id,
      email: userData?.email 
    })

    if (userError) {
      console.error('❌ [API verificar-cpf] Erro ao buscar:', userError)
      return NextResponse.json(
        { error: 'Erro ao verificar CPF' },
        { status: 500 }
      )
    }

    if (!userData) {
      // CPF não encontrado
      console.log('ℹ️ [API verificar-cpf] CPF não encontrado no banco')
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
    console.error('Erro na verificação de CPF:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
