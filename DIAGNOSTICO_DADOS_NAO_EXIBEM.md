# Diagnóstico: Por que os dados não exibem em local?

## Possíveis Causas

### 1. Problema com RLS (Row Level Security)
**Sintoma:** Query retorna vazio ou erro de permissão
**Verificação:**
- Execute `supabase/scripts/test_rls_organizer.sql` no Supabase SQL Editor
- Verifique se `auth.uid()` retorna o ID correto
- Verifique se `user_id` na tabela `organizers` bate com `auth.uid()`

**Solução:**
- Se `auth.uid()` retornar NULL, o problema é de autenticação
- Se `user_id` não bater, o perfil foi criado com ID errado

### 2. Problema com Cliente Supabase em Local
**Sintoma:** `getSession()` retorna null mesmo estando logado
**Causa:** Cookies não estão sendo lidos corretamente

**Verificação:**
1. Abra o console do navegador (F12)
2. Vá em Application > Cookies
3. Verifique se existem cookies do Supabase (sb-*)
4. Verifique se os cookies têm o domínio correto

**Solução:**
- Limpar cookies e fazer login novamente
- Verificar se o domínio está correto (localhost vs 127.0.0.1)

### 3. Problema com Token de Autenticação
**Sintoma:** `getUser()` retorna null mas `getSession()` retorna dados
**Causa:** Token expirado ou inválido

**Verificação:**
- No console, verifique os logs de "=== DEBUG AUTENTICAÇÃO ==="
- Veja se `verifyUser` retorna null

**Solução:**
- Fazer logout e login novamente
- Verificar se o token está sendo renovado automaticamente

### 4. Problema com Queries Silenciosas
**Sintoma:** Query não retorna erro mas também não retorna dados
**Causa:** Erro está sendo ignorado ou RLS está bloqueando silenciosamente

**Verificação:**
- No console, verifique os logs de "=== RESULTADO DA QUERY ==="
- Veja se há `organizerError` mesmo quando não há dados

**Solução:**
- Verificar políticas RLS
- Verificar se o `user_id` está correto

## Passos para Diagnosticar

1. **Abra o console do navegador (F12)**
2. **Vá para a página de perfil**
3. **Verifique os logs:**
   - `=== DEBUG AUTENTICAÇÃO ===`
   - `=== RESULTADO DA QUERY ===`
4. **Execute o script SQL:**
   - `supabase/scripts/test_rls_organizer.sql`
5. **Compare os resultados:**
   - O `user.id` do console bate com `auth.uid()` do SQL?
   - O `user_id` da tabela `organizers` bate com `auth.uid()`?

## Soluções Comuns

### Se `auth.uid()` retornar NULL no SQL:
- O problema é que você não está autenticado no contexto do SQL
- Execute o script enquanto está logado na aplicação
- Ou use `SET request.jwt.claim.sub = 'SEU_USER_ID_AQUI'`

### Se `user_id` não bater com `auth.uid()`:
- O perfil foi criado com ID errado
- Execute: `UPDATE public.organizers SET user_id = auth.uid() WHERE id = 'ID_DO_ORGANIZER'`

### Se cookies não estão sendo lidos:
- Limpar cookies do navegador
- Fazer login novamente
- Verificar se está usando HTTPS em produção (cookies Secure)

### Se token está expirado:
- Fazer logout e login novamente
- Verificar configuração de refresh token no Supabase



