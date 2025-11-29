-- Script para adicionar a coluna show_in_showcase na tabela events
-- Execute este script no SQL Editor do Supabase

-- Adicionar campo show_in_showcase na tabela events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS show_in_showcase BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN events.show_in_showcase IS 'Indica se o evento deve ser exibido na vitrine pública';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'show_in_showcase';

