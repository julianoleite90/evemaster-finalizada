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

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, cpf, phone, birth_date, gender, address, address_number, address_complement, neighborhood, city, state, zip_code')
      .eq('email', email.toLowerCase())
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Marcar código como usado
    await supabaseAdmin
      .from('quick_login_codes')
      .update({ used: true })
      .eq('id', loginCode.id)

    // Fazer login do usuário (criar sessão)
    // Buscar usuário pelo email usando listUsers
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = usersList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    const authError = listError || (!authUser ? { message: 'Usuário não encontrado' } : null)

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Erro ao autenticar usuário' },
        { status: 500 }
      )
    }

    // Retornar dados do usuário (o cliente fará o login com magic link)
    // Gerar magic link para login
    const { data: magicLink, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    })

    if (linkError) {
      console.error('Erro ao gerar magic link:', linkError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        cpf: user.cpf,
        phone: user.phone,
        birth_date: user.birth_date,
        gender: user.gender,
        address: user.address,
        address_number: user.address_number,
        address_complement: user.address_complement,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
        zip_code: user.zip_code,
      },
      magicLink: magicLink?.properties?.action_link || null,
    })
  } catch (error: any) {
    console.error('Erro ao validar código de login:', error)
    return NextResponse.json(
      { error: 'Erro ao validar código de login' },
      { status: 500 }
    )
  }
}

