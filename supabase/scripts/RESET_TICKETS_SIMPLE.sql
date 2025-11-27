-- Script simples para resetar quantidades de ingressos para 50
-- e limpar todas as inscrições

-- Restaurar quantidades baseado nas inscrições + resetar para 50
UPDATE public.tickets 
SET quantity = 50
WHERE id IN (
  SELECT DISTINCT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- Limpar dados
DELETE FROM public.payments;
DELETE FROM public.registrations;
DELETE FROM public.athletes;

-- Verificar resultado
SELECT 
  e.name AS event_name,
  t.category AS ticket_category,
  t.quantity AS current_quantity
FROM public.events e
JOIN public.ticket_batches tb ON tb.event_id = e.id
JOIN public.tickets t ON t.batch_id = tb.id
ORDER BY e.name, t.category;
-- e limpar todas as inscrições

-- Restaurar quantidades baseado nas inscrições + resetar para 50
UPDATE public.tickets 
SET quantity = 50
WHERE id IN (
  SELECT DISTINCT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- Limpar dados
DELETE FROM public.payments;
DELETE FROM public.registrations;
DELETE FROM public.athletes;

-- Verificar resultado
SELECT 
  e.name AS event_name,
  t.category AS ticket_category,
  t.quantity AS current_quantity
FROM public.events e
JOIN public.ticket_batches tb ON tb.event_id = e.id
JOIN public.tickets t ON t.batch_id = tb.id
ORDER BY e.name, t.category;
-- e limpar todas as inscrições

-- Restaurar quantidades baseado nas inscrições + resetar para 50
UPDATE public.tickets 
SET quantity = 50
WHERE id IN (
  SELECT DISTINCT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- Limpar dados
DELETE FROM public.payments;
DELETE FROM public.registrations;
DELETE FROM public.athletes;

-- Verificar resultado
SELECT 
  e.name AS event_name,
  t.category AS ticket_category,
  t.quantity AS current_quantity
FROM public.events e
JOIN public.ticket_batches tb ON tb.event_id = e.id
JOIN public.tickets t ON t.batch_id = tb.id
ORDER BY e.name, t.category;
-- e limpar todas as inscrições

-- Restaurar quantidades baseado nas inscrições + resetar para 50
UPDATE public.tickets 
SET quantity = 50
WHERE id IN (
  SELECT DISTINCT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- Limpar dados
DELETE FROM public.payments;
DELETE FROM public.registrations;
DELETE FROM public.athletes;

-- Verificar resultado
SELECT 
  e.name AS event_name,
  t.category AS ticket_category,
  t.quantity AS current_quantity
FROM public.events e
JOIN public.ticket_batches tb ON tb.event_id = e.id
JOIN public.tickets t ON t.batch_id = tb.id
ORDER BY e.name, t.category;
-- e limpar todas as inscrições

-- Restaurar quantidades baseado nas inscrições + resetar para 50
UPDATE public.tickets 
SET quantity = 50
WHERE id IN (
  SELECT DISTINCT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- Limpar dados
DELETE FROM public.payments;
DELETE FROM public.registrations;
DELETE FROM public.athletes;

-- Verificar resultado
SELECT 
  e.name AS event_name,
  t.category AS ticket_category,
  t.quantity AS current_quantity
FROM public.events e
JOIN public.ticket_batches tb ON tb.event_id = e.id
JOIN public.tickets t ON t.batch_id = tb.id
ORDER BY e.name, t.category;


