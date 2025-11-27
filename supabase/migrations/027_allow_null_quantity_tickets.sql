-- ============================================
-- PERMITIR NULL EM quantity PARA INDICAR ILIMITADO
-- ============================================
-- Esta migração permite que quantity seja NULL,
-- indicando que o ticket tem vagas ilimitadas

-- Alterar a coluna quantity para permitir NULL
ALTER TABLE public.tickets
  ALTER COLUMN quantity DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.tickets.quantity IS 
'Quantidade de ingressos disponíveis. NULL ou 0 indica vagas ilimitadas.';

