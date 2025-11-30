import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { enviarEmailCodigoLogin } from '@/lib/email/resend'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, cpf } = await request.json()

    if (!email || !cpf) {
      return NextResponse.json(
        { error: 'Email e CPF são obrigatórios' },
        { status: 400 }
      )
    }

    const cleanCPF = cpf.replace(/\D/g, '')

    const supabase = await createClient()
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }
    
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o usuário existe e o CPF corresponde
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, cpf')
      .eq('email', email.toLowerCase())
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou CPF não corresponde' },
        { status: 404 }
      )
    }

    // Gerar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString()

    // Salvar código no banco (expira em 10 minutos)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    const { error: codeError } = await supabaseAdmin
      .from('quick_login_codes')
      .insert({
        email: email.toLowerCase(),
        cpf: cleanCPF,
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (codeError) {
      console.error('Erro ao salvar código:', codeError)
      return NextResponse.json(
        { error: 'Erro ao gerar código de login' },
        { status: 500 }
      )
    }

    // Enviar email com código
    try {
      await enviarEmailCodigoLogin(email, user.full_name || email, code)
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      // Não falhar se o email não for enviado, mas logar o erro
    }

    return NextResponse.json({
      success: true,
      message: 'Código enviado para seu email',
    })
  } catch (error: any) {
    console.error('Erro ao enviar código de login:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar código de login' },
      { status: 500 }
    )
  }
}

