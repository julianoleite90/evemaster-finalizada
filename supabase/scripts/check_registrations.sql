-- Contagem total
SELECT '=== CONTAGEM TOTAL ===' as info;

SELECT 
  (SELECT COUNT(*) FROM public.registrations) as total_registrations,
  (SELECT COUNT(*) FROM public.athletes) as total_athletes;

-- Verificar inscrições recentes
SELECT '=== INSCRIÇÕES RECENTES ===' as info;

SELECT *
FROM public.registrations
ORDER BY created_at DESC
LIMIT 10;

-- Verificar atletas recentes
SELECT '=== ATLETAS RECENTES ===' as info;

SELECT *
FROM public.athletes
ORDER BY created_at DESC
LIMIT 10;
