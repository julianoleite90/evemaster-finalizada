# 🔐 Como Redefinir a Senha de elo.gabriela@gmail.com

## ✅ Status Atual
- ✅ Usuário existe em `auth.users`
- ✅ Usuário existe em `public.users` e está ATIVO
- ✅ Vinculado à organização "FR RUNNING CLUB"
- ✅ Permissões configuradas (can_view: true)
- ❌ **PROBLEMA: Senha incorreta ou email não confirmado**

## 🔧 Soluções

### Opção 1: Via Supabase Dashboard (MAIS FÁCIL) ⭐

1. Acesse: https://app.supabase.com
2. Vá em: **Authentication** → **Users**
3. Encontre: `elo.gabriela@gmail.com`
4. Clique nos **"..."** (três pontos) ao lado do usuário
5. Selecione: **"Reset Password"**
6. O usuário receberá um email para redefinir a senha

**OU**

7. Clique nos **"..."** → **"Send magic link"**
8. O usuário receberá um link para fazer login sem senha

### Opção 2: Via API do Sistema

Use a API route criada: `/api/admin/update-user-password`

**Via cURL:**
```bash
curl -X POST http://localhost:3000/api/admin/update-user-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "elo.gabriela@gmail.com",
    "password": "NovaSenha123!"
  }'
```

**Via JavaScript (no console do navegador):**
```javascript
fetch('/api/admin/update-user-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'elo.gabriela@gmail.com',
    password: 'NovaSenha123!'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Opção 3: Confirmar Email (se não estiver confirmado)

1. Acesse: Supabase Dashboard → Authentication → Users
2. Encontre: `elo.gabriela@gmail.com`
3. Clique nos **"..."** → **"Resend confirmation email"**
4. OU marque manualmente como confirmado

### Opção 4: Via SQL (Confirmar Email)

Execute no Supabase SQL Editor:

```sql
-- Confirmar email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'elo.gabriela@gmail.com' 
AND email_confirmed_at IS NULL;
```

## 📋 Verificação Final

Após redefinir a senha, execute este SQL para verificar:

```sql
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status_email,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Senha configurada'
    ELSE '❌ Sem senha'
  END as status_senha
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';
```

## 🎯 Próximos Passos

1. ✅ Execute o script `fix_elo_gabriela_user.sql` (já executado)
2. 🔐 Redefina a senha usando uma das opções acima
3. ✅ Confirme o email se necessário
4. 🔄 Teste o login novamente

## ⚠️ Importante

- A senha deve ter no mínimo 6 caracteres
- Use uma senha forte (letras, números, símbolos)
- Após redefinir, o usuário pode fazer login normalmente

