import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { cpf, email, primeiroNome } = await request.json()

    if (!cpf && !email && !primeiroNome) {
      return NextResponse.json(
        { error: 'CPF, email ou primeiro nome é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    let user = null

    // Se tiver CPF, buscar por CPF
    if (cpf) {
      const cleanCPF = cpf.replace(/\D/g, '')
      if (cleanCPF.length === 11) {
        const { data: userByCPF } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, cpf, phone, address, address_number, address_complement, neighborhood, city, state, zip_code')
          .eq('cpf', cleanCPF)
          .maybeSingle()
        
        if (userByCPF) {
          user = userByCPF
        } else {
          // Tentar buscar removendo formatação
          const { data: allUsers } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, cpf, phone, address, address_number, address_complement, neighborhood, city, state, zip_code')
            .not('cpf', 'is', null)
            .neq('cpf', '')
          
          if (allUsers) {
            user = allUsers.find(u => {
              if (!u.cpf) return false
              return u.cpf.replace(/\D/g, '') === cleanCPF
            }) || null
          }
        }
      }
    }

    // Se não encontrou por CPF e tem email, buscar por email
    if (!user && email) {
      const { data: userByEmail } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, cpf, phone, address, address_number, address_complement, neighborhood, city, state, zip_code')
        .eq('email', email.toLowerCase())
        .maybeSingle()
      
      if (userByEmail) {
        user = userByEmail
      }
    }

    // Se não encontrou e tem primeiro nome, buscar por primeiro nome + email ou CPF
    if (!user && primeiroNome && (email || cpf)) {
      const primeiroNomeLower = primeiroNome.toLowerCase().trim().split(' ')[0]
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, cpf, phone, address, address_number, address_complement, neighborhood, city, state, zip_code')
        .not('full_name', 'is', null)
      
      if (allUsers) {
        user = allUsers.find(u => {
          if (!u.full_name) return false
          const nomeLower = u.full_name.toLowerCase().trim()
          const primeiroNomeUser = nomeLower.split(' ')[0]
          
          if (primeiroNomeUser === primeiroNomeLower) {
            // Verificar se email ou CPF também correspondem
            if (email && u.email?.toLowerCase() === email.toLowerCase()) {
              return true
            }
            if (cpf) {
              const cleanCPF = cpf.replace(/\D/g, '')
              const userCPF = u.cpf?.replace(/\D/g, '') || ''
              if (cleanCPF.length === 11 && userCPF === cleanCPF) {
                return true
              }
            }
          }
          return false
        }) || null
      }
    }

    if (user) {
      // Retornar TODOS os dados do usuário, incluindo endereço completo
      return NextResponse.json({
        found: true,
        user: {
          id: user.id,
          email: user.email || null,
          full_name: user.full_name || null,
          cpf: user.cpf || null,
          phone: user.phone || null,
          address: user.address || null,
          address_number: user.address_number || null,
          address_complement: user.address_complement || null,
          neighborhood: user.neighborhood || null,
          city: user.city || null,
          state: user.state || null,
          zip_code: user.zip_code || null,
        }
      })
    }

    return NextResponse.json({
      found: false,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

