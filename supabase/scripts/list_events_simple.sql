-- ============================================
-- SCRIPT SIMPLES: Listar eventos (versão rápida)
-- ============================================

SELECT 
  id,
  name as "Nome",
  slug as "Slug",
  event_date as "Data",
  status as "Status",
  CASE 
    WHEN status = 'draft' THEN 'Rascunho'
    WHEN status = 'active' THEN 'Publicado'
    WHEN status = 'finished' THEN 'Finalizado'
    WHEN status = 'cancelled' THEN 'Cancelado'
    ELSE status::text
  END as "Status Traduzido",
  created_at as "Criado em"
FROM public.events
ORDER BY created_at DESC;

