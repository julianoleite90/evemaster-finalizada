-- Script para atualizar a senha do usuário elo.gabriela@gmail.com
-- Senha: Password90!#%90
-- 
-- IMPORTANTE: No Supabase, as senhas são armazenadas no auth.users com hash bcrypt.
-- A forma mais segura é usar a API Admin do Supabase ou o Dashboard.

-- Verificar se o usuário existe
SELECT 
    id,
    email,
    created_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Senha configurada'
        ELSE 'Sem senha'
    END AS password_status
FROM auth.users
WHERE email = 'elo.gabriela@gmail.com';

-- ATUALIZAR SENHA VIA API ADMIN (RECOMENDADO)
-- Use o código abaixo em uma API route ou via Supabase Dashboard
-- 
-- const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
--   user_id,
--   { password: 'Password90!#%90' }
-- )

-- ATUALIZAR SENHA VIA SQL (ALTERNATIVA - requer privilégios)
-- NOTA: Isso atualiza diretamente no auth.users. Use com cuidado.
-- O Supabase usa bcrypt para hash de senhas, então você precisaria gerar o hash primeiro.
-- 
-- Para gerar o hash bcrypt, você pode usar uma ferramenta online ou biblioteca.
-- Exemplo de hash bcrypt para "Password90!#%90":
-- $2a$10$[salt][hash] (formato completo varia)

-- Se você tiver acesso direto ao banco e quiser tentar:
-- UPDATE auth.users
-- SET encrypted_password = crypt('Password90!#%90', gen_salt('bf'))
-- WHERE email = 'elo.gabriela@gmail.com';

-- RECOMENDAÇÃO FINAL:
-- A melhor forma é usar o Supabase Dashboard:
-- 1. Acesse: https://app.supabase.com
-- 2. Vá em Authentication > Users
-- 3. Encontre o usuário elo.gabriela@gmail.com
-- 4. Clique nos três pontos (...) > "Reset Password"
-- 5. Ou use a API Admin do Supabase com SUPABASE_SERVICE_ROLE_KEY

-- OU use a API route criada: /api/admin/update-user-password
-- Exemplo de chamada (via curl ou Postman):
-- POST http://localhost:3000/api/admin/update-user-password
-- Content-Type: application/json
-- Body: {
--   "email": "elo.gabriela@gmail.com",
--   "password": "Password90!#%90"
-- }

