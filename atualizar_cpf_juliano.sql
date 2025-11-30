-- Script para atualizar CPF do usuário Juliano
-- Email: julianodesouzaleite@gmail.com
-- CPF: 069.986.959-50 (sem formatação: 06998695950)
-- User ID: 11362ea0-669d-4dd9-9698-506bc69a827e

-- 1. Verificar CPF atual
SELECT 
  '=== CPF ATUAL ===' as info,
  id,
  email,
  full_name,
  cpf,
  CASE 
    WHEN cpf IS NULL THEN '❌ CPF NÃO está salvo (NULL)'
    WHEN cpf = '' THEN '❌ CPF está vazio'
    WHEN LENGTH(cpf) = 11 THEN '✅ CPF está salvo: ' || cpf
    ELSE '⚠️ CPF tem formato estranho: ' || cpf || ' (' || LENGTH(cpf) || ' caracteres)'
  END as status_cpf
FROM users
WHERE email = 'julianodesouzaleite@gmail.com'
   OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 2. ATUALIZAR CPF (remover formatação e salvar apenas números)
UPDATE users
SET 
  cpf = '06998695950',  -- CPF sem formatação (apenas números)
  updated_at = NOW()
WHERE email = 'julianodesouzaleite@gmail.com'
   OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 3. VERIFICAÇÃO FINAL
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  id,
  email,
  full_name,
  cpf,
  LENGTH(cpf) as cpf_length,
  CASE 
    WHEN cpf = '06998695950' THEN '✅ CPF atualizado com sucesso!'
    WHEN cpf IS NULL THEN '❌ CPF ainda está NULL'
    ELSE '⚠️ CPF diferente do esperado: ' || cpf
  END as resultado,
  updated_at
FROM users
WHERE email = 'julianodesouzaleite@gmail.com'
   OR id = '11362ea0-669d-4dd9-9698-506bc69a827e';

-- 4. TESTE: Buscar por CPF (deve encontrar o usuário)
SELECT 
  '=== TESTE DE BUSCA POR CPF ===' as info,
  id,
  email,
  full_name,
  cpf
FROM users
WHERE cpf = '06998695950';

-- ============================================
-- PRONTO! Após executar este script:
-- 1. O CPF estará salvo no banco: 06998695950
-- 2. A verificação no checkout vai funcionar
-- 3. Vai aparecer "Conta encontrada! Deseja fazer login rápido?"
-- ============================================

