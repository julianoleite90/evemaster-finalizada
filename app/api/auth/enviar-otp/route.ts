import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmailOTP } from '@/lib/email/resend'
import { rateLimitMiddleware } from '@/lib/security/rate-limit'
import { enviarOTPSchema, validateRequest, formatZodErrors } from '@/lib/schemas/api-validation'
import { authLogger as logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

// Gerar código de 6 dígitos
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  // Rate limiting estrito para autenticação (5 tentativas em 15 minutos)
  const rateLimitResponse = await rateLimitMiddleware(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    
    // Validação com Zod
    const validation = validateRequest(enviarOTPSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: formatZodErrors(validation.error) },
        { status: 400 }
      )
    }

    const cleanCPF = validation.data.cpf

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

    // 1. Buscar email do usuário pelo CPF na tabela users
    let { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    // 2. Se não encontrou em users, buscar na tabela athletes
    if (!userData && !userError) {
      logger.log('Não encontrado em users, buscando em athletes...')
      
      const { data: athleteData } = await supabaseAdmin
        .from('athletes')
        .select('id, email, full_name, cpf, registration_id')
        .eq('cpf', cleanCPF)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (athleteData && athleteData.registration_id) {
        // Buscar o user_id através da registration
        const { data: regData } = await supabaseAdmin
          .from('registrations')
          .select('user_id')
          .eq('id', athleteData.registration_id)
          .maybeSingle()

        if (regData?.user_id) {
          // Buscar dados do usuário pelo user_id
          const { data: userFromReg } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name')
            .eq('id', regData.user_id)
            .maybeSingle()
          
          if (userFromReg) {
            userData = userFromReg
            logger.log('✅ Usuário encontrado via athletes->registrations->users:', userFromReg.email)
          }
        }
      }
    }

    if (userError || !userData?.email) {
      logger.warn('Usuário não encontrado:', userError)
      return NextResponse.json(
        { error: 'CPF não encontrado' },
        { status: 404 }
      )
    }

    logger.log('Usuário encontrado:', userData.email)

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
      logger.error('Erro ao salvar código:', saveError)
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
      logger.error('Erro ao enviar email:', emailResult.error)
      return NextResponse.json(
        { error: 'Erro ao enviar código por email' },
        { status: 500 }
      )
    }

    // Mascarar email para exibição
    const maskedEmail = userData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

    logger.log('Código enviado com sucesso para:', maskedEmail)

    return NextResponse.json({
      success: true,
      message: 'Código enviado para o email cadastrado',
      maskedEmail,
      userId: userData.id
    })

  } catch (error: any) {
    logger.error('Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
