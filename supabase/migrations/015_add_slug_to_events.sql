-- Adicionar campo slug para URLs amigáveis
ALTER TABLE public.events 
ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Criar índice para performance
CREATE INDEX idx_events_slug ON public.events(slug);

-- Função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Converter para minúsculas
  result := LOWER(input_text);
  
  -- Substituir caracteres acentuados
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'ã', 'a');
  result := REPLACE(result, 'ä', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'è', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'ë', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ì', 'i');
  result := REPLACE(result, 'î', 'i');
  result := REPLACE(result, 'ï', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ò', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'õ', 'o');
  result := REPLACE(result, 'ö', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ù', 'u');
  result := REPLACE(result, 'û', 'u');
  result := REPLACE(result, 'ü', 'u');
  result := REPLACE(result, 'ç', 'c');
  result := REPLACE(result, 'ñ', 'n');
  
  -- Remover caracteres especiais (manter apenas letras, números, espaços e hífens)
  result := REGEXP_REPLACE(result, '[^a-z0-9\s-]', '', 'g');
  
  -- Substituir espaços múltiplos por hífen único
  result := REGEXP_REPLACE(result, '\s+', '-', 'g');
  
  -- Remover hífens do início e fim
  result := REGEXP_REPLACE(result, '^-+|-+$', '', 'g');
  
  -- Substituir múltiplos hífens por um único
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = generate_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base
  base_slug := generate_slug(NEW.name);
  final_slug := base_slug;
  
  -- Verificar se já existe e adicionar contador se necessário
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_event_slug
  BEFORE INSERT OR UPDATE OF name ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION generate_event_slug();
