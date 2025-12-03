import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
          description
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

    // Gerar HTML do comprovante
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ingresso - ${event?.name || 'Evento'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #156634; }
    .logo { font-size: 28px; font-weight: bold; color: #156634; margin-bottom: 10px; }
    .title { font-size: 20px; color: #333; }
    .event-name { background: linear-gradient(135deg, #156634, #1a7a3e); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .event-name h2 { font-size: 18px; margin-bottom: 10px; }
    .event-date { font-size: 14px; opacity: 0.9; }
    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .section-title { font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-size: 14px; }
    .info-value { font-weight: 500; color: #333; }
    .status { text-align: center; margin: 30px 0; padding: 15px; border-radius: 8px; }
    .status.confirmed { background: #d4edda; color: #155724; }
    .status.pending { background: #fff3cd; color: #856404; }
    .qrcode { text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #ddd; border-radius: 8px; }
    .qrcode-label { font-size: 12px; color: #666; margin-top: 10px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    .code { font-family: monospace; font-size: 20px; letter-spacing: 3px; color: #156634; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EVEMASTER</div>
      <div class="title">Ingresso de Inscrição</div>
    </div>

    <div class="event-name">
      <h2>${event?.name || 'Evento'}</h2>
      ${event?.event_date ? `<div class="event-date">${new Date(event.event_date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${event?.start_time ? ` às ${event.start_time.substring(0, 5)}` : ''}</div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Participante</div>
      <div class="info-row">
        <span class="info-label">Nome:</span>
        <span class="info-value">${athlete?.full_name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Categoria:</span>
        <span class="info-value">${ticket?.category || 'N/A'}</span>
      </div>
      ${event?.location || event?.address ? `
      <div class="info-row">
        <span class="info-label">Local:</span>
        <span class="info-value">${event.location || event.address || 'N/A'}</span>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">Informações da Inscrição</div>
      <div class="info-row">
        <span class="info-label">Número da Inscrição:</span>
        <span class="info-value">${registration.registration_number || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valor:</span>
        <span class="info-value">${ticket?.is_free ? 'Gratuito' : `R$ ${(payment?.total_amount || ticket?.price || 0).toFixed(2)}`}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Data da Inscrição:</span>
        <span class="info-value">${new Date(registration.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>

    <div class="status ${registration.status === 'confirmed' ? 'confirmed' : 'pending'}">
      <strong>${registration.status === 'confirmed' ? '✓ INSCRIÇÃO CONFIRMADA' : '⏳ AGUARDANDO PAGAMENTO'}</strong>
    </div>

    <div class="qrcode">
      <div class="code">${registration.registration_number || 'N/A'}</div>
      <div class="qrcode-label">Código de Inscrição - Apresente na retirada do kit</div>
    </div>

    <div class="footer">
      <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
      <p style="margin-top: 5px;">Evemaster - Plataforma de Eventos Esportivos</p>
      <p>www.evemaster.com.br</p>
    </div>
  </div>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="ingresso-${registration.registration_number || registrationId}.html"`,
      },
    })

  } catch (error: any) {
    logger.error('Erro ao gerar PDF do ingresso:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar ingresso', details: error.message },
      { status: 500 }
    )
  }
}


