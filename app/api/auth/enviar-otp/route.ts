import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body as { cpf: string }

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar CPF
    const cleanCPF = cpf.replace(/\D/g, '')
    
    if (cleanCPF.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Buscar email do usuário pelo CPF
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userError || !userData?.email) {
      return NextResponse.json(
        { error: 'CPF não encontrado' },
        { status: 404 }
      )
    }

    // Usar o Supabase Auth OTP (magic link via email)
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email: userData.email,
      options: {
        shouldCreateUser: false, // Não criar usuário novo
      }
    })

    if (otpError) {
      console.error('Erro ao enviar OTP:', otpError)
      return NextResponse.json(
        { error: 'Erro ao enviar código de verificação' },
        { status: 500 }
      )
    }

    // Mascarar email para exibição
    const maskedEmail = userData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

    return NextResponse.json({
      success: true,
      message: 'Código enviado para o email cadastrado',
      maskedEmail,
      userId: userData.id
    })

  } catch (error: any) {
    console.error('Erro ao enviar OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

