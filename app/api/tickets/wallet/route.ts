import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, walletType = 'apple' } = body as { registrationId: string; walletType?: 'apple' | 'google' | 'samsung' }

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID da inscrição é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Tentar buscar com o cliente normal primeiro (respeitando RLS)
    let registration = null
    let regError = null

    const { data: regData, error: regErr } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(
          id,
          name,
          slug,
          event_date,
          start_time,
          location,
          address,
          banner_url
        ),
        ticket:tickets(
          id,
          category,
          price,
          is_free
        ),
        athletes(
          full_name,
          email
        )
      `)
      .eq('id', registrationId)
      .or(`athlete_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .single()

    registration = regData
    regError = regErr

    // Se não encontrou com RLS, tentar com admin client
    if (regError || !registration) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })

        const { data: adminRegData } = await supabaseAdmin
          .from('registrations')
          .select(`
            *,
            event:events(
              id,
              name,
              slug,
              event_date,
              start_time,
              location,
              address,
              banner_url
            ),
            ticket:tickets(
              id,
              category,
              price,
              is_free
            ),
            athletes(
              full_name,
              email
            )
          `)
          .eq('id', registrationId)
          .single()

        // Verificar se pertence ao usuário
        if (adminRegData && (adminRegData.athlete_id === user.id || adminRegData.buyer_id === user.id)) {
          registration = adminRegData
          regError = null
        }
      }
    }

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada ou você não tem permissão' },
        { status: 404 }
      )
    }

    const event = registration.event
    const athlete = registration.athletes?.[0] || registration.athletes
    const qrCodeData = registration.registration_number || registrationId

    // Para Apple Wallet
    if (walletType === 'apple') {
      // Verificar se temos certificados configurados
      const certPath = process.env.APPLE_CERT_PATH
      const keyPath = process.env.APPLE_KEY_PATH
      const wwdrPath = process.env.APPLE_WWDR_PATH

      // Se não tiver certificados, retornar dados para integração futura
      if (!certPath || !keyPath || !wwdrPath) {
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#156634',
            light: '#FFFFFF'
          }
        })

        return NextResponse.json({
          message: 'Para adicionar à Apple Wallet, é necessário configurar os certificados Apple Developer',
          instructions: 'Configure as variáveis de ambiente: APPLE_PASS_TYPE_IDENTIFIER, APPLE_TEAM_IDENTIFIER, APPLE_CERT_PATH, APPLE_KEY_PATH e APPLE_WWDR_PATH',
          passData: {
            eventName: event?.name,
            registrationNumber: qrCodeData,
            participant: athlete?.full_name,
            date: event?.event_date ? new Date(event.event_date).toLocaleDateString('pt-BR') : '',
            location: event?.location || event?.address || '',
            qrCode: qrCodeDataURL
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      // Se tiver certificados, tentar gerar o .pkpass
      try {
        // @ts-ignore
        const { PKPass } = await import('passkit-generator')
        
        // Criar pass básico (precisa de um modelo .pass)
        // Por enquanto, retornamos instruções para configurar
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#156634',
            light: '#FFFFFF'
          }
        })

        return NextResponse.json({
          message: 'Geração de .pkpass requer um modelo de pass. Configure um modelo em ./passes/Pass.pass',
          passData: {
            eventName: event?.name,
            registrationNumber: qrCodeData,
            participant: athlete?.full_name,
            date: event?.event_date ? new Date(event.event_date).toLocaleDateString('pt-BR') : '',
            location: event?.location || event?.address || '',
            qrCode: qrCodeDataURL
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (passError: any) {
        logger.error('Erro ao gerar pass:', passError)
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#156634',
            light: '#FFFFFF'
          }
        })

        return NextResponse.json({
          message: 'Erro ao gerar arquivo .pkpass',
          error: passError.message,
          passData: {
            eventName: event?.name,
            registrationNumber: qrCodeData,
            qrCode: qrCodeDataURL
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
    }

    // Para Google Wallet
    if (walletType === 'google') {
      // Google Wallet API requer configuração específica
      // Por enquanto, retornamos dados para integração futura
      const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#156634',
          light: '#FFFFFF'
        }
      })

      return NextResponse.json({
        message: 'Integração com Google Wallet em desenvolvimento',
        instructions: 'Configure GOOGLE_WALLET_ISSUER_ID e GOOGLE_WALLET_CLASS_ID nas variáveis de ambiente',
        passData: {
          eventName: event?.name,
          registrationNumber: qrCodeData,
          participant: athlete?.full_name,
          date: event?.event_date ? new Date(event.event_date).toLocaleDateString('pt-BR') : '',
          location: event?.location || event?.address || '',
          qrCode: qrCodeDataURL
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return NextResponse.json(
      { error: 'Tipo de carteira não suportado' },
      { status: 400 }
    )

  } catch (error: any) {
    logger.error('Erro ao gerar ingresso para carteira:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar ingresso para carteira', details: error.message },
      { status: 500 }
    )
  }
}
