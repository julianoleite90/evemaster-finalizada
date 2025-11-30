-- Script para verificar se o CPF está salvo no banco de dados
-- Substitua 'SEU_CPF_AQUI' pelo seu CPF (apenas números, sem pontos ou traços)

-- Exemplo: Se seu CPF é 123.456.789-00, digite: 12345678900

-- 1. Verificar se existe usuário com CPF
SELECT 
  '=== VERIFICAÇÃO DE CPF ===' as info,
  id,
  email,
  full_name,
  cpf,
  CASE 
    WHEN cpf IS NULL THEN '❌ CPF NÃO está salvo (NULL)'
    WHEN cpf = '' THEN '❌ CPF está vazio'
    WHEN LENGTH(cpf) = 11 THEN '✅ CPF está salvo corretamente (11 dígitos)'
    ELSE '⚠️ CPF tem formato estranho: ' || LENGTH(cpf) || ' caracteres'
  END as status_cpf,
  created_at,
  updated_at
FROM users
WHERE email = 'julianodesouzaleite@gmail.com'
   OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 2. Buscar por CPF específico (substitua pelo seu CPF sem formatação)
-- Exemplo: WHERE cpf = '12345678900'
SELECT 
  '=== BUSCAR POR CPF ===' as info,
  id,
  email,
  full_name,
  cpf,
  created_at
FROM users
WHERE cpf = '12345678900'  -- SUBSTITUA PELO SEU CPF (apenas números)
   OR cpf LIKE '%12345678900%';  -- Busca parcial também

-- 3. Ver todos os usuários com CPF (para debug)
SELECT 
  '=== TODOS OS USUÁRIOS COM CPF ===' as info,
  id,
  email,
  full_name,
  cpf,
  LENGTH(cpf) as cpf_length,
  created_at
FROM users
WHERE cpf IS NOT NULL 
  AND cpf != ''
ORDER BY created_at DESC
LIMIT 20;

-- 4. Verificar se há CPF duplicado
SELECT 
  '=== CPFs DUPLICADOS ===' as info,
  cpf,
  COUNT(*) as quantidade,
  STRING_AGG(email, ', ') as emails
FROM users
WHERE cpf IS NOT NULL 
  AND cpf != ''
GROUP BY cpf
HAVING COUNT(*) > 1;

