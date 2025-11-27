-- Script de teste COMPLETO

-- 1. Criar inscrição (sem athlete_id/buyer_id pois são opcionais para inscrições públicas)
SELECT '=== CRIANDO INSCRIÇÃO ===' as info;

INSERT INTO public.registrations (
  event_id,
  ticket_id,
  registration_number,
  registration_date,
  registration_time,
  status
)
SELECT 
  tb.event_id,
  t.id as ticket_id,
  'TEST-' || substr(md5(random()::text), 1, 8),
  NOW()::date,
  NOW()::time,
  'confirmed'
FROM public.ticket_batches tb
JOIN public.tickets t ON t.batch_id = tb.id
LIMIT 1
RETURNING id, registration_number, event_id, ticket_id, status;

-- 2. Criar atleta vinculado à inscrição
SELECT '=== CRIANDO ATLETA ===' as info;

INSERT INTO public.athletes (
  registration_id,
  full_name,
  email,
  phone,
  cpf,
  gender,
  birth_date
)
SELECT
  id as registration_id,
  'Atleta Teste',
  'teste@teste.com',
  '48999999999',
  '12345678900',
  'Masculino',
  '1990-01-01'
FROM public.registrations
ORDER BY created_at DESC
LIMIT 1
RETURNING id, full_name, email, registration_id;

-- 3. Verificar resultado
SELECT '=== CONTAGEM FINAL ===' as info;
SELECT 
  (SELECT COUNT(*) FROM public.registrations) as total_registrations,
  (SELECT COUNT(*) FROM public.athletes) as total_athletes;

SELECT '=== INSCRIÇÕES ===' as info;
SELECT id, registration_number, event_id, ticket_id, status, created_at
FROM public.registrations ORDER BY created_at DESC LIMIT 3;

SELECT '=== ATLETAS ===' as info;
SELECT id, full_name, email, registration_id, created_at
FROM public.athletes ORDER BY created_at DESC LIMIT 3;
