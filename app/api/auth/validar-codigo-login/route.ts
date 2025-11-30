import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, cpf, code } = await request.json()

    if (!email || !cpf || !code) {
      return NextResponse.json(
        { error: 'Email, CPF e código são obrigatórios' },
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

    // Verificar código
    const { data: loginCode, error: codeError } = await supabaseAdmin
      .from('quick_login_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('cpf', cleanCPF)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (codeError || !loginCode) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    // Buscar usuário - usar o mesmo método que funcionou no envio do código
    // Primeiro tenta com cliente normal (mesmo que enviar-codigo-login)
    let user = null
    let userError = null
    
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, email, full_name, cpf, phone, gender, address, address_number, address_complement, neighborhood, city, state, zip_code')
      .eq('email', email.toLowerCase())
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userDataError) {
      console.error('❌ [VALIDAR-CODIGO] Erro ao buscar usuário (cliente normal):', {
        error: userDataError.message,
        code: userDataError.code,
        email: email.toLowerCase(),
        cpf: cleanCPF
      })
      // Se falhar com cliente normal, tentar com admin (pode ser problema de RLS)
      const { data: userDataAdmin, error: userErrorAdmin } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, cpf, phone, gender, address, address_number, address_complement, neighborhood, city, state, zip_code')
        .eq('email', email.toLowerCase())
        .eq('cpf', cleanCPF)
        .maybeSingle()
      
      if (userErrorAdmin) {
        return NextResponse.json(
          { error: 'Erro ao buscar usuário', details: userErrorAdmin.message },
          { status: 500 }
        )
      }
      
      user = userDataAdmin
    } else {
      user = userData
    }

    if (!user) {
      console.error('❌ [VALIDAR-CODIGO] Usuário não encontrado:', {
        email: email.toLowerCase(),
        cpf: cleanCPF,
        codeValid: !!loginCode,
        codeEmail: loginCode?.email,
        codeCPF: loginCode?.cpf
      })
      return NextResponse.json(
        { error: 'Usuário não encontrado. Verifique se o email e CPF estão corretos.' },
        { status: 404 }
      )
    }

    console.log('✅ [VALIDAR-CODIGO] Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.full_name
    })

    // Marcar código como usado
    await supabaseAdmin
      .from('quick_login_codes')
      .update({ used: true })
      .eq('id', loginCode.id)

    // Verificar se o usuário existe no auth.users
    // Buscar usuário pelo email usando listUsers
    let authUser = null
    try {
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ [VALIDAR-CODIGO] Erro ao listar usuários do auth:', listError)
        // Não falhar aqui, podemos retornar os dados do usuário mesmo sem auth
      } else {
        authUser = usersList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        console.log('✅ [VALIDAR-CODIGO] Auth user encontrado:', {
          hasAuthUser: !!authUser,
          userId: authUser?.id
        })
      }
    } catch (authError) {
      console.error('❌ [VALIDAR-CODIGO] Erro ao buscar auth user:', authError)
      // Continuar mesmo se não encontrar no auth
    }

    // Gerar magic link para login (se o usuário existir no auth)
    let magicLink = null
    if (authUser) {
      try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email.toLowerCase(),
        })

        if (linkError) {
          console.error('⚠️ [VALIDAR-CODIGO] Erro ao gerar magic link:', linkError)
        } else {
          magicLink = linkData?.properties?.action_link || null
          console.log('✅ [VALIDAR-CODIGO] Magic link gerado:', !!magicLink)
        }
      } catch (linkError) {
        console.error('⚠️ [VALIDAR-CODIGO] Erro ao gerar magic link:', linkError)
      }
    } else {
      console.warn('⚠️ [VALIDAR-CODIGO] Usuário não encontrado no auth.users, mas existe em public.users')
    }

    // Retornar dados do usuário (mesmo se não tiver magic link, o frontend pode fazer login de outra forma)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        cpf: user.cpf,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        address_number: user.address_number,
        address_complement: user.address_complement,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
        zip_code: user.zip_code,
      },
      magicLink: magicLink,
      hasAuthAccount: !!authUser, // Informar se tem conta no auth
    })
  } catch (error: any) {
    console.error('Erro ao validar código de login:', error)
    return NextResponse.json(
      { error: 'Erro ao validar código de login' },
      { status: 500 }
    )
  }
}

