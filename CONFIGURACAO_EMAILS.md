# Configuração de Emails - Evemaster

## 📧 Visão Geral

**Todos os emails são enviados via Resend**, não pelo Supabase. Isso nos dá controle total sobre templates, branding e entrega.

## ✅ Configuração Atual

### 1. Emails Enviados via Resend

- ✅ **Confirmação de Inscrição** (`lib/email/resend.ts`)
- ✅ **Senha Temporária** (`app/api/auth/enviar-senha-temporaria/route.ts`)

### 2. Configuração do Supabase

**IMPORTANTE:** O Supabase NÃO deve enviar emails automaticamente. Configure no Supabase Dashboard:

1. Acesse: **Supabase Dashboard → Authentication → Email Templates**
2. **Desabilite** ou **configure SMTP personalizado** (Resend)
3. Se usar SMTP do Supabase, configure para usar Resend:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465` (SSL) ou `587` (TLS)
   - **SMTP User:** `resend`
   - **SMTP Password:** Sua API key do Resend
   - **Sender Email:** `contact@evemaster.app` (ou seu email verificado)

### 3. Variáveis de Ambiente Necessárias

No Vercel, configure:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Evemaster <contact@evemaster.app>
```

**NOTA:** O `RESEND_FROM_EMAIL` deve usar um email verificado no Resend.

## 🔧 Como Funciona

### Senha Temporária

1. Usuário clica em "Entrar sem senha" no `/login`
2. Sistema chama `/api/auth/enviar-senha-temporaria`
3. API gera senha temporária segura
4. API atualiza senha no Supabase (sem disparar email do Supabase)
5. API envia email via Resend com a senha temporária
6. Usuário recebe email e usa a senha para fazer login

### Confirmação de Inscrição

1. Inscrição é criada
2. Sistema chama `/api/email/confirmacao-inscricao`
3. API envia email via Resend com detalhes da inscrição
4. (Opcional) PDF do ingresso é anexado (atualmente desabilitado)

## ⚠️ Importante

- **NÃO** use `supabase.auth.resetPasswordForEmail()` - isso dispara email do Supabase
- **NÃO** use `supabase.auth.signInWithOtp()` - isso dispara email do Supabase
- **USE** apenas `supabaseAdmin.auth.admin.updateUserById()` para atualizar senha
- **USE** apenas Resend para enviar todos os emails

## 📝 Verificação

Para verificar se está funcionando:

1. Teste "Entrar sem senha" no `/login`
2. Verifique se o email chega com a senha temporária
3. Verifique se NÃO há emails duplicados do Supabase
4. Verifique os logs do Resend no dashboard

## 🐛 Troubleshooting

### Email não chega

1. Verifique se `RESEND_API_KEY` está configurada no Vercel
2. Verifique se o email está verificado no Resend
3. Verifique se `RESEND_FROM_EMAIL` usa o domínio verificado
4. Verifique os logs do Resend no dashboard

### Email duplicado do Supabase

1. Desabilite templates de email no Supabase Dashboard
2. Ou configure SMTP do Supabase para usar Resend
3. Verifique se não está usando métodos que disparam emails do Supabase



