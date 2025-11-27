-- ============================================
-- CORREÇÃO URGENTE - DESABILITAR RLS
-- Execute AGORA no Supabase SQL Editor
-- ============================================

-- OPÇÃO 1: Desabilitar RLS na tabela organizers (mais rápido)
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT 
  'RLS DESABILITADA' as status,
  relname as tabela,
  relrowsecurity as rls_ativo
FROM pg_class
WHERE relname = 'organizers';

-- OPÇÃO 2: Se preferir manter RLS, criar política permissiva
-- DROP POLICY IF EXISTS "Authenticated users can read organizers" ON public.organizers;
-- CREATE POLICY "Authenticated users can read organizers" 
--   ON public.organizers FOR SELECT 
--   TO authenticated 
--   USING (true);

-- DROP POLICY IF EXISTS "Authenticated users can insert organizers" ON public.organizers;
-- CREATE POLICY "Authenticated users can insert organizers" 
--   ON public.organizers FOR INSERT 
--   TO authenticated 
--   WITH CHECK (true);

-- DROP POLICY IF EXISTS "Authenticated users can update own organizers" ON public.organizers;
-- CREATE POLICY "Authenticated users can update own organizers" 
--   ON public.organizers FOR UPDATE 
--   TO authenticated 
--   USING (true);



