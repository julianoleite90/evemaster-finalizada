// Configuração do Resend para envio de emails
// Instale com: npm install resend

// import { Resend } from 'resend'

// const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailInscricao {
  para: string
  nomeParticipante: string
  nomeEvento: string
  dataEvento: string
  localEvento: string
  categoria: string
  valor: number
  gratuito: boolean
  codigoInscricao: string
}

// Função para enviar email de confirmação de inscrição
export async function enviarEmailConfirmacao(dados: EmailInscricao) {
  // TODO: Configurar Resend API Key em .env.local
  // RESEND_API_KEY=re_xxxxxxxxxxxx
  
  const { para, nomeParticipante, nomeEvento, dataEvento, localEvento, categoria, valor, gratuito, codigoInscricao } = dados

  console.log('📧 Enviando email de confirmação para:', para)
  console.log('Dados:', { nomeParticipante, nomeEvento, categoria })

  // Descomentar quando configurar o Resend:
  /*
  try {
    const { data, error } = await resend.emails.send({
      from: 'Evemaster <inscricoes@evemaster.com.br>',
      to: para,
      subject: `Inscrição Confirmada - ${nomeEvento}`,
      html: gerarTemplateEmail(dados),
      // attachments: [
      //   {
      //     filename: `inscricao-${codigoInscricao}.pdf`,
      //     content: await gerarPDFInscricao(dados),
      //   },
      // ],
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return { success: false, error }
    }

    console.log('Email enviado com sucesso:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error }
  }
  */

  // Simulação enquanto não configurar
  return { success: true, simulated: true }
}

// Template HTML do email
export function gerarTemplateEmail(dados: EmailInscricao): string {
  const { nomeParticipante, nomeEvento, dataEvento, localEvento, categoria, valor, gratuito, codigoInscricao } = dados

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
            <td style="background: linear-gradient(135deg, #156634 0%, #1a7a3e 100%); padding: 30px; text-align: center;">
              <img src="https://evemaster.com.br/images/logo/logo-white.png" alt="Evemaster" height="40" style="margin-bottom: 15px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Inscrição Confirmada! ✓
              </h1>
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
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #156634; margin: 0 0 15px; font-size: 20px;">
                      ${nomeEvento}
                    </h2>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 5px 0; color: #666666; font-size: 14px;">
                          📅 <strong>Data:</strong> ${dataEvento}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #666666; font-size: 14px;">
                          📍 <strong>Local:</strong> ${localEvento}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #666666; font-size: 14px;">
                          🏃 <strong>Categoria:</strong> ${categoria}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #666666; font-size: 14px;">
                          💰 <strong>Valor:</strong> ${gratuito ? 'Gratuito' : `R$ ${valor.toFixed(2)}`}
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
                    <a href="https://evemaster.com.br/minha-conta" 
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
                <a href="https://evemaster.com.br/politica-de-privacidade" style="color: #666666; text-decoration: none; font-size: 12px; margin: 0 10px;">
                  Política de Privacidade
                </a>
                |
                <a href="https://evemaster.com.br/termos-de-uso" style="color: #666666; text-decoration: none; font-size: 12px; margin: 0 10px;">
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

// Função para gerar PDF da inscrição (placeholder)
export async function gerarPDFInscricao(dados: EmailInscricao): Promise<Buffer> {
  // TODO: Implementar geração de PDF com @react-pdf/renderer ou jspdf
  // Por enquanto retorna um buffer vazio
  return Buffer.from('')
}



