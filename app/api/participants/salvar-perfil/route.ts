import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      cpf,
      birth_date,
      age,
      gender,
      country,
      zip_code,
      address,
      address_number,
      address_complement,
      neighborhood,
      city,
      state,
      shirt_size,
    } = body

    if (!full_name || !email || !cpf) {
      return NextResponse.json(
        { error: 'Nome, email e CPF são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const cleanCPF = cpf.replace(/\D/g, '')

    // Verificar se já existe perfil com este CPF para este usuário
    const { data: existing } = await supabase
      .from('saved_participant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('cpf', cleanCPF)
      .maybeSingle()

    const profileData = {
      user_id: user.id,
      full_name,
      email: email.toLowerCase(),
      phone: phone?.replace(/\D/g, '') || null,
      cpf: cleanCPF,
      birth_date: birth_date || null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      country: country || 'brasil',
      zip_code: zip_code?.replace(/\D/g, '') || null,
      address: address || null,
      address_number: address_number || null,
      address_complement: address_complement || null,
      neighborhood: neighborhood || null,
      city: city || null,
      state: state || null,
      shirt_size: shirt_size || null,
    }

    let result
    if (existing) {
      // Atualizar perfil existente
      const { data, error } = await supabase
        .from('saved_participant_profiles')
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Criar novo perfil
      const { data, error } = await supabase
        .from('saved_participant_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      profile: result,
    })
  } catch (error: any) {
    console.error('Erro ao salvar perfil:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar perfil' },
      { status: 500 }
    )
  }
}

