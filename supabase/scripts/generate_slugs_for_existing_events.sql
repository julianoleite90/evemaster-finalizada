-- Gerar slugs para eventos existentes que não têm slug
UPDATE public.events 
SET slug = generate_slug(name) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Verificar os slugs gerados
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug IS NOT NULL AND slug != '' THEN '✅ Slug gerado'
    ELSE '❌ Sem slug'
  END as status
FROM public.events
ORDER BY created_at DESC;


