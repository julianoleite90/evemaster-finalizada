-- ============================================
-- RECUPERAR DADOS DO CADASTRO DOS METADADOS
-- ============================================
-- Este script verifica se há dados nos metadados do auth.users
-- que podem ser usados para preencher o perfil de organizador

-- 1. Verificar metadados completos
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data,
  jsonb_pretty(au.raw_user_meta_data) as metadados_formatados
FROM auth.users au
WHERE au.email = 'julianodesouzaleite@gmail.com';

-- 2. Se os dados estiverem nos metadados, precisamos salvá-los no cadastro
-- Por enquanto, vamos verificar o que temos e criar um script de atualização
-- baseado nos dados que você preencheu no cadastro

-- NOTA: Os dados do cadastro (CNPJ, endereço, dados bancários) não estão sendo
-- salvos nos metadados do auth.users. Eles são passados diretamente para a função
-- create_organizer_profile, mas se essa função falhar (porque o registro em users
-- ainda não existe), os dados se perdem.

-- Para resolver isso, precisamos:
-- 1. Modificar o cadastro para salvar todos os dados nos metadados
-- 2. Ou criar um script manual para atualizar o perfil com os dados que você lembra



