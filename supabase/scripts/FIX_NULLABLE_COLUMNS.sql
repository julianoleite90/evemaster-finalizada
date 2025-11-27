-- Tornar colunas opcionais na tabela registrations
-- (porque criamos a inscrição primeiro e depois vinculamos)

ALTER TABLE public.registrations 
ALTER COLUMN athlete_id DROP NOT NULL;

ALTER TABLE public.registrations 
ALTER COLUMN buyer_id DROP NOT NULL;

-- Verificar a mudança
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' 
  AND table_schema = 'public'
  AND column_name IN ('athlete_id', 'buyer_id');

