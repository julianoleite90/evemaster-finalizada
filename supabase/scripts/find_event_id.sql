-- ============================================
-- SCRIPT: Encontrar ID do evento pelo nome
-- ============================================
-- Use este script para encontrar o ID do evento antes de restaurar tickets

-- Listar todos os eventos ativos
SELECT 
  id,
  name as "Nome do Evento",
  slug as "Slug",
  event_date as "Data",
  status as "Status",
  created_at as "Criado em"
FROM public.events
WHERE status = 'active'
ORDER BY created_at DESC;

-- OU buscar por nome específico
/*
SELECT 
  id,
  name as "Nome do Evento",
  slug as "Slug",
  event_date as "Data",
  status as "Status"
FROM public.events
WHERE name ILIKE '%Night Run%'  -- ALTERE AQUI com parte do nome
ORDER BY created_at DESC;
*/

