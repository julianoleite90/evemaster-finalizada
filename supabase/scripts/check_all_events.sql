-- Verificar todos os eventos no banco de dados
SELECT 
  e.id,
  e.name,
  e.status,
  e.organizer_id,
  e.banner_url,
  e.location,
  e.address,
  e.created_at,
  o.company_name as organizador
FROM public.events e
LEFT JOIN public.organizers o ON o.id = e.organizer_id
ORDER BY e.created_at DESC;

-- Verificar se o organizer_id está correto
SELECT 
  '=== ORGANIZADORES ===' as info,
  o.id as organizer_id,
  o.user_id,
  o.company_name,
  au.email
FROM public.organizers o
LEFT JOIN auth.users au ON au.id = o.user_id;

-- Verificar quantos eventos cada organizador tem
SELECT 
  o.id as organizer_id,
  o.company_name,
  COUNT(e.id) as total_eventos
FROM public.organizers o
LEFT JOIN public.events e ON e.organizer_id = o.id
GROUP BY o.id, o.company_name;



