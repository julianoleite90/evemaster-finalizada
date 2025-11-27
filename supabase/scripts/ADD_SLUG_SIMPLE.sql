-- Script simples para adicionar campo slug apenas para eventos novos

-- 1. Adicionar coluna slug
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 3. Verificar se foi adicionado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'slug';


