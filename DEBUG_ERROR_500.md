# Debug Erro 500 em Produção

## Correções Aplicadas

1. ✅ **Validação de variáveis de ambiente** - Adicionada em todos os arquivos do Supabase
2. ✅ **Tratamento de erros robusto** - Middleware envolto em try-catch
3. ✅ **Remoção de throws** - Clientes Supabase não lançam mais erros, apenas logam
4. ✅ **Flag para desabilitar middleware** - Pode ser desabilitado via variável de ambiente

## Como Diagnosticar

### 1. Verificar Logs do Vercel

1. Acesse o dashboard do Vercel
2. Vá em **Deployments** → Selecione o último deploy
3. Clique em **Functions** ou **Runtime Logs**
4. Procure por mensagens de erro específicas

### 2. Verificar Variáveis de Ambiente

No Vercel, verifique se estão configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Importante**: Certifique-se de que não há espaços extras ou caracteres inválidos.

### 3. Desabilitar Middleware Temporariamente

Se o problema persistir, você pode desabilitar o middleware temporariamente:

1. No Vercel, adicione a variável de ambiente:
   - Nome: `MIDDLEWARE_ENABLED`
   - Valor: `false`

2. Faça um novo deploy

Isso permitirá que as páginas carreguem sem o middleware, ajudando a identificar se o problema está no middleware ou em outro lugar.

### 4. Testar Páginas Específicas

Teste acessar diferentes rotas para identificar qual página causa o erro:
- `/` (página inicial)
- `/login`
- `/dashboard/organizer`
- `/evento/[slug]`

### 5. Verificar Build Local

Execute localmente para ver se o erro ocorre:

```bash
npm run build
npm start
```

## Possíveis Causas

1. **Variáveis de ambiente não configuradas** - Verifique no Vercel
2. **Problema com Edge Runtime** - O middleware roda no Edge Runtime
3. **Problema com alguma página específica** - Verifique os logs
4. **Problema com imports** - Algum import pode estar causando erro

## Próximos Passos

Se o erro persistir após essas correções:

1. Compartilhe os logs do Vercel
2. Indique qual página específica está dando erro
3. Verifique se o build local funciona

## Arquivos Modificados

- `lib/supabase/client.ts` - Removido throw, adicionado fallback
- `lib/supabase/server.ts` - Removido throw, adicionado fallback
- `middleware.ts` - Tratamento de erros robusto, flag para desabilitar
- `next.config.js` - Configurações adicionais para estabilidade


