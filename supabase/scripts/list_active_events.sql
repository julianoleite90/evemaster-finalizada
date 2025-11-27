-- ============================================
-- SCRIPT: Listar eventos ativos para copiar o ID
-- ============================================
-- Execute este script primeiro para ver os eventos ativos e copiar o ID

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

-- Depois de copiar o ID, use no script restore_tickets_quantities.sql

