-- ============================================
-- MIGRATION: Adicionar estatísticas do organizador
-- ============================================
-- Adiciona função para calcular eventos realizados no último ano

-- Função para contar eventos realizados no último ano por organizador
CREATE OR REPLACE FUNCTION public.get_organizer_events_last_year(p_organizer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.events
  WHERE organizer_id = p_organizer_id
    AND event_date >= (CURRENT_DATE - INTERVAL '1 year')
    AND event_date < CURRENT_DATE
    AND status IN ('active', 'finished');
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.get_organizer_events_last_year IS 
'Retorna a quantidade de eventos realizados pelo organizador no último ano (últimos 12 meses)';

-- Permitir que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION public.get_organizer_events_last_year TO authenticated, anon;

