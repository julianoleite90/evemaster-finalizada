import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// @ts-ignore
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

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
          email,
          category
        ),
        payments(
          total_amount,
          payment_status
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
    const ticket = registration.ticket
    const athlete = registration.athletes?.[0] || registration.athletes
    const payment = registration.payments?.[0] || registration.payments

    // Criar PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297] // A4
    })

    // Cores
    const primaryColorR = 21
    const primaryColorG = 102
    const primaryColorB = 52
    const grayColorR = 107
    const grayColorG = 114
    const grayColorB = 128

    // Header simples sem fundo colorido
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColorR, primaryColorG, primaryColorB)
    doc.text('EVEMASTER', 15, 20)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColorR, grayColorG, grayColorB)
    doc.text('Ingresso de Inscrição', 15, 28)

    // Linha tracejada decorativa
    doc.setDrawColor(primaryColorR, primaryColorG, primaryColorB)
    doc.setLineWidth(0.5)
    let yPos = 40
    for (let i = 0; i < 210; i += 5) {
      doc.line(i, yPos, i + 3, yPos)
    }

    yPos = 50

    // Nome do evento
    doc.setTextColor(primaryColorR, primaryColorG, primaryColorB)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const eventName = event?.name || 'Evento'
    const eventNameLines = doc.splitTextToSize(eventName, 180)
    doc.text(eventNameLines, 15, yPos)
    yPos += eventNameLines.length * 8

    // Data e hora
    if (event?.event_date) {
      const eventDate = new Date(event.event_date)
      const dateStr = eventDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(grayColorR, grayColorG, grayColorB)
      doc.text(dateStr + (event?.start_time ? ` às ${event.start_time.substring(0, 5)}` : ''), 15, yPos)
      yPos += 8
    }

    // Local
    if (event?.location || event?.address) {
      doc.text(event.location || event.address || '', 15, yPos)
      yPos += 8
    }

    yPos += 5

    // Seção de informações
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(15, yPos, 195, yPos)
    yPos += 10

    // Participante
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColorR, primaryColorG, primaryColorB)
    doc.text('Participante', 15, yPos)
    yPos += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Nome: ${athlete?.full_name || 'N/A'}`, 20, yPos)
    yPos += 6
    doc.text(`Categoria: ${ticket?.category || 'N/A'}`, 20, yPos)
    yPos += 6
    if (registration.shirt_size) {
      doc.text(`Tamanho da Camiseta: ${registration.shirt_size}`, 20, yPos)
      yPos += 6
    }

    yPos += 5

    // Informações da inscrição
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColorR, primaryColorG, primaryColorB)
    doc.text('Informações da Inscrição', 15, yPos)
    yPos += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Número: ${registration.registration_number || 'N/A'}`, 20, yPos)
    yPos += 6
    doc.text(`Valor: ${ticket?.is_free ? 'Gratuito' : `R$ ${(payment?.total_amount || ticket?.price || 0).toFixed(2)}`}`, 20, yPos)
    yPos += 6
    doc.text(`Data da Inscrição: ${new Date(registration.created_at).toLocaleDateString('pt-BR')}`, 20, yPos)
    yPos += 6

    // Status
    yPos += 5
    const statusColorR = registration.status === 'confirmed' ? 212 : 255
    const statusColorG = registration.status === 'confirmed' ? 237 : 243
    const statusColorB = registration.status === 'confirmed' ? 218 : 205
    const statusTextR = registration.status === 'confirmed' ? 21 : 133
    const statusTextG = registration.status === 'confirmed' ? 87 : 100
    const statusTextB = registration.status === 'confirmed' ? 36 : 4
    doc.setFillColor(statusColorR, statusColorG, statusColorB)
    doc.roundedRect(15, yPos - 5, 180, 8, 2, 2, 'F')
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(statusTextR, statusTextG, statusTextB)
    doc.text(registration.status === 'confirmed' ? '✓ INSCRIÇÃO CONFIRMADA' : '⏳ AGUARDANDO PAGAMENTO', 105, yPos, { align: 'center' })
    yPos += 15

    // Código da inscrição
    const qrCodeData = registration.registration_number || registrationId
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColorR, grayColorG, grayColorB)
    doc.text('Código de Inscrição', 15, yPos)
    yPos += 6
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColorR, primaryColorG, primaryColorB)
    doc.text(qrCodeData, 15, yPos)
    yPos += 10

    // Imagem do evento pequena (se disponível)
    if (event?.banner_url) {
      try {
        // Tentar carregar a imagem
        const imageResponse = await fetch(event.banner_url)
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer()
          const imageBase64 = Buffer.from(imageBuffer).toString('base64')
          const imageDataURL = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${imageBase64}`
          
          // Adicionar imagem pequena (40x40mm)
          doc.addImage(imageDataURL, 'JPEG', 15, yPos, 40, 40)
        }
      } catch (imgError) {
        // Se falhar ao carregar imagem, continuar sem ela
        console.error('Erro ao carregar imagem do evento:', imgError)
      }
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColorR, grayColorG, grayColorB)
    doc.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 20, { align: 'center' })
    doc.text('Evemaster - Plataforma de Eventos Esportivos', 105, pageHeight - 15, { align: 'center' })
    doc.text('www.evemaster.com.br', 105, pageHeight - 10, { align: 'center' })

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
    console.error('Erro ao gerar PDF do ingresso:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar ingresso', details: error.message },
      { status: 500 }
    )
  }
}

