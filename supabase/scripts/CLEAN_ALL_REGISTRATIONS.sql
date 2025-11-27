-- Script para limpar todas as inscrições e restaurar quantidades de ingressos
-- ATENÇÃO: Este script irá deletar TODOS os dados de inscrições!

BEGIN;

-- 1. Contar registros antes da limpeza
SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

-- 2. Restaurar quantidades dos tickets baseado nas inscrições existentes
UPDATE public.tickets 
SET quantity = quantity + (
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
)
WHERE id IN (
  SELECT DISTINCT ticket_id 
  FROM public.registrations 
  WHERE ticket_id IS NOT NULL
);

-- 3. Deletar pagamentos (tem FK para registrations)
DELETE FROM public.payments;

-- 4. Deletar inscrições
DELETE FROM public.registrations;

-- 5. Deletar atletas
DELETE FROM public.athletes;

-- 6. Verificar quantidades após limpeza
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  t.category AS ticket_category,
  t.quantity AS restored_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
WHERE t.id IS NOT NULL
ORDER BY e.name, tb.name, t.category;

-- 7. Contar registros após limpeza
SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

COMMIT;

-- Mensagem de confirmação
SELECT '✅ LIMPEZA CONCLUÍDA! Todas as inscrições foram removidas e quantidades de ingressos restauradas.' as resultado;
-- ATENÇÃO: Este script irá deletar TODOS os dados de inscrições!

BEGIN;

-- 1. Contar registros antes da limpeza
SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

-- 2. Restaurar quantidades dos tickets baseado nas inscrições existentes
UPDATE public.tickets 
SET quantity = quantity + (
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
)
WHERE id IN (
  SELECT DISTINCT ticket_id 
  FROM public.registrations 
  WHERE ticket_id IS NOT NULL
);

-- 3. Deletar pagamentos (tem FK para registrations)
DELETE FROM public.payments;

-- 4. Deletar inscrições
DELETE FROM public.registrations;

-- 5. Deletar atletas
DELETE FROM public.athletes;

-- 6. Verificar quantidades após limpeza
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  t.category AS ticket_category,
  t.quantity AS restored_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
WHERE t.id IS NOT NULL
ORDER BY e.name, tb.name, t.category;

-- 7. Contar registros após limpeza
SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

COMMIT;

-- Mensagem de confirmação
SELECT '✅ LIMPEZA CONCLUÍDA! Todas as inscrições foram removidas e quantidades de ingressos restauradas.' as resultado;
-- ATENÇÃO: Este script irá deletar TODOS os dados de inscrições!

BEGIN;

-- 1. Contar registros antes da limpeza
SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

-- 2. Restaurar quantidades dos tickets baseado nas inscrições existentes
UPDATE public.tickets 
SET quantity = quantity + (
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
)
WHERE id IN (
  SELECT DISTINCT ticket_id 
  FROM public.registrations 
  WHERE ticket_id IS NOT NULL
);

-- 3. Deletar pagamentos (tem FK para registrations)
DELETE FROM public.payments;

-- 4. Deletar inscrições
DELETE FROM public.registrations;

-- 5. Deletar atletas
DELETE FROM public.athletes;

-- 6. Verificar quantidades após limpeza
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  t.category AS ticket_category,
  t.quantity AS restored_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
WHERE t.id IS NOT NULL
ORDER BY e.name, tb.name, t.category;

-- 7. Contar registros após limpeza
SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

COMMIT;

-- Mensagem de confirmação
SELECT '✅ LIMPEZA CONCLUÍDA! Todas as inscrições foram removidas e quantidades de ingressos restauradas.' as resultado;
-- ATENÇÃO: Este script irá deletar TODOS os dados de inscrições!

BEGIN;

-- 1. Contar registros antes da limpeza
SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

-- 2. Restaurar quantidades dos tickets baseado nas inscrições existentes
UPDATE public.tickets 
SET quantity = quantity + (
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
)
WHERE id IN (
  SELECT DISTINCT ticket_id 
  FROM public.registrations 
  WHERE ticket_id IS NOT NULL
);

-- 3. Deletar pagamentos (tem FK para registrations)
DELETE FROM public.payments;

-- 4. Deletar inscrições
DELETE FROM public.registrations;

-- 5. Deletar atletas
DELETE FROM public.athletes;

-- 6. Verificar quantidades após limpeza
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  t.category AS ticket_category,
  t.quantity AS restored_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
WHERE t.id IS NOT NULL
ORDER BY e.name, tb.name, t.category;

-- 7. Contar registros após limpeza
SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

COMMIT;

-- Mensagem de confirmação
SELECT '✅ LIMPEZA CONCLUÍDA! Todas as inscrições foram removidas e quantidades de ingressos restauradas.' as resultado;
-- ATENÇÃO: Este script irá deletar TODOS os dados de inscrições!

BEGIN;

-- 1. Contar registros antes da limpeza
SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'ANTES DA LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

-- 2. Restaurar quantidades dos tickets baseado nas inscrições existentes
UPDATE public.tickets 
SET quantity = quantity + (
  SELECT COUNT(*) 
  FROM public.registrations r 
  WHERE r.ticket_id = tickets.id
)
WHERE id IN (
  SELECT DISTINCT ticket_id 
  FROM public.registrations 
  WHERE ticket_id IS NOT NULL
);

-- 3. Deletar pagamentos (tem FK para registrations)
DELETE FROM public.payments;

-- 4. Deletar inscrições
DELETE FROM public.registrations;

-- 5. Deletar atletas
DELETE FROM public.athletes;

-- 6. Verificar quantidades após limpeza
SELECT 
  e.name AS event_name,
  tb.name AS batch_name,
  t.category AS ticket_category,
  t.quantity AS restored_quantity
FROM public.events e
LEFT JOIN public.ticket_batches tb ON tb.event_id = e.id
LEFT JOIN public.tickets t ON t.batch_id = tb.id
WHERE t.id IS NOT NULL
ORDER BY e.name, tb.name, t.category;

-- 7. Contar registros após limpeza
SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_registrations 
FROM public.registrations;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_athletes 
FROM public.athletes;

SELECT 
  'APÓS LIMPEZA' as status,
  COUNT(*) as total_payments 
FROM public.payments;

COMMIT;

-- Mensagem de confirmação
SELECT '✅ LIMPEZA CONCLUÍDA! Todas as inscrições foram removidas e quantidades de ingressos restauradas.' as resultado;


