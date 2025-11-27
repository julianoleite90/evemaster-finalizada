# Correção: Política RLS para INSERT na tabela USERS

## Problema

Ao tentar criar um novo cadastro, o erro abaixo aparece:

```
new row violates row-level security policy for table "users"
```

Isso acontece porque não existe uma política RLS que permita INSERT na tabela `users`, ou porque a sessão do usuário ainda não está totalmente estabelecida após o `signUp`.

## Solução (Recomendada)

Execute os dois arquivos SQL abaixo no Supabase SQL Editor, **nesta ordem**:

1. **Primeiro:** `supabase/migrations/004_fix_users_insert_policy.sql` (políticas RLS)
2. **Depois:** `supabase/migrations/005_create_user_insert_function.sql` (função do banco)

A função do banco de dados é mais robusta porque executa com privilégios elevados (`SECURITY DEFINER`), evitando problemas quando a sessão ainda não está totalmente estabelecida.

### Como aplicar:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase/migrations/004_fix_users_insert_policy.sql`
6. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Conteúdo do arquivo:

```sql
-- Usuários podem inserir seus próprios dados (durante o registro)
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Afiliados podem inserir seu próprio perfil
CREATE POLICY "Affiliates can insert own profile" ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Afiliados podem ver seu próprio perfil
CREATE POLICY "Affiliates can view own profile" ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Afiliados podem atualizar seu próprio perfil
CREATE POLICY "Affiliates can update own profile" ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
```

## Verificação

Após executar o SQL, tente criar um novo cadastro novamente. O erro não deve mais aparecer.

## Nota

Se você já executou o arquivo `002_rls_policies.sql` anteriormente, pode executar apenas a primeira política (INSERT para users). As políticas de `affiliates` já foram adicionadas ao arquivo `002_rls_policies.sql` para futuras instalações.

