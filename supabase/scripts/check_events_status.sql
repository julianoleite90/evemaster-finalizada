-- Verificar status de todos os eventos
SELECT 
  id,
  name,
  status,
  created_at,
  updated_at
FROM public.events
ORDER BY created_at DESC;

-- Contar eventos por status
SELECT 
  status,
  COUNT(*) as quantidade
FROM public.events
GROUP BY status;

-- Verificar se algum evento tem status NULL
SELECT 
  id,
  name,
  status,
  CASE 
    WHEN status IS NULL THEN '❌ Status NULL'
    WHEN status = 'draft' THEN '📝 Rascunho'
    WHEN status = 'active' THEN '✅ Ativo'
    WHEN status = 'finished' THEN '🏁 Finalizado'
    WHEN status = 'cancelled' THEN '❌ Cancelado'
    ELSE '⚠️ Status desconhecido: ' || status
  END as status_descricao
FROM public.events
ORDER BY created_at DESC;



