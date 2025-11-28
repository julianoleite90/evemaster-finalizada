-- ============================================
-- TABELAS FINANCEIRAS E SISTEMA DE SAQUES
-- ============================================
-- Cria tabelas para gerenciar saldos, saques e transações financeiras

-- Tabela de saldos dos organizadores
CREATE TABLE IF NOT EXISTS public.organizer_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  total_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  available_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizer_id)
);

-- Tabela de saques solicitados
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  bank_account_id UUID REFERENCES public.organizers(id), -- Referência aos dados bancários do organizador
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações financeiras (histórico)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  withdrawal_id UUID REFERENCES public.withdrawals(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'credit' (recebimento), 'debit' (saque), 'fee' (taxa)
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_organizer_balances_organizer_id ON public.organizer_balances(organizer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_organizer_id ON public.withdrawals(organizer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_organizer_id ON public.financial_transactions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_event_id ON public.financial_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON public.financial_transactions(created_at DESC);

-- Função para atualizar saldo ao criar transação
CREATE OR REPLACE FUNCTION update_organizer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'credit' THEN
    UPDATE public.organizer_balances
    SET 
      total_balance = total_balance + NEW.amount,
      available_balance = available_balance + NEW.amount,
      updated_at = NOW()
    WHERE organizer_id = NEW.organizer_id;
  ELSIF NEW.transaction_type = 'debit' THEN
    UPDATE public.organizer_balances
    SET 
      total_balance = total_balance - NEW.amount,
      available_balance = available_balance - NEW.amount,
      updated_at = NOW()
    WHERE organizer_id = NEW.organizer_id;
  ELSIF NEW.transaction_type = 'fee' THEN
    UPDATE public.organizer_balances
    SET 
      total_balance = total_balance - NEW.amount,
      updated_at = NOW()
    WHERE organizer_id = NEW.organizer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar saldo automaticamente
DROP TRIGGER IF EXISTS trigger_update_balance ON public.financial_transactions;
CREATE TRIGGER trigger_update_balance
  AFTER INSERT ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_organizer_balance();

-- Função para criar saldo inicial se não existir
CREATE OR REPLACE FUNCTION ensure_organizer_balance(p_organizer_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.organizer_balances (organizer_id, total_balance, available_balance, pending_balance)
  VALUES (p_organizer_id, 0.00, 0.00, 0.00)
  ON CONFLICT (organizer_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE public.organizer_balances IS 'Saldos dos organizadores (total, disponível, pendente)';
COMMENT ON TABLE public.withdrawals IS 'Solicitações de saque dos organizadores';
COMMENT ON TABLE public.financial_transactions IS 'Histórico de transações financeiras';
COMMENT ON COLUMN public.withdrawals.status IS 'Status do saque: pending, approved, rejected, completed';

-- RLS Policies
ALTER TABLE public.organizer_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Política para organizadores verem apenas seus próprios dados
CREATE POLICY "Organizers can view their own balances"
  ON public.organizer_balances FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view their own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create their own withdrawals"
  ON public.withdrawals FOR INSERT
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view their own transactions"
  ON public.financial_transactions FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

-- Admin pode ver tudo
CREATE POLICY "Admins can view all balances"
  ON public.organizer_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON public.financial_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

