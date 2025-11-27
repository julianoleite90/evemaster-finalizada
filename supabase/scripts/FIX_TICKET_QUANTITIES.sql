-- Script para corrigir as quantidades dos ingressos
-- Garantir que cada categoria tenha exatamente 25 ingressos (totalizando 50 por lote)

BEGIN;

-- 1. Verificar estado atual
SELECT 'ANTES DA CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS current_quantity,
  COUNT(r.id) AS registrations_count
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 2. Corrigir quantidades: 25 para cada categoria + registrações existentes
UPDATE public.tickets 
SET quantity = 25 + COALESCE((
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
), 0)
WHERE id IN (
  SELECT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- 3. Verificar estado após correção
SELECT 'APÓS CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS corrected_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity - COUNT(r.id)) AS available_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 4. Verificar se a soma está correta (deve ser 50 por lote)
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_declared_total,
  SUM(t.quantity - COALESCE(reg_count.count, 0)) AS sum_available_tickets,
  CASE 
    WHEN tb.total_quantity = SUM(t.quantity - COALESCE(reg_count.count, 0)) THEN '✅ CORRETO'
    ELSE '❌ AINDA INCONSISTENTE'
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

COMMIT;

SELECT '✅ CORREÇÃO CONCLUÍDA! Cada categoria agora tem 25 ingressos disponíveis.' as resultado;
-- Garantir que cada categoria tenha exatamente 25 ingressos (totalizando 50 por lote)

BEGIN;

-- 1. Verificar estado atual
SELECT 'ANTES DA CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS current_quantity,
  COUNT(r.id) AS registrations_count
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 2. Corrigir quantidades: 25 para cada categoria + registrações existentes
UPDATE public.tickets 
SET quantity = 25 + COALESCE((
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
), 0)
WHERE id IN (
  SELECT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- 3. Verificar estado após correção
SELECT 'APÓS CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS corrected_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity - COUNT(r.id)) AS available_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 4. Verificar se a soma está correta (deve ser 50 por lote)
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_declared_total,
  SUM(t.quantity - COALESCE(reg_count.count, 0)) AS sum_available_tickets,
  CASE 
    WHEN tb.total_quantity = SUM(t.quantity - COALESCE(reg_count.count, 0)) THEN '✅ CORRETO'
    ELSE '❌ AINDA INCONSISTENTE'
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

COMMIT;

SELECT '✅ CORREÇÃO CONCLUÍDA! Cada categoria agora tem 25 ingressos disponíveis.' as resultado;
-- Garantir que cada categoria tenha exatamente 25 ingressos (totalizando 50 por lote)

BEGIN;

-- 1. Verificar estado atual
SELECT 'ANTES DA CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS current_quantity,
  COUNT(r.id) AS registrations_count
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 2. Corrigir quantidades: 25 para cada categoria + registrações existentes
UPDATE public.tickets 
SET quantity = 25 + COALESCE((
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
), 0)
WHERE id IN (
  SELECT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- 3. Verificar estado após correção
SELECT 'APÓS CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS corrected_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity - COUNT(r.id)) AS available_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 4. Verificar se a soma está correta (deve ser 50 por lote)
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_declared_total,
  SUM(t.quantity - COALESCE(reg_count.count, 0)) AS sum_available_tickets,
  CASE 
    WHEN tb.total_quantity = SUM(t.quantity - COALESCE(reg_count.count, 0)) THEN '✅ CORRETO'
    ELSE '❌ AINDA INCONSISTENTE'
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

COMMIT;

SELECT '✅ CORREÇÃO CONCLUÍDA! Cada categoria agora tem 25 ingressos disponíveis.' as resultado;
-- Garantir que cada categoria tenha exatamente 25 ingressos (totalizando 50 por lote)

BEGIN;

-- 1. Verificar estado atual
SELECT 'ANTES DA CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS current_quantity,
  COUNT(r.id) AS registrations_count
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 2. Corrigir quantidades: 25 para cada categoria + registrações existentes
UPDATE public.tickets 
SET quantity = 25 + COALESCE((
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
), 0)
WHERE id IN (
  SELECT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- 3. Verificar estado após correção
SELECT 'APÓS CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS corrected_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity - COUNT(r.id)) AS available_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 4. Verificar se a soma está correta (deve ser 50 por lote)
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_declared_total,
  SUM(t.quantity - COALESCE(reg_count.count, 0)) AS sum_available_tickets,
  CASE 
    WHEN tb.total_quantity = SUM(t.quantity - COALESCE(reg_count.count, 0)) THEN '✅ CORRETO'
    ELSE '❌ AINDA INCONSISTENTE'
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

COMMIT;

SELECT '✅ CORREÇÃO CONCLUÍDA! Cada categoria agora tem 25 ingressos disponíveis.' as resultado;
-- Garantir que cada categoria tenha exatamente 25 ingressos (totalizando 50 por lote)

BEGIN;

-- 1. Verificar estado atual
SELECT 'ANTES DA CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS current_quantity,
  COUNT(r.id) AS registrations_count
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 2. Corrigir quantidades: 25 para cada categoria + registrações existentes
UPDATE public.tickets 
SET quantity = 25 + COALESCE((
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
), 0)
WHERE id IN (
  SELECT t.id
  FROM public.tickets t
  JOIN public.ticket_batches tb ON t.batch_id = tb.id
  JOIN public.events e ON tb.event_id = e.id
);

-- 3. Verificar estado após correção
SELECT 'APÓS CORREÇÃO' as status;
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_total,
  t.category AS ticket_category,
  t.quantity AS corrected_quantity,
  COUNT(r.id) AS registrations_count,
  (t.quantity - COUNT(r.id)) AS available_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
LEFT JOIN public.registrations r ON r.ticket_id = t.id
GROUP BY e.id, e.name, tb.id, tb.name, tb.total_quantity, t.id, t.category, t.quantity
ORDER BY e.name, tb.name, t.category;

-- 4. Verificar se a soma está correta (deve ser 50 por lote)
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  tb.total_quantity AS batch_declared_total,
  SUM(t.quantity - COALESCE(reg_count.count, 0)) AS sum_available_tickets,
  CASE 
    WHEN tb.total_quantity = SUM(t.quantity - COALESCE(reg_count.count, 0)) THEN '✅ CORRETO'
    ELSE '❌ AINDA INCONSISTENTE'
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

COMMIT;

SELECT '✅ CORREÇÃO CONCLUÍDA! Cada categoria agora tem 25 ingressos disponíveis.' as resultado;


