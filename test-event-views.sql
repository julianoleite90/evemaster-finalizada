-- Verificar se existem registros na tabela event_views para este evento
-- Event ID: 74c98b92-2847-4aa3-ad8e-a673f9827a9e

-- 1. Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'event_views'
);

-- 2. Contar total de registros na tabela
SELECT COUNT(*) as total_registros FROM event_views;

-- 3. Contar registros para este evento específico
SELECT COUNT(*) as registros_evento 
FROM event_views 
WHERE event_id = '74c98b92-2847-4aa3-ad8e-a673f9827a9e';

-- 4. Ver últimos 5 registros deste evento (se houver)
SELECT * FROM event_views 
WHERE event_id = '74c98b92-2847-4aa3-ad8e-a673f9827a9e'
ORDER BY viewed_at DESC 
LIMIT 5;

-- 5. Ver se há registros de QUALQUER evento (últimos 10)
SELECT event_id, COUNT(*) as total, MAX(viewed_at) as ultima_visualizacao
FROM event_views
GROUP BY event_id
ORDER BY ultima_visualizacao DESC
LIMIT 10;

