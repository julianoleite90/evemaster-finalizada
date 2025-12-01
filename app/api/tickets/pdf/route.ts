import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logError } from '@/lib/logger'
// @ts-ignore
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId } = body as { registrationId: string }

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID da inscrição é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
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
          description,
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
        ),
        payments(
          total_amount,
          payment_status
        )
      `)
      .eq('id', registrationId)
      .or(`athlete_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .single()

    registration = regData
    regError = regErr

    // Se não encontrou com RLS, tentar com admin client (bypass RLS)
    if (regError || !registration) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        const { data: adminRegData, error: adminRegErr } = await supabaseAdmin
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
              description,
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
            ),
            payments(
              total_amount,
              payment_status
            )
          `)
          .eq('id', registrationId)
          .single()

        if (adminRegData) {
          // Verificar se a inscrição pertence ao usuário de várias formas:
          // 1. athlete_id ou buyer_id corresponde ao user.id
          // 2. Email do atleta corresponde ao email do usuário
          const userEmail = user.email?.toLowerCase()
          const athleteEmail = adminRegData.athletes?.[0]?.email?.toLowerCase() || adminRegData.athletes?.email?.toLowerCase()
          
          const isOwner = 
            adminRegData.athlete_id === user.id || 
            adminRegData.buyer_id === user.id ||
            adminRegData.user_id === user.id ||
            (userEmail && athleteEmail && userEmail === athleteEmail)
          
          if (isOwner) {
            registration = adminRegData
            regError = null
          } else {
            console.log('Acesso negado:', {
              registrationId,
              userId: user.id,
              userEmail,
              athleteId: adminRegData.athlete_id,
              buyerId: adminRegData.buyer_id,
              athleteEmail
            })
            return NextResponse.json(
              { error: 'Você não tem permissão para acessar esta inscrição' },
              { status: 403 }
            )
          }
        }
      }
    }

    if (regError || !registration) {
      console.error('Erro ao buscar inscrição:', regError)
      return NextResponse.json(
        { error: 'Inscrição não encontrada', details: regError?.message },
        { status: 404 }
      )
    }

    const event = registration.event
    const ticket = registration.ticket
    const athlete = registration.athletes?.[0] || registration.athletes
    const payment = registration.payments?.[0] || registration.payments

    // Criar PDF - formato ingresso (mais compacto)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297] // A4
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)

    // Cores
    const green = { r: 21, g: 102, b: 52 }
    const darkGreen = { r: 16, g: 77, b: 39 }
    const lightGreen = { r: 220, g: 237, b: 225 }
    const gray = { r: 107, g: 114, b: 128 }
    const lightGray = { r: 243, g: 244, b: 246 }
    const white = { r: 255, g: 255, b: 255 }
    const black = { r: 0, g: 0, b: 0 }

    // ========== HEADER VERDE ==========
    doc.setFillColor(green.r, green.g, green.b)
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    // Logo/Marca
    doc.setTextColor(white.r, white.g, white.b)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text('EVEMASTER', margin, 25)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Ingresso Digital', margin, 35)
    
    // Número do ingresso no canto direito
    doc.setFontSize(10)
    doc.text('Nº', pageWidth - margin - 45, 20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(registration.registration_number || 'N/A', pageWidth - margin - 45, 30)

    let yPos = 60

    // ========== CARD DO EVENTO ==========
    // Fundo do card
    doc.setFillColor(white.r, white.g, white.b)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos - 5, contentWidth, 75, 4, 4, 'FD')
    
    // Banner do evento (se disponível)
    let bannerLoaded = false
    if (event?.banner_url) {
      try {
        const imageResponse = await fetch(event.banner_url)
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer()
          const imageBase64 = Buffer.from(imageBuffer).toString('base64')
          const imageDataURL = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${imageBase64}`
          doc.addImage(imageDataURL, 'JPEG', margin + 3, yPos, 50, 35)
          bannerLoaded = true
        }
      } catch (imgError) {
        console.error('Erro ao carregar imagem:', imgError)
      }
    }
    
    // Placeholder se não tiver banner
    if (!bannerLoaded) {
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b)
      doc.roundedRect(margin + 3, yPos, 50, 35, 2, 2, 'F')
      doc.setTextColor(gray.r, gray.g, gray.b)
      doc.setFontSize(8)
      doc.text('EVENTO', margin + 28, yPos + 20, { align: 'center' })
    }
    
    // Info do evento ao lado do banner
    const infoX = margin + 60
    doc.setTextColor(green.r, green.g, green.b)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const eventName = event?.name || 'Evento'
    const eventNameLines = doc.splitTextToSize(eventName, 110)
    doc.text(eventNameLines, infoX, yPos + 8)
    
    const nameHeight = eventNameLines.length * 5
    
    // Data
    doc.setTextColor(gray.r, gray.g, gray.b)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (event?.event_date) {
      const eventDate = new Date(event.event_date + 'T12:00:00')
      const dateStr = eventDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      const timeStr = event?.start_time ? ` • ${event.start_time.substring(0, 5)}` : ''
      doc.text(`📅  ${dateStr}${timeStr}`, infoX, yPos + nameHeight + 12)
    }
    
    // Local
    if (event?.location || event?.address) {
      const location = event.location || event.address || ''
      const locationLines = doc.splitTextToSize(location, 100)
      doc.text(`📍  ${locationLines[0]}`, infoX, yPos + nameHeight + 20)
    }
    
    // Categoria (badge)
    doc.setFillColor(lightGreen.r, lightGreen.g, lightGreen.b)
    doc.roundedRect(margin + 3, yPos + 40, 50, 8, 2, 2, 'F')
    doc.setTextColor(darkGreen.r, darkGreen.g, darkGreen.b)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(ticket?.category || 'Categoria', margin + 28, yPos + 45.5, { align: 'center' })
    
    // Valor
    doc.setTextColor(green.r, green.g, green.b)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const valorStr = ticket?.is_free ? 'GRATUITO' : `R$ ${(payment?.total_amount || ticket?.price || 0).toFixed(2)}`
    doc.text(valorStr, infoX, yPos + 48)
    
    // Status
    yPos += 55
    const isConfirmed = registration.status === 'confirmed'
    doc.setFillColor(isConfirmed ? 220 : 254, isConfirmed ? 252 : 243, isConfirmed ? 231 : 199)
    doc.roundedRect(margin + 3, yPos, contentWidth - 6, 10, 2, 2, 'F')
    doc.setTextColor(isConfirmed ? 22 : 146, isConfirmed ? 163 : 64, isConfirmed ? 74 : 14)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(isConfirmed ? '✓ INSCRIÇÃO CONFIRMADA' : '⏳ AGUARDANDO PAGAMENTO', margin + contentWidth / 2, yPos + 7, { align: 'center' })

    yPos += 25

    // ========== LINHA TRACEJADA (DESTACAR) ==========
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    // Linha tracejada manual
    for (let i = margin; i < pageWidth - margin; i += 4) {
      doc.line(i, yPos, i + 2, yPos)
    }
    
    // Círculos nas bordas (efeito de corte)
    doc.setFillColor(245, 245, 245)
    doc.circle(margin - 3, yPos, 6, 'F')
    doc.circle(pageWidth - margin + 3, yPos, 6, 'F')
    
    // Texto "destaque aqui"
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(7)
    doc.text('- - - destaque aqui - - -', pageWidth / 2, yPos - 2, { align: 'center' })

    yPos += 15

    // ========== DADOS DO PARTICIPANTE ==========
    // Card esquerdo
    doc.setFillColor(lightGray.r, lightGray.g, lightGray.b)
    doc.roundedRect(margin, yPos, (contentWidth / 2) - 5, 55, 3, 3, 'F')
    
    doc.setTextColor(gray.r, gray.g, gray.b)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('PARTICIPANTE', margin + 5, yPos + 8)
    
    doc.setTextColor(black.r, black.g, black.b)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const athleteName = athlete?.full_name || 'N/A'
    const nameLines = doc.splitTextToSize(athleteName, 75)
    doc.text(nameLines, margin + 5, yPos + 18)
    
    doc.setTextColor(gray.r, gray.g, gray.b)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (registration.shirt_size) {
      doc.text(`Camiseta: ${registration.shirt_size}`, margin + 5, yPos + 32)
    }
    doc.text(`Inscrição: ${new Date(registration.created_at).toLocaleDateString('pt-BR')}`, margin + 5, yPos + 40)
    
    // Card direito - QR Code
    const qrX = margin + (contentWidth / 2) + 5
    doc.setFillColor(white.r, white.g, white.b)
    doc.setDrawColor(green.r, green.g, green.b)
    doc.setLineWidth(1)
    doc.roundedRect(qrX, yPos, (contentWidth / 2) - 5, 55, 3, 3, 'FD')
    
    // Gerar QR Code
    const qrCodeData = registration.registration_number || registrationId
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
        width: 150,
        margin: 1,
        color: { dark: '#156634', light: '#ffffff' }
      })
      doc.addImage(qrCodeDataURL, 'PNG', qrX + 17, yPos + 5, 35, 35)
    } catch (qrError) {
      console.error('Erro ao gerar QR Code:', qrError)
    }
    
    doc.setTextColor(gray.r, gray.g, gray.b)
    doc.setFontSize(7)
    doc.text('APRESENTE NO CHECK-IN', qrX + (contentWidth / 4) - 2.5, yPos + 45, { align: 'center' })
    doc.setTextColor(green.r, green.g, green.b)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(qrCodeData, qrX + (contentWidth / 4) - 2.5, yPos + 52, { align: 'center' })

    yPos += 70

    // ========== INSTRUÇÕES ==========
    doc.setFillColor(lightGreen.r, lightGreen.g, lightGreen.b)
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F')
    
    doc.setTextColor(darkGreen.r, darkGreen.g, darkGreen.b)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('📋 INSTRUÇÕES', margin + 5, yPos + 8)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('• Apresente este ingresso (impresso ou digital) no check-in do evento', margin + 5, yPos + 16)
    doc.text('• Chegue com antecedência para retirada do kit', margin + 5, yPos + 22)
    doc.text('• Este ingresso é pessoal e intransferível', margin + 5, yPos + 28)

    // ========== FOOTER ==========
    doc.setTextColor(gray.r, gray.g, gray.b)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} • evemaster.app`, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Gerar buffer do PDF
    const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ingresso-${registration.registration_number || registrationId}.pdf"`,
      },
    })

  } catch (error: any) {
    logError(error, 'Erro ao gerar PDF do ingresso', {
      route: '/api/tickets/pdf',
      method: 'POST',
      registrationId: request.body ? 'provided' : 'missing',
    })
    return NextResponse.json(
      { error: 'Erro ao gerar ingresso', details: error.message },
      { status: 500 }
    )
  }
}

