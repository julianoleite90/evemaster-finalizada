# Fluxo de Criação Automática de Conta e Login sem Senha

## Resumo

Implementamos um sistema que:
1. **Cria contas automaticamente** quando uma inscrição é realizada
2. **Vincula as inscrições ao usuário** através do `user_id`
3. **Permite login sem senha** usando magic link (link enviado por email)

## Como Funciona

### 1. Durante a Inscrição

Quando um participante se inscreve em um evento:

1. **Antes de criar a inscrição**, o sistema tenta criar uma conta para cada participante
2. A API `/api/auth/criar-conta-automatica` é chamada com os dados do participante
3. Se a conta não existe:
   - Cria um usuário no Supabase Auth (sem senha, email confirmado automaticamente)
   - Salva todos os dados nos metadados do usuário
   - Cria registro na tabela `users` com role `ATLETA`
4. Se a conta já existe:
   - Atualiza os metadados com os novos dados
   - Retorna o `user_id` existente
5. **A inscrição é criada** com o `user_id` vinculado (quando disponível)

### 2. Login sem Senha (Magic Link)

Na página de login (`/login`):

1. O usuário digita apenas o **email**
2. Clica em **"Entrar sem senha"**
3. O sistema envia um **link de acesso** por email
4. O usuário clica no link e é **automaticamente logado**
5. É redirecionado para `/my-account`

### 3. Dashboard de Membros

Após fazer login, o usuário acessa `/my-account` e vê:

- **Minhas Inscrições**: Lista todas as inscrições vinculadas ao usuário
  - Busca por `user_id` nas `registrations`
  - Busca por `email` nos `athletes` (para inscrições antigas)
- **Meu Perfil**: Permite editar dados pessoais

## Arquivos Modificados/Criados

### Novos Arquivos

1. **`app/api/auth/criar-conta-automatica/route.ts`**
   - API para criar/atualizar contas automaticamente
   - Usa Service Role Key se disponível (para criar usuários sem senha)
   - Fallback para signUp normal se não tiver Service Role Key

### Arquivos Modificados

1. **`app/(public)/inscricao/[eventId]/page.tsx`**
   - Cria contas antes de criar inscrições
   - Vincula `user_id` nas registrations quando disponível

2. **`app/(auth)/login/page.tsx`**
   - Adicionada opção de login sem senha (magic link)
   - Interface melhorada com separador "ou"

3. **`app/my-account/page.tsx`**
   - Busca inscrições por `user_id` E por `email` (para compatibilidade)
   - Remove duplicatas automaticamente

## Variáveis de Ambiente Necessárias

### Obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase

### Opcionais (Recomendadas)

- `SUPABASE_SERVICE_ROLE_KEY` - Chave de service role (permite criar usuários sem senha)
  - **Sem esta chave**: O sistema usa `signUp` normal (usuário precisa confirmar email)
  - **Com esta chave**: O sistema cria usuários diretamente com email confirmado

## Configuração no Vercel

1. Adicione `SUPABASE_SERVICE_ROLE_KEY` nas variáveis de ambiente do Vercel
2. Obtenha a chave em: Supabase Dashboard → Settings → API → `service_role` key

## Fluxo Completo

```
Participante preenche formulário de inscrição
    ↓
Sistema cria conta automaticamente (se não existir)
    ↓
Sistema cria inscrição vinculada ao user_id
    ↓
Sistema envia email de confirmação
    ↓
Participante recebe email com link de acesso
    ↓
Participante clica no link ou usa "Entrar sem senha"
    ↓
Participante é logado automaticamente
    ↓
Participante acessa /my-account e vê suas inscrições
```

## Benefícios

1. **Experiência do usuário melhorada**: Não precisa criar conta manualmente
2. **Login simplificado**: Apenas email, sem senha
3. **Dados centralizados**: Todas as inscrições vinculadas ao usuário
4. **Compatibilidade**: Funciona com inscrições antigas (busca por email)

## Notas Importantes

- Se `SUPABASE_SERVICE_ROLE_KEY` não estiver configurada, o sistema ainda funciona, mas:
  - Usuários precisarão confirmar email antes de fazer login
  - Magic link pode não funcionar até o email ser confirmado

- As inscrições antigas (sem `user_id`) ainda aparecem no dashboard porque:
  - O sistema busca também por email nos `athletes`
  - Isso garante compatibilidade com dados existentes



