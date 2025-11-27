# Schema do Banco de Dados - EveMaster

Este diretório contém as migrações do banco de dados Supabase.

## Estrutura

- `migrations/001_initial_schema.sql` - Schema inicial completo com todas as tabelas

## Como Aplicar as Migrações

### Opção 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `001_initial_schema.sql`
4. Execute o script

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao seu projeto
supabase link --project-ref seu-project-ref

# Aplicar migrações
supabase db push
```

### Opção 3: Via SQL direto

1. Copie o conteúdo de `migrations/001_initial_schema.sql`
2. Execute no SQL Editor do Supabase

## Tabelas Principais

### Core
- `users` - Usuários da plataforma
- `organizers` - Perfis de organizadores
- `events` - Eventos esportivos
- `ticket_batches` - Lotes de ingressos
- `tickets` - Ingressos individuais
- `registrations` - Inscrições
- `athletes` - Dados dos atletas
- `payments` - Pagamentos

### Configurações
- `event_settings` - Configurações avançadas dos eventos

### Afiliados
- `affiliates` - Afiliados
- `affiliate_coupons` - Cupons de desconto
- `withdrawal_requests` - Solicitações de saque

### Outros
- `ownership_transfers` - Transferências de titularidade

## Próximos Passos

Após aplicar o schema:

1. Configurar Row Level Security (RLS) conforme necessário
2. Criar políticas de acesso específicas
3. Configurar Storage buckets para imagens
4. Criar funções Edge Functions se necessário
