import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = 'nodejs'

// Usar as mesmas variáveis de ambiente que os outros emails
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "Evemaster <inscricoes@evemaster.app>"

// Log de configuração (mesmo padrão dos outros emails)
console.log('🔧 [Export Email] Configuração:', {
  hasApiKey: !!resendApiKey,
  apiKeyPrefix: resendApiKey?.substring(0, 3) || 'N/A',
  fromEmail: resendFromEmail,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileContent, fileName, fileType, emails, subject } = body as {
      fileContent: string // base64
      fileName: string
      fileType: 'csv' | 'xlsx'
      emails: string[]
      subject?: string
    }

    if (!fileContent || !fileName || !emails || emails.length === 0) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    if (!resendApiKey) {
      console.error('❌ [Export Email] RESEND_API_KEY não configurada')
      return NextResponse.json(
        { error: "RESEND_API_KEY não configurada" },
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)

    // Validar e limpar emails
    const validEmails = emails
      .map(email => email.trim())
      .filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      })

    console.log('📧 [Export Email] Iniciando envio para:', validEmails)

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "Nenhum email válido fornecido" },
        { status: 400 }
      )
    }

    // Converter base64 para buffer
    const fileBuffer = Buffer.from(fileContent, 'base64')
    const mimeType = fileType === 'csv' 
      ? 'text/csv;charset=utf-8' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    const emailSubject = subject || `Exportação de Inscrições - ${fileName}`

    // Template de email seguindo o mesmo padrão dos outros emails
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exportação de Inscrições - Evemaster</title>
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
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Exportação de Inscrições
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                Arquivo gerado com sucesso
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Segue em anexo o arquivo com a exportação das inscrições solicitada.
              </p>

              <!-- Arquivo Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="padding: 30px;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                          <span style="font-size: 18px;">📄</span>
                        </td>
                        <td>
                          <div style="color: #666666; font-size: 14px; line-height: 1.5;">
                            <strong style="color: #333333; display: block; margin-bottom: 4px;">Arquivo:</strong>
                            <span style="color: #156634; font-weight: 600; font-size: 16px;">${fileName}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Informação -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e7f5e7; border-left: 4px solid #156634; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>ℹ️ Informação:</strong> O arquivo está anexado a este email. Você pode abri-lo diretamente ou salvá-lo no seu computador.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Este é um email automático. Por favor, não responda.
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

    // Enviar email para todos os destinatários
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: validEmails,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: fileName,
          content: fileBuffer.toString('base64'),
        },
      ],
    })

    if (error) {
      console.error('❌ [Export Email] Erro ao enviar email:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar email', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [Export Email] Email enviado com sucesso!', {
      emailIds: data?.id,
      recipients: validEmails.length,
    })

    return NextResponse.json({
      success: true,
      message: `Email enviado com sucesso para ${validEmails.length} destinatário(s)`,
      emails: validEmails,
    })

  } catch (error: any) {
    console.error('❌ [Export Email] Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: error.message },
      { status: 500 }
    )
  }
}

