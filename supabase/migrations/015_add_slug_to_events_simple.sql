-- Adicionar campo slug para URLs amigáveis (versão simples)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Função simples para gerar slug
CREATE OR REPLACE FUNCTION generate_simple_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Converter para minúsculas e substituir espaços por hífens
  result := LOWER(TRIM(input_text));
  result := REPLACE(result, ' ', '-');
  result := REPLACE(result, '_', '-');
  
  -- Remover caracteres especiais básicos
  result := REPLACE(result, '(', '');
  result := REPLACE(result, ')', '');
  result := REPLACE(result, '.', '');
  result := REPLACE(result, ',', '');
  result := REPLACE(result, '!', '');
  result := REPLACE(result, '?', '');
  result := REPLACE(result, ':', '');
  result := REPLACE(result, ';', '');
  result := REPLACE(result, '"', '');
  result := REPLACE(result, '''', '');
  
  -- Substituir acentos básicos
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'ã', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'õ', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ç', 'c');
  result := REPLACE(result, 'ñ', 'n');
  
  -- Limitar tamanho e garantir que não seja vazio
  result := SUBSTRING(result, 1, 200);
  
  IF result = '' OR result IS NULL THEN
    result := 'evento';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = generate_simple_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base
  base_slug := generate_simple_slug(NEW.name);
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_event_slug ON public.events;
CREATE TRIGGER trigger_auto_generate_event_slug
  BEFORE INSERT OR UPDATE OF name ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_event_slug();
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Função simples para gerar slug
CREATE OR REPLACE FUNCTION generate_simple_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Converter para minúsculas e substituir espaços por hífens
  result := LOWER(TRIM(input_text));
  result := REPLACE(result, ' ', '-');
  result := REPLACE(result, '_', '-');
  
  -- Remover caracteres especiais básicos
  result := REPLACE(result, '(', '');
  result := REPLACE(result, ')', '');
  result := REPLACE(result, '.', '');
  result := REPLACE(result, ',', '');
  result := REPLACE(result, '!', '');
  result := REPLACE(result, '?', '');
  result := REPLACE(result, ':', '');
  result := REPLACE(result, ';', '');
  result := REPLACE(result, '"', '');
  result := REPLACE(result, '''', '');
  
  -- Substituir acentos básicos
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'ã', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'õ', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ç', 'c');
  result := REPLACE(result, 'ñ', 'n');
  
  -- Limitar tamanho e garantir que não seja vazio
  result := SUBSTRING(result, 1, 200);
  
  IF result = '' OR result IS NULL THEN
    result := 'evento';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = generate_simple_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base
  base_slug := generate_simple_slug(NEW.name);
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_event_slug ON public.events;
CREATE TRIGGER trigger_auto_generate_event_slug
  BEFORE INSERT OR UPDATE OF name ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_event_slug();
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Função simples para gerar slug
CREATE OR REPLACE FUNCTION generate_simple_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Converter para minúsculas e substituir espaços por hífens
  result := LOWER(TRIM(input_text));
  result := REPLACE(result, ' ', '-');
  result := REPLACE(result, '_', '-');
  
  -- Remover caracteres especiais básicos
  result := REPLACE(result, '(', '');
  result := REPLACE(result, ')', '');
  result := REPLACE(result, '.', '');
  result := REPLACE(result, ',', '');
  result := REPLACE(result, '!', '');
  result := REPLACE(result, '?', '');
  result := REPLACE(result, ':', '');
  result := REPLACE(result, ';', '');
  result := REPLACE(result, '"', '');
  result := REPLACE(result, '''', '');
  
  -- Substituir acentos básicos
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'ã', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'õ', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ç', 'c');
  result := REPLACE(result, 'ñ', 'n');
  
  -- Limitar tamanho e garantir que não seja vazio
  result := SUBSTRING(result, 1, 200);
  
  IF result = '' OR result IS NULL THEN
    result := 'evento';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = generate_simple_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base
  base_slug := generate_simple_slug(NEW.name);
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_event_slug ON public.events;
CREATE TRIGGER trigger_auto_generate_event_slug
  BEFORE INSERT OR UPDATE OF name ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_event_slug();
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Função simples para gerar slug
CREATE OR REPLACE FUNCTION generate_simple_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Converter para minúsculas e substituir espaços por hífens
  result := LOWER(TRIM(input_text));
  result := REPLACE(result, ' ', '-');
  result := REPLACE(result, '_', '-');
  
  -- Remover caracteres especiais básicos
  result := REPLACE(result, '(', '');
  result := REPLACE(result, ')', '');
  result := REPLACE(result, '.', '');
  result := REPLACE(result, ',', '');
  result := REPLACE(result, '!', '');
  result := REPLACE(result, '?', '');
  result := REPLACE(result, ':', '');
  result := REPLACE(result, ';', '');
  result := REPLACE(result, '"', '');
  result := REPLACE(result, '''', '');
  
  -- Substituir acentos básicos
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'ã', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'õ', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ç', 'c');
  result := REPLACE(result, 'ñ', 'n');
  
  -- Limitar tamanho e garantir que não seja vazio
  result := SUBSTRING(result, 1, 200);
  
  IF result = '' OR result IS NULL THEN
    result := 'evento';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = generate_simple_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base
  base_slug := generate_simple_slug(NEW.name);
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_event_slug ON public.events;
CREATE TRIGGER trigger_auto_generate_event_slug
  BEFORE INSERT OR UPDATE OF name ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_event_slug();
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Função simples para gerar slug
CREATE OR REPLACE FUNCTION generate_simple_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Converter para minúsculas e substituir espaços por hífens
  result := LOWER(TRIM(input_text));
  result := REPLACE(result, ' ', '-');
  result := REPLACE(result, '_', '-');
  
  -- Remover caracteres especiais básicos
  result := REPLACE(result, '(', '');
  result := REPLACE(result, ')', '');
  result := REPLACE(result, '.', '');
  result := REPLACE(result, ',', '');
  result := REPLACE(result, '!', '');
  result := REPLACE(result, '?', '');
  result := REPLACE(result, ':', '');
  result := REPLACE(result, ';', '');
  result := REPLACE(result, '"', '');
  result := REPLACE(result, '''', '');
  
  -- Substituir acentos básicos
  result := REPLACE(result, 'á', 'a');
  result := REPLACE(result, 'à', 'a');
  result := REPLACE(result, 'â', 'a');
  result := REPLACE(result, 'ã', 'a');
  result := REPLACE(result, 'é', 'e');
  result := REPLACE(result, 'ê', 'e');
  result := REPLACE(result, 'í', 'i');
  result := REPLACE(result, 'ó', 'o');
  result := REPLACE(result, 'ô', 'o');
  result := REPLACE(result, 'õ', 'o');
  result := REPLACE(result, 'ú', 'u');
  result := REPLACE(result, 'ç', 'c');
  result := REPLACE(result, 'ñ', 'n');
  
  -- Limitar tamanho e garantir que não seja vazio
  result := SUBSTRING(result, 1, 200);
  
  IF result = '' OR result IS NULL THEN
    result := 'evento';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para eventos existentes
UPDATE public.events 
SET slug = generate_simple_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gerar slug base
  base_slug := generate_simple_slug(NEW.name);
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

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_event_slug ON public.events;
CREATE TRIGGER trigger_auto_generate_event_slug
  BEFORE INSERT OR UPDATE OF name ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_event_slug();



