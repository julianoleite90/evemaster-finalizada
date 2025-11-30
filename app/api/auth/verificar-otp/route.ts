import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, otp } = body as { cpf: string; otp: string }

    if (!cpf || !otp) {
      return NextResponse.json(
        { error: 'CPF e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Limpar CPF e OTP
    const cleanCPF = cpf.replace(/\D/g, '')
    const cleanOTP = otp.replace(/\D/g, '')
    
    if (cleanCPF.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    if (cleanOTP.length !== 6) {
      return NextResponse.json(
        { error: 'Código deve ter 6 dígitos' },
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
      .select('id, email, full_name, phone, cpf, address, address_number, address_complement, neighborhood, city, state, zip_code, country')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userError || !userData?.email) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar OTP usando o cliente do servidor (que pode setar cookies)
    const supabase = await createClient()
    
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      email: userData.email,
      token: cleanOTP,
      type: 'email'
    })

    if (verifyError) {
      console.error('Erro ao verificar OTP:', verifyError)
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    if (!sessionData.session) {
      return NextResponse.json(
        { error: 'Falha ao criar sessão' },
        { status: 500 }
      )
    }

    // Retornar dados completos do usuário para preencher o formulário
    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        phone: userData.phone,
        cpf: userData.cpf,
        address: userData.address,
        addressNumber: userData.address_number,
        addressComplement: userData.address_complement,
        neighborhood: userData.neighborhood,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zip_code,
        country: userData.country,
      },
      session: {
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
      }
    })

  } catch (error: any) {
    console.error('Erro ao verificar OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

