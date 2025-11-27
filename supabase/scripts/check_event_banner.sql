-- Verificar se o evento tem banner salvo
SELECT 
  id,
  name,
  banner_url,
  CASE 
    WHEN banner_url IS NULL THEN '❌ Sem banner'
    ELSE '✅ Banner salvo: ' || LEFT(banner_url, 50) || '...'
  END as status
FROM public.events
ORDER BY created_at DESC
LIMIT 5;



