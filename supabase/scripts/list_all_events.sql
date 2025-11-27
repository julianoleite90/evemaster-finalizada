-- ============================================
-- SCRIPT: Listar TODOS os eventos cadastrados
-- ============================================
-- Inclui eventos publicados, rascunhos e todos os status

-- Lista completa com todas as informações
SELECT 
  e.id,
  e.name as "Nome do Evento",
  e.slug as "Slug",
  e.description as "Descrição",
  e.event_date as "Data do Evento",
  e.start_time as "Hora de Início",
  e.end_time as "Hora de Término",
  e.location as "Local",
  e.address as "Endereço",
  e.city as "Cidade",
  e.state as "Estado",
  e.zip_code as "CEP",
  e.banner_url as "URL do Banner",
  e.category as "Categoria",
  e.status as "Status",
  CASE 
    WHEN e.status = 'draft' THEN 'Rascunho'
    WHEN e.status = 'active' THEN 'Publicado'
    WHEN e.status = 'finished' THEN 'Finalizado'
    WHEN e.status = 'cancelled' THEN 'Cancelado'
    ELSE e.status::text
  END as "Status Traduzido",
  e.total_capacity as "Capacidade Total",
  e.created_at as "Criado em",
  e.updated_at as "Atualizado em",
  -- Informações do organizador
  o.company_name as "Organizador",
  u.email as "Email do Organizador",
  -- Estatísticas
  (SELECT COUNT(*) FROM public.registrations WHERE event_id = e.id) as "Total de Inscrições",
  (SELECT COUNT(*) FROM public.athletes a 
   INNER JOIN public.registrations r ON a.registration_id = r.id 
   WHERE r.event_id = e.id) as "Total de Participantes",
  (SELECT COUNT(*) FROM public.tickets WHERE event_id = e.id) as "Total de Ingressos"
FROM public.events e
LEFT JOIN public.organizers o ON e.organizer_id = o.id
LEFT JOIN public.users u ON o.user_id = u.id
ORDER BY e.created_at DESC;

-- ============================================
-- VERSÃO SIMPLIFICADA: Apenas informações essenciais
-- ============================================

/*
SELECT 
  e.id,
  e.name as "Nome",
  e.slug as "Slug",
  e.event_date as "Data",
  e.status as "Status",
  CASE 
    WHEN e.status = 'draft' THEN 'Rascunho'
    WHEN e.status = 'active' THEN 'Publicado'
    WHEN e.status = 'finished' THEN 'Finalizado'
    WHEN e.status = 'cancelled' THEN 'Cancelado'
    ELSE e.status::text
  END as "Status Traduzido",
  (SELECT COUNT(*) FROM public.registrations WHERE event_id = e.id) as "Inscrições",
  e.created_at as "Criado em"
FROM public.events e
ORDER BY e.created_at DESC;
*/

-- ============================================
-- FILTROS ÚTEIS
-- ============================================

-- Apenas eventos publicados (status = 'active')
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.event_date,
  e.status
FROM public.events e
WHERE e.status = 'active'
ORDER BY e.event_date DESC;
*/

-- Apenas rascunhos (status = 'draft')
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.event_date,
  e.status
FROM public.events e
WHERE e.status = 'draft'
ORDER BY e.created_at DESC;
*/

-- Eventos por status
/*
SELECT 
  e.status,
  COUNT(*) as "Quantidade"
FROM public.events e
GROUP BY e.status
ORDER BY "Quantidade" DESC;
*/

-- Eventos por organizador
/*
SELECT 
  o.company_name as "Organizador",
  COUNT(e.id) as "Total de Eventos",
  COUNT(CASE WHEN e.status = 'active' THEN 1 END) as "Publicados",
  COUNT(CASE WHEN e.status = 'draft' THEN 1 END) as "Rascunhos"
FROM public.events e
LEFT JOIN public.organizers o ON e.organizer_id = o.id
GROUP BY o.company_name
ORDER BY "Total de Eventos" DESC;
*/

-- Eventos com mais inscrições
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.event_date,
  COUNT(r.id) as "Total de Inscrições"
FROM public.events e
LEFT JOIN public.registrations r ON e.id = r.event_id
GROUP BY e.id, e.name, e.slug, e.event_date
ORDER BY "Total de Inscrições" DESC;
*/

-- Eventos futuros
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.event_date,
  e.start_time,
  e.location
FROM public.events e
WHERE e.event_date >= CURRENT_DATE
ORDER BY e.event_date ASC;
*/

-- Eventos passados
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.event_date,
  e.start_time,
  e.location
FROM public.events e
WHERE e.event_date < CURRENT_DATE
ORDER BY e.event_date DESC;
*/

-- Eventos sem slug
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.created_at
FROM public.events e
WHERE e.slug IS NULL OR e.slug = ''
ORDER BY e.created_at DESC;
*/

-- Eventos sem organizador vinculado
/*
SELECT 
  e.id,
  e.name,
  e.slug,
  e.organizer_id,
  e.created_at
FROM public.events e
WHERE e.organizer_id IS NULL
ORDER BY e.created_at DESC;
*/

