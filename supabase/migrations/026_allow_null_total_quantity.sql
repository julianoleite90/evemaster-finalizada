-- ============================================
-- PERMITIR NULL EM total_quantity PARA INDICAR ILIMITADO
-- ============================================
-- Esta migração permite que total_quantity seja NULL,
-- indicando que o lote tem vagas ilimitadas

-- Alterar a coluna total_quantity para permitir NULL
ALTER TABLE public.ticket_batches
  ALTER COLUMN total_quantity DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.ticket_batches.total_quantity IS 
'Quantidade total de ingressos do lote. NULL indica vagas ilimitadas.';

