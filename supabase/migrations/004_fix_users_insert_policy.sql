-- ============================================
-- CORREÇÃO: Políticas INSERT para tabelas USERS e AFFILIATES
-- ============================================
-- Este arquivo corrige o erro "new row violates row-level security policy"
-- Execute este arquivo no Supabase SQL Editor

-- Primeiro, remova as políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Affiliates can insert own profile" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view own profile" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON public.affiliates;

-- Usuários podem inserir seus próprios dados (durante o registro)
-- IMPORTANTE: Esta política permite que usuários autenticados insiram um registro
-- onde o id da linha corresponde ao auth.uid() do usuário autenticado
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Afiliados podem inserir seu próprio perfil
CREATE POLICY "Affiliates can insert own profile" ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Afiliados podem ver seu próprio perfil
CREATE POLICY "Affiliates can view own profile" ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Afiliados podem atualizar seu próprio perfil
CREATE POLICY "Affiliates can update own profile" ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
