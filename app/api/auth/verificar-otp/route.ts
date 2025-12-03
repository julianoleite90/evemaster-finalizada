import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { rateLimitMiddleware } from '@/lib/security/rate-limit'
import { verificarOTPSchema, validateRequest, formatZodErrors } from '@/lib/schemas/api-validation'
import { authLogger as logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Rate limiting estrito para autenticação (5 tentativas em 15 minutos)
  const rateLimitResponse = await rateLimitMiddleware(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    
    // Validação com Zod
    const validation = validateRequest(verificarOTPSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: formatZodErrors(validation.error) },
        { status: 400 }
      )
    }

    const { cpf: cleanCPF, otp: cleanOTP } = validation.data

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

    // Buscar usuário pelo CPF
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, cpf, age, gender, address, address_number, address_complement, neighborhood, city, state, zip_code')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userError || !userData) {
      logger.warn('Usuário não encontrado')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar código OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('user_id', userData.id)
      .eq('code', cleanOTP)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (otpError || !otpData) {
      logger.warn('Código inválido ou expirado')
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    // Marcar código como usado
    await supabaseAdmin
      .from('otp_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otpData.id)

    // Criar sessão para o usuário usando signInWithPassword ou magic link
    // Como o usuário pode não ter senha, vamos gerar um token de acesso direto
    
    // Verificar se o usuário existe no auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === userData.email.toLowerCase())

    let sessionData = null

    if (authUser) {
      // Usuário existe no auth - gerar link de login
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email,
      })

      if (linkError) {
        logger.error('Erro ao gerar link:', linkError)
      } else if (linkData) {
        // Extrair token do link
        const url = new URL(linkData.properties.action_link)
        const token = url.searchParams.get('token')
        
        if (token) {
          // Verificar o token para obter sessão
          const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })

          if (!verifyError && verifyData.session) {
            sessionData = verifyData.session
          }
        }
      }
    }

    logger.log('Login verificado com sucesso')

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
        age: userData.age,
        gender: userData.gender,
        address: userData.address,
        addressNumber: userData.address_number,
        addressComplement: userData.address_complement,
        neighborhood: userData.neighborhood,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zip_code,
      },
      session: sessionData ? {
        accessToken: sessionData.access_token,
        refreshToken: sessionData.refresh_token,
      } : null
    })

  } catch (error: any) {
    logger.error('Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
