-- ============================================
-- ATUALIZAR TIPOS MIME DO BUCKET event-gpx
-- ============================================
-- Este script atualiza os tipos MIME permitidos no bucket event-gpx
-- para incluir application/octet-stream (tipo padrão quando o navegador
-- não consegue identificar o tipo do arquivo)

-- NOTA: Este script deve ser executado manualmente no Supabase Dashboard
-- Vá em Storage > event-gpx > Settings > Allowed MIME types
-- e adicione: application/octet-stream

-- Ou execute via SQL (se tiver acesso):
-- UPDATE storage.buckets
-- SET allowed_mime_types = array_append(
--   COALESCE(allowed_mime_types, ARRAY[]::text[]),
--   'application/octet-stream'
-- )
-- WHERE id = 'event-gpx';

-- Tipos MIME recomendados para o bucket event-gpx:
-- - application/gpx+xml
-- - application/xml
-- - text/xml
-- - application/octet-stream (para arquivos sem tipo definido)

