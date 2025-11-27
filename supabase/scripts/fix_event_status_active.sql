-- Primeiro, verificar se RLS está ativo na tabela events
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'events';

-- Desabilitar RLS se estiver ativo
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Atualizar o primeiro evento para "active" 
UPDATE public.events 
SET status = 'active', updated_at = NOW()
WHERE id = '9f4c8ca2-4683-487d-ae6a-d45398f6310b';

-- Verificar se funcionou
SELECT id, name, status, updated_at 
FROM public.events 
WHERE id = '9f4c8ca2-4683-487d-ae6a-d45398f6310b';

-- Se quiser ativar todos os eventos de uma vez:
-- UPDATE public.events SET status = 'active', updated_at = NOW();



