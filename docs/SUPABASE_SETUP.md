# Guia de Configuração do Supabase

Este guia explica como configurar o Storage e as políticas RLS (Row Level Security) no Supabase.

## 📦 1. Configuração do Storage

### Passo 1: Criar Buckets

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**

#### Bucket: `event-banners`
- **Name:** `event-banners`
- **Public bucket:** ✅ Sim (para permitir acesso público às imagens)
- **File size limit:** 5 MB (ou conforme necessário)
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

#### Bucket: `event-gpx`
- **Name:** `event-gpx`
- **Public bucket:** ✅ Sim
- **File size limit:** 10 MB
- **Allowed MIME types:** `application/gpx+xml, application/xml`

### Passo 2: Configurar Políticas de Storage

Para cada bucket, vá em **Policies** e crie as seguintes políticas:

#### Política de Upload (event-banners)
```sql
-- Permitir upload para usuários autenticados com role ORGANIZADOR
CREATE POLICY "Organizers can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.organizers o ON o.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.role = 'ORGANIZADOR'
  )
);
```

#### Política de Leitura (event-banners)
```sql
-- Permitir leitura pública
CREATE POLICY "Public can view banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');
```

#### Política de Deletar (event-banners)
```sql
-- Permitir deletar apenas o organizador do evento
CREATE POLICY "Organizers can delete own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE o.user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);
```

**Repita as mesmas políticas para o bucket `event-gpx`**, apenas alterando `'event-banners'` para `'event-gpx'`.

### Passo 3: Configurar CORS (Opcional)

Se precisar acessar os arquivos de outros domínios:

1. Vá em **Storage** > **Settings**
2. Configure CORS conforme necessário

---

## 🔒 2. Configuração de Row Level Security (RLS)

### Visão Geral

RLS permite controlar quem pode ler, inserir, atualizar ou deletar dados em cada tabela.

### Políticas Básicas Implementadas

O schema já inclui algumas políticas básicas. Vamos expandir:

### 2.1. Políticas para `users`

```sql
-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);
```

### 2.2. Políticas para `organizers`

```sql
-- Organizadores podem ver seu próprio perfil
CREATE POLICY "Organizers can view own profile"
ON public.organizers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Organizadores podem atualizar seu próprio perfil
CREATE POLICY "Organizers can update own profile"
ON public.organizers FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Organizadores podem inserir seu próprio perfil
CREATE POLICY "Organizers can insert own profile"
ON public.organizers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

### 2.3. Políticas para `events`

```sql
-- Todos podem ver eventos ativos
CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
TO public
USING (status = 'active');

-- Organizadores podem ver seus próprios eventos (qualquer status)
CREATE POLICY "Organizers can view own events"
ON public.events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = events.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- Organizadores podem criar eventos
CREATE POLICY "Organizers can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = events.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- Organizadores podem atualizar seus próprios eventos
CREATE POLICY "Organizers can update own events"
ON public.events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = events.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- Organizadores podem deletar seus próprios eventos (apenas drafts)
CREATE POLICY "Organizers can delete own draft events"
ON public.events FOR DELETE
TO authenticated
USING (
  status = 'draft' AND
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = events.organizer_id
    AND organizers.user_id = auth.uid()
  )
);
```

### 2.4. Políticas para `ticket_batches` e `tickets`

```sql
-- Todos podem ver lotes e ingressos de eventos ativos
CREATE POLICY "Anyone can view active ticket batches"
ON public.ticket_batches FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = ticket_batches.event_id
    AND events.status = 'active'
  )
);

-- Organizadores podem gerenciar lotes de seus eventos
CREATE POLICY "Organizers can manage own ticket batches"
ON public.ticket_batches FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE e.id = ticket_batches.event_id
    AND o.user_id = auth.uid()
  )
);

-- Mesmas políticas para tickets
CREATE POLICY "Anyone can view active tickets"
ON public.tickets FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.ticket_batches tb
    JOIN public.events e ON e.id = tb.event_id
    WHERE tb.id = tickets.batch_id
    AND e.status = 'active'
  )
);

CREATE POLICY "Organizers can manage own tickets"
ON public.tickets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ticket_batches tb
    JOIN public.events e ON e.id = tb.event_id
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE tb.id = tickets.batch_id
    AND o.user_id = auth.uid()
  )
);
```

### 2.5. Políticas para `registrations`

```sql
-- Usuários podem ver suas próprias inscrições
CREATE POLICY "Users can view own registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (athlete_id = auth.uid() OR buyer_id = auth.uid());

-- Organizadores podem ver inscrições de seus eventos
CREATE POLICY "Organizers can view event registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE e.id = registrations.event_id
    AND o.user_id = auth.uid()
  )
);

-- Usuários podem criar suas próprias inscrições
CREATE POLICY "Users can create own registrations"
ON public.registrations FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- Organizadores podem atualizar inscrições de seus eventos
CREATE POLICY "Organizers can update event registrations"
ON public.registrations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE e.id = registrations.event_id
    AND o.user_id = auth.uid()
  )
);
```

### 2.6. Políticas para `event_settings`

```sql
-- Organizadores podem ver configurações de seus eventos
CREATE POLICY "Organizers can view own event settings"
ON public.event_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE e.id = event_settings.event_id
    AND o.user_id = auth.uid()
  )
);

-- Organizadores podem gerenciar configurações de seus eventos
CREATE POLICY "Organizers can manage own event settings"
ON public.event_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE e.id = event_settings.event_id
    AND o.user_id = auth.uid()
  )
);
```

---

## 🚀 3. Aplicando as Políticas

### Opção 1: Via SQL Editor

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Cole todas as políticas acima
3. Execute o script

### Opção 2: Via Arquivo de Migração

Crie um arquivo `supabase/migrations/002_rls_policies.sql` e cole todas as políticas.

---

## ✅ 4. Verificação

### Testar Storage

```typescript
// No seu código
const supabase = createClient()
const { data, error } = await supabase.storage
  .from('event-banners')
  .list()

console.log('Buckets:', data)
```

### Testar RLS

1. Crie um usuário de teste
2. Tente acessar dados que não deveria ter acesso
3. Verifique se as políticas estão funcionando

---

## 📝 5. Notas Importantes

1. **Sempre teste as políticas** antes de colocar em produção
2. **Backup do banco** antes de aplicar mudanças
3. **Políticas são cumulativas** - se houver múltiplas políticas, qualquer uma que permitir acesso será suficiente
4. **Use `auth.uid()`** para obter o ID do usuário autenticado
5. **Public buckets** permitem acesso sem autenticação, mas você ainda pode controlar uploads

---

## 🔧 6. Troubleshooting

### Erro: "new row violates row-level security policy"

- Verifique se o usuário está autenticado
- Verifique se a política permite a operação desejada
- Verifique se o usuário tem o role correto

### Erro: "storage.objects: new row violates row-level security policy"

- Verifique se o bucket existe
- Verifique se as políticas de storage estão corretas
- Verifique se o usuário tem permissão para fazer upload

### Arquivos não aparecem publicamente

- Verifique se o bucket é público
- Verifique a URL gerada
- Verifique as políticas de leitura

---

## 📚 Recursos Adicionais

- [Documentação do Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentação do RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Exemplos de Políticas](https://supabase.com/docs/guides/auth/row-level-security#examples)



