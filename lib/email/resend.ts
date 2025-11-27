import PDFDocument from 'pdfkit'
import { Resend } from 'resend'

// Verificar variáveis de ambiente
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || 'Evemaster <inscricoes@evemaster.app>'

// Log SEMPRE (também em produção para debug)
console.log('🔧 [Resend] Configuração ao iniciar:', {
  hasApiKey: !!resendApiKey,
  apiKeyPrefix: resendApiKey?.substring(0, 3) || 'N/A',
  apiKeyLength: resendApiKey?.length || 0,
  fromEmail: resendFromEmail,
  nodeEnv: process.env.NODE_ENV,
})

const resendClient = resendApiKey ? new Resend(resendApiKey) : null

if (!resendClient) {
  console.error('❌ [Resend] Cliente não foi criado! Verifique RESEND_API_KEY')
}

export interface EmailInscricao {
  para: string
  nomeParticipante: string
  nomeEvento: string
  dataEvento: string
  horaEvento?: string
  localEvento: string
  descricaoEvento?: string
  categoria: string
  valor: number
  gratuito: boolean
  codigoInscricao: string
  resumoFinanceiro?: {
    subtotal: number
    taxa: number
    total: number
  }
}

export async function enviarEmailConfirmacao(dados: EmailInscricao) {
  console.log('📧 [Resend] Iniciando envio de email para:', dados.para)
  
  if (!resendApiKey) {
    console.error('❌ [Resend] RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não inicializado')
    return { success: false, error: 'Cliente Resend não inicializado' }
  }

  // PDF temporariamente desabilitado devido a problemas com fontes no serverless
  // TODO: Implementar geração de PDF com biblioteca compatível com serverless
  console.log('📧 [Resend] PDF desabilitado temporariamente (problema com fontes no serverless)')
  const pdfBuffer = Buffer.from('')

  try {
    console.log('📧 [Resend] Enviando email via Resend API...', {
      from: resendFromEmail,
      to: dados.para,
      subject: `Confirmação da sua inscrição - ${dados.nomeEvento}`,
    })

    const emailPayload = {
      from: resendFromEmail,
      to: dados.para,
      subject: `Confirmação da sua inscrição - ${dados.nomeEvento}`,
      html: gerarTemplateEmail(dados),
      attachments: pdfBuffer.length > 0 ? [
        {
          filename: `ingresso-${dados.codigoInscricao}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ] : undefined,
    }

    console.log('📧 [Resend] Payload completo:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      hasAttachments: !!emailPayload.attachments && emailPayload.attachments.length > 0,
    })

    const response = await resendClient.emails.send(emailPayload)

    console.log('📧 [Resend] Resposta do Resend:', {
      hasError: !!response.error,
      hasData: !!response.data,
      error: response.error,
      dataId: response.data?.id,
    })

    if (response.error) {
      console.error('❌ [Resend] Erro detalhado:', JSON.stringify(response.error, null, 2))
      return { 
        success: false, 
        error: response.error,
        errorMessage: typeof response.error === 'object' ? JSON.stringify(response.error) : String(response.error)
      }
    }

    if (!response.data) {
      console.error('❌ [Resend] Resposta sem data e sem error - resposta inesperada')
      return { 
        success: false, 
        error: 'Resposta inesperada do Resend (sem data e sem error)'
      }
    }

    console.log('✅ [Resend] Email enviado com sucesso! ID:', response.data.id)
    return { success: true, data: response.data }
  } catch (error: any) {
    console.error('❌ [Resend] Erro inesperado:', error)
    return { success: false, error: error.message || error }
  }
}

export function gerarTemplateEmail(dados: EmailInscricao): string {
  const {
    nomeParticipante,
    nomeEvento,
    dataEvento,
    horaEvento,
    localEvento,
    descricaoEvento,
    categoria,
    valor,
    gratuito,
    codigoInscricao,
  } = dados

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição Confirmada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 40px 30px; text-align: center;">
              <!-- Logo -->
              <div style="margin-bottom: 20px;">
                <img src="https://evemaster.app/images/logo/logo.png" alt="Evemaster" height="50" style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
              </div>
              <!-- Check de Confirmação -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 80px; height: 80px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 48px; color: #ffffff; line-height: 80px; display: inline-block;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Inscrição Confirmada!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Sua participação está garantida
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>${nomeParticipante}</strong>,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Sua inscrição para o evento foi ${gratuito ? 'confirmada' : 'registrada'} com sucesso!
              </p>

              <!-- Event Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #156634; margin: 0 0 20px; font-size: 22px; font-weight: 700;">
                      ${nomeEvento}
                    </h2>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                <span style="font-size: 18px;">📅</span>
                              </td>
                              <td>
                                <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #333333; display: block; margin-bottom: 4px;">Data:</strong>
                                  <span>${dataEvento}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${horaEvento ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                <span style="font-size: 18px;">🕐</span>
                              </td>
                              <td>
                                <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #333333; display: block; margin-bottom: 4px;">Horário:</strong>
                                  <span>${horaEvento}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                <span style="font-size: 18px;">📍</span>
                              </td>
                              <td>
                                <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #333333; display: block; margin-bottom: 4px;">Sede do evento:</strong>
                                  <span>${localEvento}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${
                        descricaoEvento
                          ? `<tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                <span style="font-size: 18px;">📝</span>
                              </td>
                              <td>
                                <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #333333; display: block; margin-bottom: 4px;">Descrição:</strong>
                                  <span>${descricaoEvento}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                <span style="font-size: 18px;">🏃</span>
                              </td>
                              <td>
                                <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #333333; display: block; margin-bottom: 4px;">Categoria:</strong>
                                  <span>${categoria}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                                <span style="font-size: 18px;">💰</span>
                              </td>
                              <td>
                                <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                                  <strong style="color: #333333; display: block; margin-bottom: 4px;">Valor:</strong>
                                  <span style="color: #156634; font-weight: 600; font-size: 16px;">${
                                    gratuito ? 'Gratuito' : `R$ ${valor.toFixed(2)}`
                                  }</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Código da Inscrição -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #156634; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #ffffff; margin: 0 0 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Código da Inscrição
                    </p>
                    <p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                      ${codigoInscricao}
                    </p>
                  </td>
                </tr>
              </table>

              ${!gratuito ? `
              <!-- Aviso de Pagamento -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">
                      <strong>⚠️ Pagamento Pendente:</strong> Sua inscrição será confirmada após a aprovação do pagamento.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="https://evemaster.app/my-account" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Acessar Área de Membros
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Você também pode gerenciar suas inscrições, baixar comprovantes e acompanhar o status do pagamento na sua área de membros.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Evemaster - Plataforma de Eventos Esportivos
              </p>
              <p style="margin: 0;">
                <a href="https://evemaster.app/politica-de-privacidade" style="color: #666666; text-decoration: none; font-size: 12px; margin: 0 10px;">
                  Política de Privacidade
                </a>
                |
                <a href="https://evemaster.app/termos-de-uso" style="color: #666666; text-decoration: none; font-size: 12px; margin: 0 10px;">
                  Termos de Uso
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Função para gerar PDF da inscrição
export async function gerarPDFInscricao(dados: EmailInscricao): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Usar fonte padrão que funciona no serverless
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        // Não especificar fonte customizada para evitar problemas no serverless
      })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk as Buffer))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (error) => reject(error))

      doc
        .fontSize(20)
        .fillColor('#156634')
        .text('Comprovante de Inscrição', { align: 'center' })
      doc.moveDown()

      doc
        .fontSize(14)
        .fillColor('#333333')
        .text(`Evento: ${dados.nomeEvento}`)
      doc.text(`Data: ${dados.dataEvento}${dados.horaEvento ? ` às ${dados.horaEvento}` : ''}`)
      doc.text(`Local: ${dados.localEvento}`)
      if (dados.descricaoEvento) {
        doc.moveDown(0.5)
        doc.fontSize(12).fillColor('#555555').text(dados.descricaoEvento)
      }

      doc.moveDown()
      doc.fontSize(16).fillColor('#156634').text('Participante')
      doc.fontSize(12).fillColor('#333333')
      doc.text(`Nome: ${dados.nomeParticipante}`)
      doc.text(`Categoria: ${dados.categoria}`)
      doc.text(`Valor: ${dados.gratuito ? 'Gratuito' : `R$ ${dados.valor.toFixed(2)}`}`)
      doc.text(`Código da inscrição: ${dados.codigoInscricao}`)

      if (dados.resumoFinanceiro) {
        doc.moveDown()
        doc.fontSize(16).fillColor('#156634').text('Resumo financeiro')
        doc.fontSize(12).fillColor('#333333')
        doc.text(`Subtotal: R$ ${dados.resumoFinanceiro.subtotal.toFixed(2)}`)
        if (!dados.gratuito) {
          doc.text(`Taxa: R$ ${dados.resumoFinanceiro.taxa.toFixed(2)}`)
        }
        doc.text(`Total: R$ ${dados.resumoFinanceiro.total.toFixed(2)}`)
      }

      doc.moveDown()
      doc.fontSize(12).fillColor('#156634').text('Apresente este comprovante no dia do evento.')
      doc.fontSize(10).fillColor('#888888')
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'right' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}



