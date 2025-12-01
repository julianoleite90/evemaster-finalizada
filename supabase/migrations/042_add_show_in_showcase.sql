-- Adicionar campo show_in_showcase na tabela events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS show_in_showcase BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN events.show_in_showcase IS 'Indica se o evento deve ser exibido na vitrine pública';


