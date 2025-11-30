-- Verificar se CPF 08432641952 ou email elo.gabriela está salvo ao perfil julianodesouzaleite@gmail.com

-- Primeiro, encontrar o user_id do julianodesouzaleite@gmail.com
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.cpf
FROM users u
WHERE u.email = 'julianodesouzaleite@gmail.com'
LIMIT 1;

-- Depois, buscar perfis salvos vinculados a esse user_id
SELECT 
  spp.id,
  spp.user_id,
  spp.full_name,
  spp.email,
  spp.cpf,
  spp.phone,
  spp.created_at
FROM saved_participant_profiles spp
WHERE spp.user_id = (
  SELECT u.id 
  FROM users u 
  WHERE u.email = 'julianodesouzaleite@gmail.com'
  LIMIT 1
)
AND (
  spp.cpf = '08432641952' 
  OR spp.cpf LIKE '%08432641952%'
  OR spp.email LIKE '%elo.gabriela%'
  OR spp.email = 'elo.gabriela@gmail.com'
)
ORDER BY spp.created_at DESC;

-- Listar TODOS os perfis salvos deste usuário
SELECT 
  spp.id,
  spp.full_name,
  spp.email,
  spp.cpf,
  spp.phone,
  spp.created_at
FROM saved_participant_profiles spp
WHERE spp.user_id = (
  SELECT u.id 
  FROM users u 
  WHERE u.email = 'julianodesouzaleite@gmail.com'
  LIMIT 1
)
ORDER BY spp.created_at DESC;

