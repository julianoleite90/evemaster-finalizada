-- ============================================
-- DESABILITAR RLS NAS TABELAS PRINCIPAIS
-- Mantém apenas segurança essencial (auth.users é protegido automaticamente)
-- ============================================

-- Desabilitar RLS nas tabelas do sistema
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
  relname as tabela,
  CASE WHEN relrowsecurity THEN '❌ RLS ATIVA' ELSE '✅ RLS DESABILITADA' END as status
FROM pg_class
WHERE relname IN (
  'users', 'organizers', 'affiliates', 'events', 
  'ticket_batches', 'tickets', 'registrations', 
  'athletes', 'payments', 'event_settings'
)
ORDER BY relname;



