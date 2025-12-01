import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmailOTP } from '@/lib/email/resend'

export const runtime = 'nodejs'

// Gerar código de 6 dígitos
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body as { cpf: string }

    console.log('📧 [API enviar-otp] Recebido CPF:', cpf)

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
      .select('id, email, full_name')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userError || !userData?.email) {
      console.error('❌ [API enviar-otp] Usuário não encontrado:', userError)
      return NextResponse.json(
        { error: 'CPF não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [API enviar-otp] Usuário encontrado:', userData.email)

    // Gerar código OTP
    const otpCode = generateOTPCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Invalidar códigos anteriores do mesmo usuário
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('user_id', userData.id)

    // Salvar novo código
    const { error: saveError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        user_id: userData.id,
        email: userData.email,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
      })

    if (saveError) {
      console.error('❌ [API enviar-otp] Erro ao salvar código:', saveError)
      return NextResponse.json(
        { error: 'Erro ao gerar código de verificação' },
        { status: 500 }
      )
    }

    // Enviar email via Resend
    const emailResult = await enviarEmailOTP({
      para: userData.email,
      nome: userData.full_name || 'Usuário',
      codigo: otpCode,
    })

    if (!emailResult.success) {
      console.error('❌ [API enviar-otp] Erro ao enviar email:', emailResult.error)
      return NextResponse.json(
        { error: 'Erro ao enviar código por email' },
        { status: 500 }
      )
    }

    // Mascarar email para exibição
    const maskedEmail = userData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

    console.log('✅ [API enviar-otp] Código enviado com sucesso para:', maskedEmail)

    return NextResponse.json({
      success: true,
      message: 'Código enviado para o email cadastrado',
      maskedEmail,
      userId: userData.id
    })

  } catch (error: any) {
    console.error('❌ [API enviar-otp] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
