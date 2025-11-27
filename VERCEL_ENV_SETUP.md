# Configuração de Variáveis de Ambiente no Vercel

> 🔥 **IMPORTANTE:** Se você está enfrentando erro `MIDDLEWARE_INVOCATION_FAILED`, veja o arquivo [FIX_MIDDLEWARE_EDGE_RUNTIME.md](./FIX_MIDDLEWARE_EDGE_RUNTIME.md)

## ✅ Variáveis Necessárias

No painel do Vercel, você DEVE configurar as seguintes variáveis de ambiente:

### 1. Acesse o Painel do Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**

### 2. Configure as Variáveis

Adicione as seguintes variáveis para **TODOS os ambientes** (Production, Preview, Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_URL=https://seu-projeto.supabase.co          # usado em Server Components / Edge
SUPABASE_ANON_KEY=sua-anon-key-aqui                   # usado em Server Components / Edge
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Evemaster <inscricoes@seu-dominio.com>
```

**IMPORTANTE:**
- ✅ Configure para **Production**, **Preview** e **Development**
- ✅ Não adicione espaços extras antes ou depois dos valores
- ✅ Não adicione aspas nos valores
- ✅ Copie os valores EXATAMENTE do painel do Supabase

### 3. Onde Encontrar os Valores

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.1. Onde encontrar as variáveis do Resend

1. Acesse o [Resend Dashboard](https://resend.com)
2. Vá em **API Keys** → gere uma chave (ex.: `re_xxx`)
3. Copie o endereço de email verificado (ex.: `inscricoes@seu-dominio.com`) e use no `RESEND_FROM_EMAIL`

### 4. Verificar se Está Funcionando

Após configurar, faça um novo deploy e verifique:

1. Vá em **Deployments** → Selecione o último deploy
2. Clique em **Functions** → **Middleware**
3. Veja os logs - não deve haver erros sobre variáveis faltando

## ⚠️ Problemas Comuns

### Variáveis não estão sendo lidas

**Sintoma:** Erro 500, middleware falha

**Solução:**
1. Verifique se os nomes estão EXATAMENTE como acima (case-sensitive)
2. Verifique se estão configuradas para Production
3. Faça um novo deploy após adicionar/alterar variáveis
4. Limpe o cache do Vercel se necessário

### Variáveis funcionam localmente mas não no Vercel

**Causa:** Variáveis não foram adicionadas no painel do Vercel

**Solução:** Adicione manualmente no painel do Vercel (não basta ter no .env.local)

## 🔍 Como Verificar

Para testar se as variáveis estão sendo lidas, você pode temporariamente adicionar logs:

```typescript
// No middleware.ts (apenas para debug)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ Faltando')
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Faltando')
```

**IMPORTANTE:** Remova os logs após verificar!

## 🔧 Configurações Adicionais Recomendadas

### Edge Runtime Configuration

Para garantir melhor performance e estabilidade:

1. **Next.js Config** - Já configurado em `next.config.js`
2. **Middleware Config** - Otimizado para Edge Runtime
3. **Environment Variables** - Devem usar `NEXT_PUBLIC_` para client-side

### Verificação de Região

O Edge Runtime do Vercel roda em múltiplas regiões. Para melhor performance:

1. No Vercel: **Settings → Functions**
2. Verifique **Edge Function Region**: Deve estar em "Auto" ou próximo aos seus usuários
3. Para o Brasil: considere configurar região `gru1` (São Paulo) como preferencial

## 📊 Monitoramento de Performance

Após deploy, monitore:

1. **Response Time** do middleware (deve ser < 10ms)
2. **Error Rate** (deve ser 0%)
3. **Edge Invocations** (quantas vezes o middleware é chamado)

Acesse: **Deployments → Seu Deploy → Functions → middleware**

