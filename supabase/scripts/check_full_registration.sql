-- Ver todas as inscrições com dados completos
SELECT 
  r.id as registration_id,
  r.registration_number,
  r.status,
  r.created_at,
  e.name as event_name,
  t.category as ticket_category,
  a.full_name as athlete_name,
  a.email as athlete_email,
  a.phone as athlete_phone,
  a.cpf as athlete_cpf,
  a.gender as athlete_gender,
  a.age as athlete_age,
  a.country as athlete_country,
  a.city as athlete_city,
  a.state as athlete_state
FROM public.registrations r
LEFT JOIN public.events e ON e.id = r.event_id
LEFT JOIN public.tickets t ON t.id = r.ticket_id
LEFT JOIN public.athletes a ON a.registration_id = r.id
ORDER BY r.created_at DESC
LIMIT 5;
SELECT 
  r.id as registration_id,
  r.registration_number,
  r.status,
  r.created_at,
  e.name as event_name,
  t.category as ticket_category,
  a.full_name as athlete_name,
  a.email as athlete_email,
  a.phone as athlete_phone,
  a.cpf as athlete_cpf,
  a.gender as athlete_gender,
  a.age as athlete_age,
  a.country as athlete_country,
  a.city as athlete_city,
  a.state as athlete_state
FROM public.registrations r
LEFT JOIN public.events e ON e.id = r.event_id
LEFT JOIN public.tickets t ON t.id = r.ticket_id
LEFT JOIN public.athletes a ON a.registration_id = r.id
ORDER BY r.created_at DESC
LIMIT 5;
SELECT 
  r.id as registration_id,
  r.registration_number,
  r.status,
  r.created_at,
  e.name as event_name,
  t.category as ticket_category,
  a.full_name as athlete_name,
  a.email as athlete_email,
  a.phone as athlete_phone,
  a.cpf as athlete_cpf,
  a.gender as athlete_gender,
  a.age as athlete_age,
  a.country as athlete_country,
  a.city as athlete_city,
  a.state as athlete_state
FROM public.registrations r
LEFT JOIN public.events e ON e.id = r.event_id
LEFT JOIN public.tickets t ON t.id = r.ticket_id
LEFT JOIN public.athletes a ON a.registration_id = r.id
ORDER BY r.created_at DESC
LIMIT 5;
SELECT 
  r.id as registration_id,
  r.registration_number,
  r.status,
  r.created_at,
  e.name as event_name,
  t.category as ticket_category,
  a.full_name as athlete_name,
  a.email as athlete_email,
  a.phone as athlete_phone,
  a.cpf as athlete_cpf,
  a.gender as athlete_gender,
  a.age as athlete_age,
  a.country as athlete_country,
  a.city as athlete_city,
  a.state as athlete_state
FROM public.registrations r
LEFT JOIN public.events e ON e.id = r.event_id
LEFT JOIN public.tickets t ON t.id = r.ticket_id
LEFT JOIN public.athletes a ON a.registration_id = r.id
ORDER BY r.created_at DESC
LIMIT 5;
SELECT 
  r.id as registration_id,
  r.registration_number,
  r.status,
  r.created_at,
  e.name as event_name,
  t.category as ticket_category,
  a.full_name as athlete_name,
  a.email as athlete_email,
  a.phone as athlete_phone,
  a.cpf as athlete_cpf,
  a.gender as athlete_gender,
  a.age as athlete_age,
  a.country as athlete_country,
  a.city as athlete_city,
  a.state as athlete_state
FROM public.registrations r
LEFT JOIN public.events e ON e.id = r.event_id
LEFT JOIN public.tickets t ON t.id = r.ticket_id
LEFT JOIN public.athletes a ON a.registration_id = r.id
ORDER BY r.created_at DESC
LIMIT 5;


