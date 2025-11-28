-- ============================================
-- MIGRATION: Função para buscar dados completos do organizador
-- ============================================
-- Cria uma função que retorna todos os dados do organizador de forma padronizada

-- Função para buscar dados completos do organizador
CREATE OR REPLACE FUNCTION public.get_organizer_complete_data(p_organizer_id UUID)
RETURNS TABLE (
  -- Dados da tabela organizers
  organizer_id UUID,
  company_name TEXT,
  company_cnpj TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip_code TEXT,
  legal_responsible TEXT,
  state_registration TEXT,
  user_id UUID,
  -- Dados do usuário relacionado
  user_email TEXT,
  user_full_name TEXT,
  user_phone TEXT,
  -- Estatísticas
  events_last_year INTEGER,
  -- Status
  status TEXT,
  is_active BOOLEAN,
  platform_fee_percentage DECIMAL(5,2),
  payment_term_days INTEGER,
  barte_seller_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_events_count INTEGER;
BEGIN
  -- Buscar dados do organizador e usuário relacionado
  SELECT 
    o.id,
    o.company_name,
    o.company_cnpj,
    o.company_phone,
    o.company_address,
    o.company_city,
    o.company_state,
    o.company_zip_code,
    o.legal_responsible,
    o.state_registration,
    o.user_id,
    u.email,
    u.full_name,
    u.phone,
    o.status,
    o.is_active,
    o.platform_fee_percentage,
    o.payment_term_days,
    o.barte_seller_id
  INTO 
    organizer_id,
    company_name,
    company_cnpj,
    company_phone,
    company_address,
    company_city,
    company_state,
    company_zip_code,
    legal_responsible,
    state_registration,
    user_id,
    user_email,
    user_full_name,
    user_phone,
    status,
    is_active,
    platform_fee_percentage,
    payment_term_days,
    barte_seller_id
  FROM public.organizers o
  LEFT JOIN public.users u ON u.id = o.user_id
  WHERE o.id = p_organizer_id;
  
  -- Se não encontrou, retornar NULL
  IF organizer_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calcular eventos do último ano
  SELECT COUNT(*) INTO v_events_count
  FROM public.events
  WHERE organizer_id = p_organizer_id
    AND event_date >= (CURRENT_DATE - INTERVAL '1 year')
    AND event_date < CURRENT_DATE
    AND status IN ('active', 'finished');
  
  events_last_year := COALESCE(v_events_count, 0);
  
  RETURN NEXT;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.get_organizer_complete_data IS 
'Retorna todos os dados do organizador de forma padronizada, incluindo dados do usuário relacionado e estatísticas';

-- Permitir que usuários autenticados e anônimos executem esta função
GRANT EXECUTE ON FUNCTION public.get_organizer_complete_data TO authenticated, anon;

-- Criar uma view para facilitar consultas
CREATE OR REPLACE VIEW public.organizer_complete_view AS
SELECT 
  o.id as organizer_id,
  o.company_name,
  o.company_cnpj,
  o.company_phone,
  o.company_address,
  o.company_city,
  o.company_state,
  o.company_zip_code,
  o.legal_responsible,
  o.state_registration,
  o.user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  u.phone as user_phone,
  o.status,
  o.is_active,
  o.platform_fee_percentage,
  o.payment_term_days,
  o.barte_seller_id,
  -- Calcular eventos do último ano
  (
    SELECT COUNT(*)
    FROM public.events e
    WHERE e.organizer_id = o.id
      AND e.event_date >= (CURRENT_DATE - INTERVAL '1 year')
      AND e.event_date < CURRENT_DATE
      AND e.status IN ('active', 'finished')
  ) as events_last_year
FROM public.organizers o
LEFT JOIN public.users u ON u.id = o.user_id;

-- Comentário da view
COMMENT ON VIEW public.organizer_complete_view IS 
'View que retorna todos os dados do organizador de forma padronizada';

-- Permitir leitura pública da view (ou ajustar conforme políticas RLS)
GRANT SELECT ON public.organizer_complete_view TO authenticated, anon;

