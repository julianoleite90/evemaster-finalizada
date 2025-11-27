# 🚀 Quick Start - Configuração do Supabase

Guia rápido para configurar o Supabase e começar a usar a plataforma.

## 📋 Checklist de Configuração

### 1. ✅ Aplicar Schema do Banco de Dados

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute os arquivos na ordem:
   - `supabase/migrations/001_initial_schema.sql` (Schema completo)
   - `supabase/migrations/002_rls_policies.sql` (Políticas RLS)
   - `supabase/migrations/003_storage_policies.sql` (Políticas de Storage)

### 2. ✅ Criar Buckets de Storage

1. Vá em **Storage** > **New bucket**
2. Crie dois buckets:
   - **`event-banners`** (Público, 5MB, imagens)
   - **`event-gpx`** (Público, 10MB, arquivos GPX)

### 3. ✅ Verificar Variáveis de Ambiente

Certifique-se de que seu `.env.local` tem:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. ✅ Criar Primeiro Organizador

Após criar um usuário no Supabase Auth, você precisa criar um registro na tabela `organizers`:

```sql
-- 1. Primeiro, crie um usuário na tabela users
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'uuid-do-usuario-auth',
  'organizador@email.com',
  'Nome do Organizador',
  'ORGANIZADOR'
);

-- 2. Depois, crie o perfil de organizador
INSERT INTO public.organizers (user_id, company_name)
VALUES (
  'uuid-do-usuario-auth',
  'Nome da Empresa'
);
```

## 🧪 Testando

1. **Criar um evento:**
   - Acesse `/dashboard/organizer/events/new`
   - Preencha todos os 4 steps
   - Clique em "Criar Evento"
   - O evento será salvo no Supabase e você será redirecionado para a landing page

2. **Ver landing page:**
   - Acesse `/evento/[id-do-evento]`
   - Todos os dados do evento devem aparecer

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `docs/SUPABASE_SETUP.md` - Guia completo de configuração
- `supabase/README.md` - Documentação do schema

## ⚠️ Troubleshooting

### Erro: "new row violates row-level security policy"
- Verifique se o usuário está autenticado
- Verifique se as políticas RLS foram aplicadas
- Verifique se o usuário tem o role correto

### Erro: "storage.objects: new row violates row-level security policy"
- Verifique se os buckets foram criados
- Verifique se as políticas de storage foram aplicadas
- Verifique se o usuário é um organizador

### Eventos não aparecem
- Verifique se o evento tem `status = 'active'`
- Verifique as políticas RLS da tabela `events`



