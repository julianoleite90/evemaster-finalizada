-- Script manual para adicionar slugs (sem funções complexas)

-- 1. Adicionar coluna slug se não existir
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 3. Gerar slugs manualmente para eventos existentes
UPDATE public.events 
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(name, ' ', '-'),
                    'á', 'a'
                  ),
                  'ã', 'a'
                ),
                'ç', 'c'
              ),
              'é', 'e'
            ),
            'í', 'i'
          ),
          'ó', 'o'
        ),
        'ú', 'u'
      ),
      '(', ''
    ),
    ')', ''
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- 4. Verificar resultado
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ Slug criado'
    ELSE '❌ Sem slug'
  END as status
FROM public.events
ORDER BY created_at DESC;

-- 1. Adicionar coluna slug se não existir
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 3. Gerar slugs manualmente para eventos existentes
UPDATE public.events 
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(name, ' ', '-'),
                    'á', 'a'
                  ),
                  'ã', 'a'
                ),
                'ç', 'c'
              ),
              'é', 'e'
            ),
            'í', 'i'
          ),
          'ó', 'o'
        ),
        'ú', 'u'
      ),
      '(', ''
    ),
    ')', ''
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- 4. Verificar resultado
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ Slug criado'
    ELSE '❌ Sem slug'
  END as status
FROM public.events
ORDER BY created_at DESC;

-- 1. Adicionar coluna slug se não existir
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 3. Gerar slugs manualmente para eventos existentes
UPDATE public.events 
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(name, ' ', '-'),
                    'á', 'a'
                  ),
                  'ã', 'a'
                ),
                'ç', 'c'
              ),
              'é', 'e'
            ),
            'í', 'i'
          ),
          'ó', 'o'
        ),
        'ú', 'u'
      ),
      '(', ''
    ),
    ')', ''
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- 4. Verificar resultado
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ Slug criado'
    ELSE '❌ Sem slug'
  END as status
FROM public.events
ORDER BY created_at DESC;

-- 1. Adicionar coluna slug se não existir
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 3. Gerar slugs manualmente para eventos existentes
UPDATE public.events 
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(name, ' ', '-'),
                    'á', 'a'
                  ),
                  'ã', 'a'
                ),
                'ç', 'c'
              ),
              'é', 'e'
            ),
            'í', 'i'
          ),
          'ó', 'o'
        ),
        'ú', 'u'
      ),
      '(', ''
    ),
    ')', ''
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- 4. Verificar resultado
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ Slug criado'
    ELSE '❌ Sem slug'
  END as status
FROM public.events
ORDER BY created_at DESC;

-- 1. Adicionar coluna slug se não existir
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 3. Gerar slugs manualmente para eventos existentes
UPDATE public.events 
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(name, ' ', '-'),
                    'á', 'a'
                  ),
                  'ã', 'a'
                ),
                'ç', 'c'
              ),
              'é', 'e'
            ),
            'í', 'i'
          ),
          'ó', 'o'
        ),
        'ú', 'u'
      ),
      '(', ''
    ),
    ')', ''
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- 4. Verificar resultado
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ Slug criado'
    ELSE '❌ Sem slug'
  END as status
FROM public.events
ORDER BY created_at DESC;


