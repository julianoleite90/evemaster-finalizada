-- Verificar quantidades de ingressos antes e depois das inscrições
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  t.category AS ticket_category,
  t.quantity AS current_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity + COUNT(r.id)) AS original_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;


