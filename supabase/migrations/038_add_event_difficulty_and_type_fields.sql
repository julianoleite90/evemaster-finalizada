-- ============================================
-- ADICIONAR CAMPOS DE DIFICULDADE, TIPO DE PROVA E IDIOMA
-- ============================================
-- Adiciona campos para dificuldade, acesso major, tipo de prova e idioma do evento

-- Criar ENUMs (apenas se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM ('Fácil', 'Moderado', 'Difícil', 'Muito Difícil');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race_type') THEN
    CREATE TYPE race_type AS ENUM ('asfalto', 'trail', 'misto');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_language') THEN
    CREATE TYPE event_language AS ENUM ('pt', 'es', 'en');
  END IF;
END $$;

-- Remover colunas antigas se existirem com tipo errado (caso de migration anterior falha)
DO $$ 
BEGIN
  -- Se a coluna existe mas é do tipo errado, removê-la
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'difficulty_level'
    AND udt_name != 'difficulty_level'
  ) THEN
    ALTER TABLE public.events DROP COLUMN IF EXISTS difficulty_level;
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'race_type'
    AND udt_name != 'race_type'
  ) THEN
    ALTER TABLE public.events DROP COLUMN IF EXISTS race_type;
  END IF;
END $$;

-- Adicionar colunas na tabela events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS difficulty_level difficulty_level,
  ADD COLUMN IF NOT EXISTS major_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS major_access_type TEXT,
  ADD COLUMN IF NOT EXISTS race_type race_type,
  ADD COLUMN IF NOT EXISTS language event_language DEFAULT 'pt';

-- Comentários para documentação
COMMENT ON COLUMN public.events.difficulty_level IS 'Nível de dificuldade da prova: Fácil, Moderado, Difícil ou Muito Difícil';
COMMENT ON COLUMN public.events.major_access IS 'Indica se a prova tem acesso a prova major';
COMMENT ON COLUMN public.events.major_access_type IS 'Tipo de prova major quando major_access é true';
COMMENT ON COLUMN public.events.race_type IS 'Tipo de pista: asfalto, trail ou misto';
COMMENT ON COLUMN public.events.language IS 'Idioma padrão do evento: pt (português), es (espanhol), en (inglês)';

