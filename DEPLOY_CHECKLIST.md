# 🚀 Checklist de Deploy - Vercel

## 📋 Pré-Deploy

### 1. Variáveis de Ambiente

Acesse: **Vercel Dashboard → Seu Projeto → Settings → Environment Variables**

#### Variáveis Obrigatórias:

| Nome | Valor | Onde Encontrar |
|------|-------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase → Settings → API → anon public key |

#### Configuração:

```
✅ Environment: Production, Preview, Development (selecione todos)
✅ Sem espaços extras nos valores
✅ Sem aspas nos valores
✅ Copiar e colar diretamente do Supabase
```

### 2. Configurações do Supabase

Acesse: **Supabase Dashboard → Seu Projeto → Authentication → URL Configuration**

#### URLs Permitidas:

```
Site URL:
https://seu-dominio.vercel.app

Redirect URLs:
https://seu-dominio.vercel.app/**
http://localhost:3000/**
```

⚠️ **IMPORTANTE:** Substitua `seu-dominio` pelo domínio real do Vercel!

---

## 🔄 Durante o Deploy

### 1. Commit das Mudanças

```bash
# Verificar status
git status

# Adicionar arquivos
git add middleware.ts
git add FIX_MIDDLEWARE_EDGE_RUNTIME.md
git add QUICK_FIX_SUMMARY.md
git add DEPLOY_CHECKLIST.md

# Commit
git commit -m "fix: otimizar middleware para Edge Runtime"

# Push
git push origin main
```

### 2. Acompanhar Deploy

1. Acesse: **Vercel Dashboard → Deployments**
2. Aguarde o build completar (1-3 minutos)
3. Status deve ser: ✅ **Ready**

### 3. Verificar Logs

1. Clique no deployment
2. Vá em **Functions**
3. Procure por `middleware`
4. Verifique se há erros

---

## ✅ Pós-Deploy

### Testes Essenciais

#### Teste 1: Homepage (Pública)

```bash
# Via terminal
curl -I https://seu-dominio.vercel.app/

# Resposta esperada
HTTP/2 200
```

✅ **Status esperado:** 200 OK

#### Teste 2: Dashboard (Protegida, Sem Auth)

```bash
# Via terminal
curl -I https://seu-dominio.vercel.app/dashboard

# Resposta esperada
HTTP/2 307 (redirect para /login)
Location: /login?from=/dashboard
```

✅ **Status esperado:** 307 Temporary Redirect para `/login`

#### Teste 3: Login

1. Abra no navegador: `https://seu-dominio.vercel.app/login`
2. Faça login com credenciais válidas
3. Deve redirecionar para dashboard
4. Dashboard deve carregar sem erro 500

✅ **Status esperado:** Login bem-sucedido + redirect para dashboard

#### Teste 4: Dashboard (Protegida, Com Auth)

1. Após login (teste 3)
2. Acesse: `https://seu-dominio.vercel.app/dashboard`
3. Deve carregar normalmente

✅ **Status esperado:** 200 OK, dashboard carrega

#### Teste 5: Logout

1. Faça logout
2. Tente acessar `https://seu-dominio.vercel.app/dashboard`
3. Deve redirecionar para login

✅ **Status esperado:** Redirect para `/login`

---

## 🔍 Verificações de Saúde

### Performance do Middleware

Acesse: **Vercel → Deployment → Functions → middleware**

Métricas esperadas:

```
✅ Invocations: (qualquer número)
✅ Errors: 0
✅ Duration: < 10ms (normalmente 1-5ms)
✅ Cold Start: < 50ms
```

### Logs do Sistema

Procure por:

```
❌ NÃO DEVE APARECER:
- "MIDDLEWARE_INVOCATION_FAILED"
- "Missing Supabase environment variables"
- "Error getting user"
- Qualquer erro 500

✅ PODE APARECER:
- "[Middleware] Path: /dashboard"
- Logs normais de requisição
```

### Monitoramento Contínuo

Configure alertas no Vercel:

1. **Settings → Notifications**
2. Ative: "Deployment Failed"
3. Ative: "Unusual Activity"
4. Ative: "Function Errors"

---

## 🐛 Troubleshooting

### Erro: MIDDLEWARE_INVOCATION_FAILED

**Sintoma:** Erro 500 ao acessar qualquer rota

**Soluções:**

1. ✅ Confirme que as variáveis de ambiente estão configuradas
2. ✅ Faça **Redeploy** (não apenas salvar variáveis)
3. ✅ Verifique logs do middleware
4. ✅ Veja [FIX_MIDDLEWARE_EDGE_RUNTIME.md](./FIX_MIDDLEWARE_EDGE_RUNTIME.md)

### Erro: Redirect Loop

**Sintoma:** Página fica redirecionando infinitamente

**Soluções:**

1. ✅ Limpe cookies do navegador
2. ✅ Teste em modo incógnito
3. ✅ Verifique se cookie `sb-*-auth-token` está sendo setado
4. ✅ Verifique URLs no Supabase (devem incluir domínio do Vercel)

### Erro: Login não funciona

**Sintoma:** Login falha ou não cria sessão

**Soluções:**

1. ✅ Verifique CORS no Supabase
2. ✅ Confirme URLs de redirect no Supabase
3. ✅ Verifique se variáveis de ambiente estão corretas
4. ✅ Teste login em local (deve funcionar)

### Erro: 404 em Assets

**Sintoma:** Imagens ou CSS não carregam

**Soluções:**

1. ✅ Verifique paths das imagens (devem ser absolutos: `/images/...`)
2. ✅ Verifique `next.config.js` (configuração de imagens)
3. ✅ Assets devem estar em `/public`

---

## 📊 Métricas de Sucesso

Após deploy bem-sucedido, você deve ver:

### Vercel Analytics

```
✅ Error Rate: 0%
✅ Average Response Time: < 100ms
✅ Uptime: 100%
```

### Lighthouse Score (opcional)

```
✅ Performance: > 90
✅ Accessibility: > 90
✅ Best Practices: > 90
✅ SEO: > 90
```

### User Experience

```
✅ Homepage carrega rápido
✅ Login é instantâneo
✅ Dashboard não trava
✅ Sem erros 500
```

---

## 🔒 Segurança

### Verificações de Segurança:

- [ ] Variáveis de ambiente não estão expostas no código
- [ ] Anon key do Supabase é pública (não é secreta)
- [ ] RLS (Row Level Security) está ativado no Supabase
- [ ] Policies do Supabase estão corretas
- [ ] HTTPS está ativado (Vercel faz automaticamente)
- [ ] Headers de segurança estão configurados

### Headers Recomendados:

Adicione em `next.config.js` (opcional):

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ]
}
```

---

## 📝 Checklist Final

Antes de considerar o deploy concluído:

### Funcionalidade

- [ ] Homepage carrega
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Dashboard carrega após login
- [ ] Rotas protegidas redirecionam sem auth
- [ ] Formulários funcionam
- [ ] Upload de imagens funciona (se aplicável)

### Performance

- [ ] Middleware: < 10ms
- [ ] Homepage: < 2s
- [ ] Dashboard: < 3s
- [ ] Sem erros 500
- [ ] Sem timeout

### Configuração

- [ ] Variáveis de ambiente configuradas
- [ ] URLs do Supabase corretas
- [ ] Deploy bem-sucedido
- [ ] Logs sem erros
- [ ] Testes passando

### Documentação

- [ ] README atualizado
- [ ] Variáveis documentadas
- [ ] Setup instructions claras
- [ ] Troubleshooting disponível

---

## 🎉 Deploy Concluído!

Se todos os itens acima estão marcados, seu deploy está completo e funcionando!

### Próximos Passos:

1. ✅ Configure domínio customizado (opcional)
2. ✅ Configure analytics (Vercel Analytics ou Google Analytics)
3. ✅ Configure monitoring (Sentry, LogRocket, etc)
4. ✅ Configure CI/CD para testes automáticos
5. ✅ Configure backup automático do Supabase

---

## 📞 Suporte

### Documentação:

- [FIX_MIDDLEWARE_EDGE_RUNTIME.md](./FIX_MIDDLEWARE_EDGE_RUNTIME.md) - Fix detalhado do middleware
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) - Configuração de variáveis
- [QUICK_FIX_SUMMARY.md](./QUICK_FIX_SUMMARY.md) - Resumo rápido

### Links Úteis:

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Status](https://vercel-status.com)

### Contato:

Se o problema persistir, contacte:

1. Suporte do Vercel (com deployment ID)
2. Suporte do Supabase (se problema de auth)
3. GitHub Issues do projeto

---

**Data:** 27 Nov 2025
**Status:** ✅ PRONTO PARA DEPLOY
**Versão:** Next.js 14.2 + Supabase SSR 0.8



