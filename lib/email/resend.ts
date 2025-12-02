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
                    <a href="https://evemaster.app/login" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Acessar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Faça login para gerenciar suas inscrições, baixar comprovantes e acompanhar o status do pagamento.
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

// Função para enviar email de convite de afiliado
export async function enviarEmailConviteAfiliado(dados: {
  email: string
  nomeEvento: string
  dataEvento?: string
  comissao: string
  tipoComissao: 'percentage' | 'fixed'
  token: string
  usuarioExiste: boolean
}) {
  console.log('📧 [Resend] Enviando email de convite de afiliado para:', dados.email)
  
  if (!resendApiKey) {
    console.error('❌ [Resend] RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não inicializado')
    return { success: false, error: 'Cliente Resend não inicializado' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.app'
  const acceptUrl = `${baseUrl}/affiliate/accept?token=${dados.token}`
  const registerUrl = `${baseUrl}/register?affiliate_token=${dados.token}`

  const emailHtml = gerarTemplateEmailConviteAfiliado(dados, acceptUrl, registerUrl)

  try {
    const response = await resendClient.emails.send({
      from: resendFromEmail,
      to: dados.email,
      subject: `Convite para ser Afiliado - ${dados.nomeEvento}`,
      html: emailHtml,
    })

    if (response.error) {
      console.error('❌ [Resend] Erro ao enviar email de convite:', response.error)
      return { success: false, error: response.error.message || 'Erro ao enviar email' }
    }

    console.log('✅ [Resend] Email de convite enviado com sucesso:', response.data?.id)
    return { success: true, messageId: response.data?.id }
  } catch (error: any) {
    console.error('❌ [Resend] Erro ao enviar email de convite:', error)
    return { success: false, error: error.message || 'Erro ao enviar email' }
  }
}

// Função para enviar email com credenciais do usuário criado
export async function enviarEmailCredenciaisUsuario(dados: {
  email: string
  nome: string
  senha: string
  organizadorNome: string
}) {
  console.log('📧 [Resend] Enviando email com credenciais para:', dados.email)
  
  if (!resendApiKey) {
    console.error('❌ [Resend] RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não inicializado')
    return { success: false, error: 'Cliente Resend não inicializado' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evemaster.app'
  const loginUrl = `${baseUrl}/login/organizer`

  const emailHtml = gerarTemplateEmailCredenciaisUsuario(dados, loginUrl)

  try {
    const response = await resendClient.emails.send({
      from: resendFromEmail,
      to: dados.email,
      subject: `Bem-vindo(a) ao ${dados.organizadorNome} - Suas credenciais de acesso`,
      html: emailHtml,
    })

    if (response.error) {
      console.error('❌ [Resend] Erro ao enviar email de credenciais:', response.error)
      return { success: false, error: response.error.message || 'Erro ao enviar email' }
    }

    console.log('✅ [Resend] Email de credenciais enviado com sucesso:', response.data?.id)
    return { success: true, messageId: response.data?.id }
  } catch (error: any) {
    console.error('❌ [Resend] Erro ao enviar email de credenciais:', error)
    return { success: false, error: error.message || 'Erro ao enviar email' }
  }
}

function gerarTemplateEmailCredenciaisUsuario(
  dados: {
    email: string
    nome: string
    senha: string
    organizadorNome: string
  },
  loginUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo(a) ao ${dados.organizadorNome}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #156634 0%, #0d4a1f 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Bem-vindo(a) ao ${dados.organizadorNome}!</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${dados.nome}</strong>,</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Sua conta foi criada com sucesso! Abaixo estão suas credenciais de acesso:
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #156634; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Email:</strong> ${dados.email}</p>
          <p style="margin: 10px 0;"><strong>Senha:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${dados.senha}</code></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #156634; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Acessar Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Se você não solicitou esta conta, por favor, ignore este email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #999;">
          Este é um email automático, por favor não responda.
        </p>
      </div>
    </body>
    </html>
  `
}

function gerarTemplateEmailConviteAfiliado(
  dados: {
    email: string
    nomeEvento: string
    dataEvento?: string
    comissao: string
    tipoComissao: 'percentage' | 'fixed'
    usuarioExiste: boolean
  },
  acceptUrl: string,
  registerUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite de Afiliação - Evemaster</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 40px 30px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <img src="https://evemaster.app/images/logo/logo.png" alt="Evemaster" height="50" style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Convite de Afiliação
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Você foi convidado para ser afiliado
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Você foi convidado para ser afiliado do evento <strong>${dados.nomeEvento}</strong>${dados.dataEvento ? ` que acontecerá em ${dados.dataEvento}` : ''}.
              </p>

              <!-- Detalhes do Convite -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #156634;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #333333; margin: 0 0 10px; font-size: 14px; font-weight: 600;">
                      Detalhes da Comissão:
                    </p>
                    <p style="color: #156634; margin: 0; font-size: 24px; font-weight: bold;">
                      ${dados.comissao}
                    </p>
                    <p style="color: #666666; margin: 5px 0 0; font-size: 13px;">
                      ${dados.tipoComissao === 'percentage' ? 'Por cada venda realizada através do seu link' : 'Valor fixo por cada venda realizada'}
                    </p>
                  </td>
                </tr>
              </table>

              ${!dados.usuarioExiste ? `
              <!-- Aviso para criar conta -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>📝 Primeiro passo:</strong> Você precisa criar uma conta na Evemaster para aceitar este convite. Clique no botão abaixo para criar sua conta.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    ${!dados.usuarioExiste ? `
                    <a href="${registerUrl}" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                      Criar Conta e Aceitar Convite
                    </a>
                    ` : `
                    <a href="${acceptUrl}" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Aceitar Convite
                    </a>
                    `}
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Este convite expira em 30 dias. Se você não deseja ser afiliado, pode ignorar este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Evemaster. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este é um email automático, por favor não responda.
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


// Função para enviar email de convite de clube de corrida
export async function enviarEmailConviteClube(dados: {
  email: string
  nomeEvento: string
  dataEvento?: string
  quantidadeIngressos: number
  desconto: string
  token: string
  usuarioExiste: boolean
}) {
  console.log('📧 [Resend] Enviando email de convite de clube para:', dados.email)
  
  if (!resendApiKey) {
    console.error('❌ [Resend] RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não inicializado')
    return { success: false, error: 'Cliente Resend não inicializado' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evemaster.com'
  const acceptUrl = `${baseUrl}/running-club/accept?token=${dados.token}`

  try {
    const emailPayload = {
      from: resendFromEmail,
      to: dados.email,
      subject: `Convite para Clube de Corrida - ${dados.nomeEvento}`,
      html: gerarTemplateEmailConviteClube(dados, acceptUrl),
    }

    const response = await resendClient.emails.send(emailPayload)

    if (response.error) {
      console.error('❌ [Resend] Erro ao enviar email:', response.error)
      return { success: false, error: response.error.message || 'Erro ao enviar email' }
    }

    console.log('✅ [Resend] Email enviado com sucesso:', response.data?.id)
    return { success: true, id: response.data?.id }
  } catch (error: any) {
    console.error('❌ [Resend] Erro ao enviar email:', error)
    return { success: false, error: error.message || error }
  }
}

function gerarTemplateEmailConviteClube(dados: {
  nomeEvento: string
  dataEvento?: string
  quantidadeIngressos: number
  desconto: string
  usuarioExiste: boolean
}, acceptUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Clube de Corrida</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Convite para Clube de Corrida
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Você foi convidado para participar
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Você foi convidado para participar como <strong>Clube de Corrida</strong> do evento:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px; padding: 20px;">
                <tr>
                  <td>
                    <p style="color: #333333; font-size: 18px; font-weight: 600; margin: 0 0 10px;">
                      ${dados.nomeEvento}
                    </p>
                    ${dados.dataEvento ? `
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                      📅 ${dados.dataEvento}
                    </p>
                    ` : ''}
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                      🎫 ${dados.quantidadeIngressos} ingressos reservados
                    </p>
                    <p style="color: #156634; font-size: 14px; font-weight: 600; margin: 0;">
                      💰 Desconto: ${dados.desconto}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Clique no botão abaixo para aceitar o convite e acessar seu dashboard:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${acceptUrl}" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Aceitar Convite e Acessar Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                ${dados.usuarioExiste 
                  ? 'Você já possui uma conta. Faça login para aceitar o convite.'
                  : 'Será criada uma conta automaticamente para você.'}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Evemaster. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este é um email automático, por favor não responda.
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

// Função para enviar email de convite para participante do clube
export async function enviarEmailParticipanteClube(dados: {
  email: string
  nomeEvento: string
  dataEvento?: string
  linkInscricao: string
  desconto: string
  nomeClube: string
  token: string
}) {
  console.log('📧 [Resend] Enviando email para participante do clube:', dados.email)
  
  if (!resendApiKey) {
    console.error('❌ [Resend] RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não inicializado')
    return { success: false, error: 'Cliente Resend não inicializado' }
  }

  try {
    const emailPayload = {
      from: resendFromEmail,
      to: dados.email,
      subject: `Convite para participar - ${dados.nomeEvento}`,
      html: gerarTemplateEmailParticipanteClube(dados),
    }

    const response = await resendClient.emails.send(emailPayload)

    if (response.error) {
      console.error('❌ [Resend] Erro ao enviar email:', response.error)
      return { success: false, error: response.error.message || 'Erro ao enviar email' }
    }

    console.log('✅ [Resend] Email enviado com sucesso:', response.data?.id)
    return { success: true, id: response.data?.id }
  } catch (error: any) {
    console.error('❌ [Resend] Erro ao enviar email:', error)
    return { success: false, error: error.message || error }
  }
}

export async function enviarEmailCodigoLogin(email: string, nome: string, codigo: string) {
  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não inicializado')
    return { success: false, error: 'Cliente Resend não inicializado' }
  }

  try {
    const emailPayload = {
      from: resendFromEmail,
      to: email,
      subject: 'Código de Login Rápido - Evemaster',
      html: gerarTemplateEmailCodigoLogin(nome, codigo),
    }

    const response = await resendClient.emails.send(emailPayload)

    if (response.error) {
      console.error('❌ [Resend] Erro ao enviar email:', response.error)
      return { success: false, error: response.error.message || 'Erro ao enviar email' }
    }

    console.log('✅ [Resend] Email de código de login enviado com sucesso:', response.data?.id)
    return { success: true, id: response.data?.id }
  } catch (error: any) {
    console.error('❌ [Resend] Erro ao enviar email:', error)
    return { success: false, error: error.message || error }
  }
}

function gerarTemplateEmailCodigoLogin(nome: string, codigo: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Login Rápido</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🔐 Login Rápido
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Seu código de acesso
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá ${nome || 'usuário'},
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Você solicitou um login rápido. Use o código abaixo para acessar sua conta:
              </p>

              <!-- Código -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px; padding: 30px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #ffffff; border: 2px dashed #156634; border-radius: 8px; padding: 20px; display: inline-block;">
                      <p style="color: #156634; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                        ${codigo}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
                ⏰ Este código expira em <strong>10 minutos</strong>.
              </p>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0;">
                Se você não solicitou este código, ignore este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Evemaster. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este é um email automático, por favor não responda.
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

function gerarTemplateEmailParticipanteClube(dados: {
  nomeEvento: string
  dataEvento?: string
  linkInscricao: string
  desconto: string
  nomeClube: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Clube de Corrida</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Convite do Clube de Corrida
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Você foi convidado para participar
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Você foi convidado pelo <strong>${dados.nomeClube}</strong> para participar do evento:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px; padding: 20px;">
                <tr>
                  <td>
                    <p style="color: #333333; font-size: 18px; font-weight: 600; margin: 0 0 10px;">
                      ${dados.nomeEvento}
                    </p>
                    ${dados.dataEvento ? `
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                      📅 ${dados.dataEvento}
                    </p>
                    ` : ''}
                    <p style="color: #156634; font-size: 14px; font-weight: 600; margin: 0;">
                      💰 Desconto especial: ${dados.desconto}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Clique no botão abaixo para realizar sua inscrição com desconto especial:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${dados.linkInscricao}" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Fazer Inscrição com Desconto
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Este link é exclusivo para você e já inclui o desconto do clube.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Evemaster. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este é um email automático, por favor não responda.
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

// ==================== ENVIAR OTP PARA LOGIN ====================

export interface EmailOTP {
  para: string
  nome: string
  codigo: string
}

export async function enviarEmailOTP(dados: EmailOTP) {
  console.log('📧 [Resend] Enviando OTP para:', dados.para)
  
  if (!resendApiKey) {
    console.error('❌ [Resend] RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  if (!resendClient) {
    console.error('❌ [Resend] Cliente Resend não disponível')
    return { success: false, error: 'Cliente Resend não disponível' }
  }

  try {
    const htmlContent = gerarTemplateOTP(dados)

    const result = await resendClient.emails.send({
      from: resendFromEmail,
      to: dados.para,
      subject: `${dados.codigo} é seu código de verificação - EveMaster`,
      html: htmlContent,
    })

    console.log('✅ [Resend] OTP enviado com sucesso:', result)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('❌ [Resend] Erro ao enviar OTP:', error)
    return { success: false, error: error.message }
  }
}

function gerarTemplateOTP(dados: EmailOTP): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">EveMaster</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <p style="color: #333333; font-size: 18px; margin: 0 0 8px;">Olá, <strong>${dados.nome}</strong>!</p>
              <p style="color: #666666; font-size: 15px; margin: 0 0 32px; line-height: 1.5;">Use o código abaixo para fazer login:</p>
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin: 0 0 32px;">
                <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #156634; font-family: monospace;">${dados.codigo}</div>
              </div>
              <p style="color: #999999; font-size: 13px; margin: 0; line-height: 1.5;">Este código expira em <strong>10 minutos</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} EveMaster</p>
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

// ============================================================================
// ERROR NOTIFICATION EMAIL
// ============================================================================

export interface ErrorNotificationData {
  errorType: string
  errorCode: string | null
  errorTitle: string
  errorMessage: string
  errorDetail?: string | null
  errorHint?: string | null
  tableName?: string | null
  userEmail?: string | null
  requestPath?: string | null
  requestMethod?: string | null
  stackTrace?: string | null
  timestamp: Date
  errorId?: string | null
}

/**
 * Send error notification email to admin
 */
export async function enviarEmailErro(dados: ErrorNotificationData): Promise<{ success: boolean; error?: string }> {
  const adminEmail = 'julianodesouzaleite@gmail.com'
  
  console.log('🚨 [Resend] Sending error notification email')
  
  if (!resendClient) {
    console.error('❌ [Resend] Client not available for error notification')
    return { success: false, error: 'Resend client not configured' }
  }

  try {
    const severityColor = dados.errorType === 'critical' ? '#dc2626' : 
                          dados.errorType === 'payment' ? '#ea580c' : '#ef4444'
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" style="border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 650px; margin: 0 auto; background-color: #262626; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${severityColor} 0%, #991b1b 100%); padding: 24px 32px;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 24px;">🚨</span>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 700; margin-left: 12px;">ERROR ALERT</span>
                  </td>
                  <td style="text-align: right;">
                    <span style="background: rgba(255,255,255,0.2); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${dados.errorType.toUpperCase()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Error Title -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 8px; font-weight: 600;">${dados.errorTitle}</h1>
              ${dados.errorCode ? `<span style="background: #374151; color: #9ca3af; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-family: monospace;">Code: ${dados.errorCode}</span>` : ''}
            </td>
          </tr>

          <!-- Error Message -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background: #1f2937; border-left: 4px solid ${severityColor}; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                <p style="color: #f3f4f6; font-size: 14px; margin: 0; line-height: 1.6; font-family: monospace; word-break: break-word;">${dados.errorMessage}</p>
              </div>
            </td>
          </tr>

          ${dados.errorDetail ? `
          <!-- Error Detail -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Detail</p>
              <p style="color: #d1d5db; font-size: 13px; margin: 0; background: #1f2937; padding: 12px 16px; border-radius: 8px;">${dados.errorDetail}</p>
            </td>
          </tr>
          ` : ''}

          ${dados.errorHint ? `
          <!-- Error Hint -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">💡 Hint</p>
              <p style="color: #86efac; font-size: 13px; margin: 0; background: #14532d; padding: 12px 16px; border-radius: 8px;">${dados.errorHint}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Context Info -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Context</p>
              <table width="100%" style="background: #1f2937; border-radius: 8px; border-collapse: collapse;">
                ${dados.tableName ? `
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #374151; width: 120px;"><span style="color: #9ca3af; font-size: 12px;">Table</span></td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #374151;"><span style="color: #f3f4f6; font-size: 13px; font-family: monospace;">${dados.tableName}</span></td>
                </tr>
                ` : ''}
                ${dados.requestPath ? `
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #374151;"><span style="color: #9ca3af; font-size: 12px;">Endpoint</span></td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #374151;"><span style="color: #60a5fa; font-size: 13px;">${dados.requestMethod || 'GET'} ${dados.requestPath}</span></td>
                </tr>
                ` : ''}
                ${dados.userEmail ? `
                <tr>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #374151;"><span style="color: #9ca3af; font-size: 12px;">User</span></td>
                  <td style="padding: 10px 16px; border-bottom: 1px solid #374151;"><span style="color: #f3f4f6; font-size: 13px;">${dados.userEmail}</span></td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 16px;"><span style="color: #9ca3af; font-size: 12px;">Time</span></td>
                  <td style="padding: 10px 16px;"><span style="color: #f3f4f6; font-size: 13px;">${dados.timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span></td>
                </tr>
              </table>
            </td>
          </tr>

          ${dados.stackTrace ? `
          <!-- Stack Trace -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <details style="background: #1f2937; border-radius: 8px; padding: 12px 16px;">
                <summary style="color: #9ca3af; font-size: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">Stack Trace</summary>
                <pre style="color: #d1d5db; font-size: 11px; margin: 12px 0 0; overflow-x: auto; white-space: pre-wrap; word-break: break-word; line-height: 1.5;">${dados.stackTrace.substring(0, 1500)}${dados.stackTrace.length > 1500 ? '...' : ''}</pre>
              </details>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 20px 32px; text-align: center; border-top: 1px solid #374151;">
              ${dados.errorId ? `<p style="color: #6b7280; font-size: 11px; margin: 0 0 8px; font-family: monospace;">Error ID: ${dados.errorId}</p>` : ''}
              <p style="color: #6b7280; font-size: 11px; margin: 0;">EveMaster Error Monitoring System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const { error } = await resendClient.emails.send({
      from: 'EveMaster Alerts <alertas@evemaster.app>',
      to: adminEmail,
      subject: `🚨 [${dados.errorType.toUpperCase()}] ${dados.errorTitle}`,
      html,
    })

    if (error) {
      console.error('❌ [Resend] Error sending notification:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Resend] Error notification sent to', adminEmail)
    return { success: true }
  } catch (error: any) {
    console.error('❌ [Resend] Exception sending error notification:', error)
    return { success: false, error: error.message }
  }
}
