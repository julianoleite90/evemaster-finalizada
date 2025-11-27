# Guia de Teste - Fluxo Completo de Cadastro e Login

## Passo 1: Limpar Dados de Teste

Execute no Supabase SQL Editor:
```sql
-- Execute o script: supabase/scripts/cleanup_test_data.sql
```

Ou execute diretamente:
```sql
DELETE FROM public.organizers;
DELETE FROM public.affiliates;
DELETE FROM public.users;
DELETE FROM auth.users;
```

## Passo 2: Aplicar Migrações (se ainda não aplicadas)

Certifique-se de que as migrações estão aplicadas:
1. `011_improve_ensure_user_exists.sql` - Recupera dados dos metadados
2. `012_update_organizer_from_metadata.sql` - Função para atualizar perfil dos metadados

## Passo 3: Testar Cadastro

1. Acesse `/register`
2. Preencha o formulário completo:
   - **Tipo de Cadastro**: Organizador
   - **Tipo de Pessoa**: Jurídica ou Física
   - Preencha TODOS os campos:
     - Dados básicos (nome, email, telefone, senha)
     - Dados da empresa (CNPJ, razão social, endereço completo)
     - Dados do administrador (se jurídica)
     - Dados bancários (banco, agência, conta, etc.)
3. Clique em "Finalizar Cadastro"

## Passo 4: Verificar Metadados

Execute no Supabase SQL Editor:
```sql
SELECT 
  email,
  raw_user_meta_data->>'full_name' as nome,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->'organizer_data' as dados_organizador,
  email_confirmed_at
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI';
```

**Verifique:**
- ✅ `organizer_data` deve conter todos os dados (CNPJ, endereço, bancários)
- ✅ `role` deve ser "ORGANIZADOR"
- ✅ `email_confirmed_at` pode ser null (se precisar confirmar email)

## Passo 5: Confirmar Email (se necessário)

Se a confirmação de email estiver habilitada:
1. Verifique seu email
2. Clique no link de confirmação
3. Ou execute no Supabase SQL Editor:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI';
```

## Passo 6: Testar Login

1. Acesse `/login`
2. Digite email e senha
3. Clique em "Entrar"

**O que deve acontecer:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para `/dashboard/organizer`
- ✅ Nenhum erro de "perfil não encontrado"

## Passo 7: Verificar Dados no Banco

Execute no Supabase SQL Editor:
```sql
-- Verificar usuário
SELECT * FROM public.users WHERE email = 'SEU_EMAIL_AQUI';

-- Verificar perfil de organizador
SELECT 
  o.*,
  u.email,
  u.full_name,
  u.role
FROM public.organizers o
JOIN public.users u ON u.id = o.user_id
WHERE u.email = 'SEU_EMAIL_AQUI';
```

**Verifique:**
- ✅ `public.users` deve ter o registro com role ORGANIZADOR
- ✅ `public.organizers` deve ter o perfil completo com:
  - ✅ CNPJ preenchido
  - ✅ Endereço completo
  - ✅ Dados bancários preenchidos
  - ✅ Telefone, email, etc.

## Passo 8: Verificar Exibição no Dashboard

1. Acesse `/dashboard/organizer`
   - ✅ Deve carregar sem erros
   - ✅ Deve mostrar dados reais (não mockados)

2. Acesse `/dashboard/organizer/profile`
   - ✅ Deve mostrar todos os dados do cadastro:
     - Razão Social
     - CNPJ
     - Endereço completo
     - Telefone
     - Dados bancários

3. Acesse `/dashboard/organizer/events`
   - ✅ Deve carregar sem erro de "perfil não encontrado"

4. Acesse `/dashboard/organizer/registrations`
   - ✅ Deve carregar sem erro de "perfil não encontrado"

## Problemas Comuns

### Erro: "Perfil de organizador não encontrado"
- **Causa**: A função `ensure_user_exists` não foi executada
- **Solução**: Faça logout e login novamente, ou execute:
```sql
SELECT public.ensure_user_exists();
```

### Dados não aparecem no perfil
- **Causa**: Dados não estão nos metadados
- **Solução**: Verifique se o cadastro salvou `organizer_data` nos metadados
- Se não estiver, faça um novo cadastro (o código já está corrigido)

### Badge "12" ainda aparece no menu
- **Causa**: Cache do navegador
- **Solução**: Limpe o cache ou faça hard refresh (Ctrl+Shift+R)

## Checklist Final

- [ ] Dados limpos do banco
- [ ] Migrações aplicadas
- [ ] Cadastro realizado com sucesso
- [ ] Metadados contêm `organizer_data` completo
- [ ] Email confirmado
- [ ] Login funciona
- [ ] Redirecionamento para `/dashboard/organizer` funciona
- [ ] Perfil de organizador criado automaticamente
- [ ] Dados completos aparecem no perfil
- [ ] Dashboard carrega sem erros
- [ ] Nenhum dado mockado aparece
- [ ] Badge fixo removido do menu




