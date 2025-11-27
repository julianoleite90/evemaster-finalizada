import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const runtime = 'nodejs'

// Gerar senha temporária segura
function gerarSenhaTemporaria(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  let senha = ''
  
  // Garantir pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
  senha += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  senha += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  senha += '0123456789'[Math.floor(Math.random() * 10)]
  senha += '!@#$%&*'[Math.floor(Math.random() * 7)]
  
  // Completar até 12 caracteres
  for (let i = senha.length; i < 12; i++) {
    senha += caracteres[Math.floor(Math.random() * caracteres.length)]
  }
  
  // Embaralhar
  return senha.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body as { email: string }

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Evemaster <inscricoes@evemaster.app>'

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Configuração do Resend não encontrada' },
        { status: 500 }
      )
    }

    // Criar cliente admin
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar usuário por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ [API] Erro ao listar usuários:', listError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuário', details: listError.message },
        { status: 500 }
      )
    }

    const user = users?.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado com este email' },
        { status: 404 }
      )
    }

    // Gerar senha temporária
    const senhaTemporaria = gerarSenhaTemporaria()

    // Atualizar senha do usuário
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: senhaTemporaria,
      }
    )

    if (updateError) {
      console.error('❌ [API] Erro ao atualizar senha:', updateError)
      return NextResponse.json(
        { error: 'Erro ao gerar senha temporária', details: updateError.message },
        { status: 500 }
      )
    }

    // Enviar email com senha temporária
    const resend = new Resend(resendApiKey)

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Senha Temporária - Evemaster</title>
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
                Senha Temporária
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Você solicitou uma senha temporária para acessar sua conta na Evemaster.
              </p>

              <!-- Senha Temporária -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px; border: 2px dashed #156634;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #666666; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Sua Senha Temporária
                    </p>
                    <p style="color: #156634; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                      ${senhaTemporaria}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Segurança -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Por segurança, recomendamos que você altere esta senha após fazer login.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="https://evemaster.app/login" 
                       style="display: inline-block; background-color: #156634; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Fazer Login
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Se você não solicitou esta senha, ignore este email ou entre em contato conosco.
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

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: 'Sua senha temporária - Evemaster',
      html: emailHtml,
    })

    if (emailError) {
      console.error('❌ [API] Erro ao enviar email:', emailError)
      return NextResponse.json(
        { error: 'Erro ao enviar email', details: emailError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Senha temporária enviada para:', email)

    return NextResponse.json({
      success: true,
      message: 'Senha temporária enviada por email',
    })

  } catch (error: any) {
    console.error('❌ [API] Erro ao enviar senha temporária:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição', details: error.message },
      { status: 500 }
    )
  }
}

