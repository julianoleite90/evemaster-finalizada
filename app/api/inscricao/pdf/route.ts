import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { evento, ingressos, subtotal, taxa, total, gratuito } = body

    // Gerar HTML do comprovante
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comprovante de Inscrição</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #156634; }
    .logo { font-size: 28px; font-weight: bold; color: #156634; margin-bottom: 10px; }
    .title { font-size: 20px; color: #333; }
    .event-name { background: linear-gradient(135deg, #156634, #1a7a3e); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .event-name h2 { font-size: 18px; }
    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .section-title { font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .participant { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .participant:last-child { border-bottom: none; }
    .participant-name { font-weight: 500; }
    .participant-category { color: #666; font-size: 14px; }
    .participant-value { font-weight: 600; color: #156634; }
    .totals { margin-top: 20px; padding-top: 15px; border-top: 2px solid #156634; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .total-final { font-size: 18px; font-weight: bold; color: #156634; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; }
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
      <div class="title">Comprovante de Inscrição</div>
    </div>

    <div class="event-name">
      <h2>${evento}</h2>
    </div>

    <div class="section">
      <div class="section-title">Participantes</div>
      ${ingressos.map((ing: any, i: number) => `
        <div class="participant">
          <div>
            <div class="participant-name">${ing.participante}</div>
            <div class="participant-category">${ing.categoria}</div>
          </div>
          <div class="participant-value">${ing.valor === 0 ? 'Gratuito' : `R$ ${ing.valor.toFixed(2)}`}</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <div class="section-title">Resumo Financeiro</div>
      <div class="total-row">
        <span>Subtotal</span>
        <span>R$ ${subtotal.toFixed(2)}</span>
      </div>
      ${!gratuito ? `
        <div class="total-row">
          <span>Taxa de serviço</span>
          <span>R$ ${taxa.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="total-row total-final">
        <span>Total</span>
        <span>R$ ${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="status ${gratuito ? 'confirmed' : 'pending'}">
      <strong>${gratuito ? '✓ INSCRIÇÃO CONFIRMADA' : '⏳ AGUARDANDO PAGAMENTO'}</strong>
    </div>

    <div class="qrcode">
      <div class="code">EVE-${Date.now().toString(36).toUpperCase()}</div>
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
        'Content-Disposition': `attachment; filename="inscricao-${evento.replace(/\s+/g, '-').toLowerCase()}.html"`,
      },
    })

  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar comprovante' },
      { status: 500 }
    )
  }
}




