import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

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

    // Buscar a inscrição com todos os dados necessários
    const { data: registration, error: regError } = await supabase
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

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
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
        console.error('Erro ao gerar pass:', passError)
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
    console.error('Erro ao gerar ingresso para carteira:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar ingresso para carteira', details: error.message },
      { status: 500 }
    )
  }
}
