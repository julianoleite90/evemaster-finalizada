import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar CPF (remover caracteres não numéricos)
    const cleanCPF = cpf.replace(/\D/g, '')

    if (cleanCPF.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar usuário pelo CPF
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, cpf')
      .eq('cpf', cleanCPF)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return NextResponse.json(
        { error: 'Erro ao verificar CPF' },
        { status: 500 }
      )
    }

    if (user) {
      return NextResponse.json({
        exists: true,
        email: user.email,
        name: user.full_name,
      })
    }

    return NextResponse.json({
      exists: false,
    })
  } catch (error: any) {
    console.error('Erro ao verificar CPF:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar CPF' },
      { status: 500 }
    )
  }
}

