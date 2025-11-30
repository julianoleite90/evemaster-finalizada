# Como Redefinir Senha do Juliano via API

## Método 1: Via Supabase Dashboard (Mais Fácil)

1. Acesse o Supabase Dashboard
2. Vá em **Authentication** > **Users**
3. Procure por `julianodesouzaleite@gmail.com`
4. Clique no usuário
5. Clique em **"Reset Password"** ou **"Update User"**
6. Defina a nova senha: `Password90!#%90`
7. Salve

## Método 2: Via API do Supabase Admin

### Passo 1: Obter o User ID

```bash
# Buscar o ID do usuário
curl -X GET 'https://[PROJECT-REF].supabase.co/auth/v1/admin/users?email=julianodesouzaleite@gmail.com' \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]" \
  -H "Content-Type: application/json"
```

### Passo 2: Atualizar a Senha

```bash
# Substitua [USER-ID] pelo ID retornado no passo 1
curl -X PUT 'https://[PROJECT-REF].supabase.co/auth/v1/admin/users/[USER-ID]' \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Password90!#%90"
  }'
```

### Passo 3: Verificar

```bash
# Verificar se a senha foi atualizada (não retorna a senha, mas confirma a atualização)
curl -X GET 'https://[PROJECT-REF].supabase.co/auth/v1/admin/users/[USER-ID]' \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]" \
  -H "Content-Type: application/json"
```

## Método 3: Via Script Node.js

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://[PROJECT-REF].supabase.co'
const supabaseServiceKey = '[SERVICE-ROLE-KEY]'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  // 1. Buscar usuário pelo email
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError)
    return
  }
  
  const user = users.find(u => u.email === 'julianodesouzaleite@gmail.com')
  
  if (!user) {
    console.error('Usuário não encontrado')
    return
  }
  
  console.log('Usuário encontrado:', user.id)
  
  // 2. Atualizar senha
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: 'Password90!#%90' }
  )
  
  if (error) {
    console.error('Erro ao atualizar senha:', error)
    return
  }
  
  console.log('✅ Senha atualizada com sucesso!')
  console.log('Usuário:', data.user.email)
}

resetPassword()
```

## Informações Necessárias

- **Email:** julianodesouzaleite@gmail.com
- **Nova Senha:** Password90!#%90
- **PROJECT-REF:** Seu projeto Supabase (ex: pdbltijasfwhpmemhgny)
- **SERVICE-ROLE-KEY:** Chave de serviço do Supabase (encontrada em Settings > API)

