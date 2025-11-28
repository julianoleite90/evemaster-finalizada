-- Políticas RLS para organization_users
-- Permite que membros de organização vejam seus próprios dados e organizadores vejam seus membros

-- 1. Membros podem ver seus próprios dados
DROP POLICY IF EXISTS "Organization users can view own data" ON public.organization_users;
CREATE POLICY "Organization users can view own data"
ON public.organization_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Organizadores podem ver todos os membros de sua organização
DROP POLICY IF EXISTS "Organizers can view organization users" ON public.organization_users;
CREATE POLICY "Organizers can view organization users"
ON public.organization_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = organization_users.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- 3. Organizadores podem inserir membros em sua organização
DROP POLICY IF EXISTS "Organizers can insert organization users" ON public.organization_users;
CREATE POLICY "Organizers can insert organization users"
ON public.organization_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = organization_users.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- 4. Organizadores podem atualizar membros de sua organização
DROP POLICY IF EXISTS "Organizers can update organization users" ON public.organization_users;
CREATE POLICY "Organizers can update organization users"
ON public.organization_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = organization_users.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- 5. Organizadores podem deletar membros de sua organização
DROP POLICY IF EXISTS "Organizers can delete organization users" ON public.organization_users;
CREATE POLICY "Organizers can delete organization users"
ON public.organization_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizers
    WHERE organizers.id = organization_users.organizer_id
    AND organizers.user_id = auth.uid()
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

