-- Verificar configuração dos ingressos e lotes
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total_quantity,
  t.category AS ticket_category,
  t.quantity AS ticket_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity + COUNT(r.id)) AS original_ticket_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- Verificar soma das quantidades dos tickets vs total do lote
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_declared_total,
  SUM(t.quantity) AS sum_of_tickets_current,
  SUM(t.quantity + COALESCE(reg_count.count, 0)) AS sum_of_tickets_original,
  CASE 
    WHEN tb.total_quantity = SUM(t.quantity + COALESCE(reg_count.count, 0)) THEN '✅ CORRETO'
    ELSE '❌ INCONSISTENTE'
  END AS status
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN (
  SELECT ticket_id, COUNT(*) as count
  FROM public.registrations 
  GROUP BY ticket_id
) reg_count ON reg_count.ticket_id = t.id
WHERE tb.id IS NOT NULL
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity
ORDER BY e.name, tb.name;


