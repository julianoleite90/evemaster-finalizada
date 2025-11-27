-- ============================================
-- CORRIGIR RLS DO STORAGE
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar políticas para o bucket event-banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir upload para usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-banners');

-- 3. Permitir leitura pública
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'event-banners');

-- 4. Permitir atualização para usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'event-banners');

-- 5. Permitir delete para usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-banners');

-- Fazer o mesmo para event-gpx
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gpx', 'event-gpx', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Verificar resultado
SELECT 
  id,
  name,
  public
FROM storage.buckets
WHERE id IN ('event-banners', 'event-gpx');



