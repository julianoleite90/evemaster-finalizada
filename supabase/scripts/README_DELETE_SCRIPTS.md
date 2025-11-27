# Scripts SQL para Deletar Inscrições e Usuários

## ⚠️ ATENÇÃO

**Estes scripts deletam dados permanentemente!** Sempre faça backup antes de executar.

## 📋 Scripts Disponíveis

### 1. `delete_all_test_data.sql` - Deletar TUDO rapidamente
**Uso:** Limpar todos os dados de teste de uma vez

```sql
-- Deleta:
-- - Todos os pagamentos
-- - Todos os atletas
-- - Todas as inscrições
-- - Todos os usuários com role 'ATLETA'
```

**Como usar:**
1. Abra no Supabase SQL Editor
2. Execute o script
3. Verifica quantos registros restaram

---

### 2. `delete_by_email.sql` - Deletar por email
**Uso:** Deletar todas as inscrições e o usuário de um email específico

**Como usar:**
1. Abra o arquivo `delete_by_email.sql`
2. Altere a linha: `v_email TEXT := 'email@exemplo.com';`
3. Coloque o email desejado
4. Execute no Supabase SQL Editor

**Exemplo:**
```sql
v_email TEXT := 'juliano@exemplo.com';
```

**O que deleta:**
- Todas as inscrições do usuário
- Todos os atletas vinculados
- Todos os pagamentos vinculados
- O usuário da tabela `users`
- (Opcional) O usuário do `auth.users`

---

### 3. `delete_by_event.sql` - Deletar por evento
**Uso:** Deletar todas as inscrições de um evento específico

**Como usar:**
1. Abra o arquivo `delete_by_event.sql`
2. Altere a linha: `v_event_id UUID := 'EVENT_ID_AQUI'::uuid;`
3. Coloque o ID do evento
4. Execute no Supabase SQL Editor

**Como encontrar o ID do evento:**
```sql
SELECT id, name, slug FROM public.events;
```

**O que deleta:**
- Todas as inscrições do evento
- Todos os atletas vinculados
- Todos os pagamentos vinculados
- **NÃO deleta os usuários** (apenas as inscrições)

---

### 4. `delete_registrations_and_users.sql` - Script completo com opções
**Uso:** Script completo com várias opções comentadas

**Opções disponíveis:**
- Deletar TODAS as inscrições e usuários
- Deletar inscrições de um evento específico
- Deletar inscrições de um usuário específico
- Deletar por email
- Deletar apenas inscrições (manter usuários)
- Criar backup antes de deletar
- Verificar quantos registros serão deletados

**Como usar:**
1. Abra o arquivo
2. Descomente a opção desejada
3. Ajuste os parâmetros (IDs, emails, etc.)
4. Execute no Supabase SQL Editor

---

## 🔒 Segurança

### Antes de deletar, sempre:

1. **Faça backup:**
```sql
-- Backup de registrations
CREATE TABLE public.registrations_backup AS 
SELECT * FROM public.registrations;

-- Backup de athletes
CREATE TABLE public.athletes_backup AS 
SELECT * FROM public.athletes;

-- Backup de payments
CREATE TABLE public.payments_backup AS 
SELECT * FROM public.payments;

-- Backup de users
CREATE TABLE public.users_backup AS 
SELECT * FROM public.users WHERE role = 'ATLETA';
```

2. **Verifique quantos registros serão deletados:**
```sql
SELECT 
  'Registrations' as tabela,
  COUNT(*) as total
FROM public.registrations
UNION ALL
SELECT 
  'Athletes' as tabela,
  COUNT(*) as total
FROM public.athletes
UNION ALL
SELECT 
  'Payments' as tabela,
  COUNT(*) as total
FROM public.payments
UNION ALL
SELECT 
  'Users (ATLETA)' as tabela,
  COUNT(*) as total
FROM public.users
WHERE role = 'ATLETA';
```

3. **Use transações (BEGIN/COMMIT) para poder reverter:**
```sql
BEGIN;
-- Seus comandos DELETE aqui
-- Se estiver tudo ok:
COMMIT;
-- Se algo der errado:
ROLLBACK;
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Limpar todos os dados de teste
```sql
-- Execute: delete_all_test_data.sql
```

### Exemplo 2: Deletar usuário específico
```sql
-- Edite delete_by_email.sql e coloque:
v_email TEXT := 'usuario@teste.com';
-- Execute
```

### Exemplo 3: Deletar inscrições de um evento
```sql
-- 1. Encontre o ID do evento:
SELECT id, name FROM public.events WHERE slug = 'meu-evento';

-- 2. Edite delete_by_event.sql e coloque:
v_event_id UUID := '123e4567-e89b-12d3-a456-426614174000'::uuid;
-- Execute
```

### Exemplo 4: Deletar apenas inscrições (manter usuários)
```sql
-- Use delete_registrations_and_users.sql
-- Descomente a OPÇÃO 4
```

---

## 🔄 Restaurar do Backup

Se precisar restaurar:

```sql
-- Restaurar registrations
INSERT INTO public.registrations
SELECT * FROM public.registrations_backup;

-- Restaurar athletes
INSERT INTO public.athletes
SELECT * FROM public.athletes_backup;

-- Restaurar payments
INSERT INTO public.payments
SELECT * FROM public.payments_backup;

-- Restaurar users
INSERT INTO public.users
SELECT * FROM public.users_backup;
```

---

## ⚠️ Importante

- **auth.users:** Os scripts não deletam do `auth.users` por padrão (comentado)
- Se quiser deletar também do `auth.users`, descomente a seção correspondente
- **Organizadores e Afiliados:** Os scripts NÃO deletam usuários com role `ORGANIZADOR` ou `AFILIADO`
- **Eventos:** Os scripts NÃO deletam eventos, apenas as inscrições

---

## 🆘 Problemas Comuns

### Erro: "violates foreign key constraint"
- Deletar na ordem correta: payments → athletes → registrations → users

### Erro: "permission denied"
- Verifique se está usando a conta correta no Supabase
- Alguns comandos podem precisar de privilégios de admin

### Não consegue deletar do auth.users
- Use o Supabase Dashboard → Authentication → Users
- Ou use a API Admin do Supabase

