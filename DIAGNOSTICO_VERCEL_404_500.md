# 🔍 Diagnóstico Completo - Erros 404 e 500 no Vercel

## ❌ Problemas Identificados

Após análise completa do código, identifiquei as possíveis causas:

### 1. Middleware com Matcher Complexo (CAUSA MAIS PROVÁVEL)
**Problema:** O matcher com regex complexo pode falhar no Edge Runtime do Vercel
**Solução:** Simplificado para matcher específico apenas nas rotas protegidas

### 2. Variáveis de Ambiente Não Configuradas
**Problema:** Se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem no Vercel
**Impacto:** Páginas quebram ao tentar criar cliente Supabase

### 3. Route Groups Podem Confundir Matcher
**Problema:** Temos `(auth)` e `(public)` que são removidos das URLs finais
**Impacto:** Matcher pode não encontrar as rotas corretamente

---

## ✅ SOLUÇÃO APLICADA

### Middleware Simplificado

```typescript
// ANTES (problemático):
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)',
]

// DEPOIS (funcional):
matcher: [
  '/dashboard/:path*',
  '/my-account/:path*',
]
```

**Por quê funciona:**
- ✅ Matcher explícito sem regex complexo
- ✅ Apenas protege rotas que realmente precisam
- ✅ Deixa todas as outras rotas livres
- ✅ Compatível com Edge Runtime

---

## 🚨 CHECKLIST DE VERIFICAÇÃO NO VERCEL

### Passo 1: Verificar Variáveis de Ambiente

Vá em: **Vercel Dashboard → Settings → Environment Variables**

#### Verificar se EXISTE:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Como verificar se estão corretas:

1. Abra o Supabase Dashboard
2. Vá em **Settings → API**
3. Compare:
   - **Project URL** deve ser EXATAMENTE igual a `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** deve ser EXATAMENTE igual a `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Problemas comuns:

- ❌ Espaços extras no início ou fim
- ❌ Aspas incluídas por engano
- ❌ URL com / no final
- ❌ Key incompleta (cortada)
- ❌ Configuradas apenas para Preview, mas não para Production

**SOLUÇÃO:**
- Deletar e recriar as variáveis
- Selecionar **TODOS** os ambientes: Production, Preview, Development
- Fazer **Redeploy** após salvar

---

### Passo 2: Verificar Build Logs

Vá em: **Vercel Dashboard → Deployments → Último Deploy → Build Logs**

#### Procurar por erros:

```
❌ BAD (problemas):
- "Error: Page /middleware provided runtime 'edge'"
- "Missing Supabase environment variables"
- "Failed to compile"
- "Module not found"
- "Cannot find module"

✅ GOOD (sucesso):
- "Compiled successfully"
- "Build completed"
- "Collecting page data"
- "Generating static pages"
```

---

### Passo 3: Verificar Function Logs

Vá em: **Vercel Dashboard → Deployment → Functions → middleware**

#### O que procurar:

```bash
# Status esperado:
✅ Invocations: > 0 (está sendo executado)
✅ Errors: 0 (sem erros)
✅ Duration: < 50ms (rápido)
✅ Cold Start: < 100ms

# Se ver:
❌ Errors: > 0 → Middleware está quebrando
❌ Duration: > 500ms → Muito lento
❌ "MIDDLEWARE_INVOCATION_FAILED" → Falha crítica
```

---

### Passo 4: Testar Rotas Manualmente

#### Teste 1: Homepage
```bash
curl -I https://seu-dominio.vercel.app/

# Esperado: HTTP/2 200
```

#### Teste 2: Login (SEM auth)
```bash
curl -I https://seu-dominio.vercel.app/login

# Esperado: HTTP/2 200 (página de login carrega)
```

#### Teste 3: Dashboard (SEM auth)
```bash
curl -I https://seu-dominio.vercel.app/dashboard

# Esperado: HTTP/2 307 (redirect para /login)
# Location: /login?from=/dashboard
```

#### Teste 4: API Route
```bash
curl -I https://seu-dominio.vercel.app/api/og/evento/test

# Esperado: HTTP/2 404 (evento não existe) ou 200 (se existir)
# NÃO deve ser 500!
```

---

## 🔧 CORREÇÕES ESPECÍFICAS

### Se /login retorna 404:

**Causa:** Build não encontrou a página
**Verificar:**
1. Arquivo existe em `app/(auth)/login/page.tsx`?
2. Build logs mostram "Compiled /login"?
3. Route group `(auth)` está configurado corretamente?

**Solução:**
```bash
# No Vercel Dashboard:
1. Settings → Functions → Rebuild
2. Se persistir, verificar .gitignore (pode estar ignorando (auth))
```

### Se /dashboard retorna 500:

**Causa:** Erro no servidor ao processar a página
**Verificar:**
1. Logs do deploy (Function Logs)
2. Variáveis de ambiente configuradas?
3. Cliente Supabase falhando?

**Solução:**
```bash
# Ver logs detalhados:
Vercel Dashboard → Deployment → View Function Logs

# Procurar por:
- "Missing Supabase"
- "createClient"
- "Error"
```

### Se TODAS as rotas retornam 404:

**Causa:** Build falhou ou deployment incompleto
**Verificar:**
1. Build completou com sucesso?
2. Deployment está com status "Ready"?
3. Domínio configurado corretamente?

**Solução:**
```bash
1. Fazer Redeploy completo
2. Limpar cache do Vercel
3. Verificar se branch está correta (main)
```

---

## 📊 ESTRUTURA DE ROTAS (para referência)

### Rotas Públicas (não precisam de auth):
```
/ (homepage)
/login
/register
/forgot-password
/confirm-email
/evento/[slug]
/inscricao/[eventId]
/inscricao/[eventId]/obrigado
/politica-de-privacidade
/termos-de-uso
```

### Rotas Protegidas (precisam de auth):
```
/dashboard/organizer
/dashboard/organizer/events
/dashboard/organizer/events/new
/dashboard/organizer/events/[id]/settings
/dashboard/organizer/profile
/dashboard/organizer/registrations
/dashboard/organizer/registrations/[id]
/dashboard/affiliate
/dashboard/admin
/my-account
```

### API Routes (ignoradas pelo middleware):
```
/api/email/confirmacao-inscricao
/api/inscricao/pdf
/api/og/evento/[slug]
```

---

## 🎯 ORDEM DE EXECUÇÃO DO FLUXO

### 1. Usuário acessa /login

```
1. Request chega no Vercel Edge Network
2. Vercel verifica se /login está no matcher → NÃO
3. Middleware NÃO executa
4. Next.js renderiza app/(auth)/login/page.tsx
5. Página carrega normalmente
```

### 2. Usuário acessa /dashboard (sem auth)

```
1. Request chega no Vercel Edge Network
2. Vercel verifica se /dashboard está no matcher → SIM
3. Middleware executa
4. Verifica cookie de auth → NÃO encontrado
5. Redirect para /login?from=/dashboard
6. Usuário vê página de login
```

### 3. Usuário faz login e acessa /dashboard (com auth)

```
1. Login seta cookie: sb-xxx-auth-token
2. Request para /dashboard
3. Middleware executa
4. Verifica cookie → ENCONTRADO
5. Permite acesso
6. Next.js renderiza app/dashboard/organizer/page.tsx
7. Página carrega dados do Supabase
```

---

## 🚀 TESTE FINAL - Passo a Passo

### 1. Configurar Variáveis

```bash
1. Vercel → Settings → Environment Variables
2. Adicionar NEXT_PUBLIC_SUPABASE_URL
3. Adicionar NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Selecionar: Production, Preview, Development
5. Salvar
```

### 2. Fazer Redeploy

```bash
1. Vercel → Deployments
2. Último deploy → ... → Redeploy
3. Aguardar build completar (1-3 min)
4. Verificar status: ✅ Ready
```

### 3. Testar em Navegador

```bash
# Abrir em modo anônimo/incógnito:

1. https://seu-dominio.vercel.app/
   → Deve carregar homepage

2. https://seu-dominio.vercel.app/login
   → Deve mostrar página de login

3. https://seu-dominio.vercel.app/dashboard
   → Deve redirecionar para /login

4. Fazer login com credenciais válidas
   → Deve redirecionar para /dashboard/organizer

5. Acessar /dashboard novamente
   → Deve carregar sem erro 500
```

---

## 📝 LOGS PARA COMPARTILHAR

Se ainda não funcionar, compartilhe:

### 1. Build Logs
```
Vercel → Deployment → Build Logs
(copiar últimas 50 linhas)
```

### 2. Function Logs
```
Vercel → Deployment → Functions → middleware
(copiar todos os erros em vermelho)
```

### 3. Variáveis Configuradas
```
Vercel → Settings → Environment Variables
(listar apenas os NOMES, não os valores):
- NEXT_PUBLIC_SUPABASE_URL: ✅ ou ❌
- NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ ou ❌
```

### 4. Status do Deploy
```
- Build Status: (Success/Failed)
- Deployment Status: (Ready/Error)
- Region: (ex: gru1 - São Paulo)
- Duration: (ex: 45s)
```

---

## 💡 DICA FINAL

Se NADA funcionar:

### Opção 1: Desabilitar Middleware Temporariamente

```typescript
// middleware.ts
export const config = {
  matcher: [], // Desabilita tudo
}

export function middleware(request: NextRequest) {
  return NextResponse.next() // Apenas passa
}
```

**Deploy e teste:**
- Se páginas funcionarem → Problema é no middleware
- Se ainda der 404/500 → Problema é nas variáveis ou build

### Opção 2: Verificar DNS/Domínio

```bash
# Verificar se domínio está resolvendo corretamente:
nslookup seu-dominio.vercel.app

# Deve mostrar IP do Vercel (ex: 76.223.x.x)
```

### Opção 3: Teste com URL direta do Vercel

```bash
# Usar URL gerada automaticamente:
https://evemaster-finalizada-xxx.vercel.app

# Se funcionar → Problema é DNS/domínio customizado
# Se não funcionar → Problema é build/config
```

---

## ✅ CHECKLIST FINAL

Antes de considerar resolvido:

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Variáveis aplicadas a Production
- [ ] Redeploy feito após configurar variáveis
- [ ] Build completou com sucesso (sem erros)
- [ ] Homepage (/) carrega
- [ ] Login (/login) carrega
- [ ] Dashboard sem auth redireciona para login
- [ ] Login funciona e cria sessão
- [ ] Dashboard com auth carrega sem erro 500
- [ ] Middleware não tem erros nos logs
- [ ] Nenhum erro 404 em rotas existentes

---

**Data:** 27 Nov 2025
**Status:** 🔧 EM CORREÇÃO
**Próximo Passo:** Verificar variáveis de ambiente no Vercel



