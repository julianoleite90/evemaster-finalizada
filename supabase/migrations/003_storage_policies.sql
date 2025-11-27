-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================
-- Execute este arquivo após criar os buckets no Supabase Dashboard

-- ============================================
-- BUCKET: event-banners
-- ============================================

-- Política de Upload: Organizadores podem fazer upload
CREATE POLICY "Organizers can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.organizers o ON o.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.role = 'ORGANIZADOR'
  )
);

-- Política de Leitura: Público pode ver banners
CREATE POLICY "Public can view banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');

-- Política de Atualização: Organizadores podem atualizar seus próprios banners
CREATE POLICY "Organizers can update own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE o.user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);

-- Política de Deletar: Organizadores podem deletar seus próprios banners
CREATE POLICY "Organizers can delete own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE o.user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);

-- ============================================
-- BUCKET: event-gpx
-- ============================================

-- Política de Upload: Organizadores podem fazer upload
CREATE POLICY "Organizers can upload gpx"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-gpx' AND
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.organizers o ON o.user_id = u.id
    WHERE u.id = auth.uid()
    AND u.role = 'ORGANIZADOR'
  )
);

-- Política de Leitura: Público pode ver arquivos GPX
CREATE POLICY "Public can view gpx"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-gpx');

-- Política de Atualização: Organizadores podem atualizar seus próprios arquivos GPX
CREATE POLICY "Organizers can update own gpx"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-gpx' AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE o.user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);

-- Política de Deletar: Organizadores podem deletar seus próprios arquivos GPX
CREATE POLICY "Organizers can delete own gpx"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-gpx' AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE o.user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);



