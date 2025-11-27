-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Execute este arquivo após o schema inicial (001_initial_schema.sql)

-- ============================================
-- POLÍTICAS PARA USERS
-- ============================================

-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Usuários podem inserir seus próprios dados (durante o registro)
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================
-- POLÍTICAS PARA ORGANIZERS
-- ============================================

-- Organizadores podem ver seu próprio perfil
CREATE POLICY "Organizers can view own profile" ON public.organizers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Organizadores podem atualizar seu próprio perfil
CREATE POLICY "Organizers can update own profile" ON public.organizers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Organizadores podem inserir seu próprio perfil
CREATE POLICY "Organizers can insert own profile" ON public.organizers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- POLÍTICAS PARA EVENTS
-- ============================================

-- Todos podem ver eventos ativos
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT
  TO public
  USING (status = 'active');

-- Organizadores podem ver seus próprios eventos (qualquer status)
CREATE POLICY "Organizers can view own events" ON public.events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizers
      WHERE organizers.id = events.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Organizadores podem criar eventos
CREATE POLICY "Organizers can create events" ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizers
      WHERE organizers.id = events.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Organizadores podem atualizar seus próprios eventos
CREATE POLICY "Organizers can update own events" ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizers
      WHERE organizers.id = events.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Organizadores podem deletar seus próprios eventos (apenas drafts)
CREATE POLICY "Organizers can delete own draft events" ON public.events
  FOR DELETE
  TO authenticated
  USING (
    status = 'draft' AND
    EXISTS (
      SELECT 1 FROM public.organizers
      WHERE organizers.id = events.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA TICKET_BATCHES
-- ============================================

-- Todos podem ver lotes de eventos ativos
CREATE POLICY "Anyone can view active ticket batches" ON public.ticket_batches
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_batches.event_id
      AND events.status = 'active'
    )
  );

-- Organizadores podem gerenciar lotes de seus eventos
CREATE POLICY "Organizers can manage own ticket batches" ON public.ticket_batches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE e.id = ticket_batches.event_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA TICKETS
-- ============================================

-- Todos podem ver ingressos de eventos ativos
CREATE POLICY "Anyone can view active tickets" ON public.tickets
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.ticket_batches tb
      JOIN public.events e ON e.id = tb.event_id
      WHERE tb.id = tickets.batch_id
      AND e.status = 'active'
    )
  );

-- Organizadores podem gerenciar ingressos de seus eventos
CREATE POLICY "Organizers can manage own tickets" ON public.tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ticket_batches tb
      JOIN public.events e ON e.id = tb.event_id
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE tb.id = tickets.batch_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA REGISTRATIONS
-- ============================================

-- Usuários podem ver suas próprias inscrições
CREATE POLICY "Users can view own registrations" ON public.registrations
  FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid() OR buyer_id = auth.uid());

-- Organizadores podem ver inscrições de seus eventos
CREATE POLICY "Organizers can view event registrations" ON public.registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE e.id = registrations.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Usuários podem criar suas próprias inscrições
CREATE POLICY "Users can create own registrations" ON public.registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Organizadores podem atualizar inscrições de seus eventos
CREATE POLICY "Organizers can update event registrations" ON public.registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE e.id = registrations.event_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA EVENT_SETTINGS
-- ============================================

-- Organizadores podem ver configurações de seus eventos
CREATE POLICY "Organizers can view own event settings" ON public.event_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE e.id = event_settings.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Organizadores podem gerenciar configurações de seus eventos
CREATE POLICY "Organizers can manage own event settings" ON public.event_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE e.id = event_settings.event_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA PAYMENTS
-- ============================================

-- Usuários podem ver pagamentos de suas inscrições
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations
      WHERE registrations.id = payments.registration_id
      AND (registrations.buyer_id = auth.uid() OR registrations.athlete_id = auth.uid())
    )
  );

-- Organizadores podem ver pagamentos de seus eventos
CREATE POLICY "Organizers can view event payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      JOIN public.organizers o ON o.id = e.organizer_id
      WHERE r.id = payments.registration_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS PARA AFFILIATES
-- ============================================

-- Afiliados podem ver seu próprio perfil
CREATE POLICY "Affiliates can view own profile" ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Afiliados podem inserir seu próprio perfil
CREATE POLICY "Affiliates can insert own profile" ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Afiliados podem atualizar seu próprio perfil
CREATE POLICY "Affiliates can update own profile" ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

