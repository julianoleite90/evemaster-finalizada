-- ============================================
-- MIGRATION: Integração com Barte
-- ============================================
-- Adiciona campos para armazenar dados da integração com Barte

-- Adicionar campos na tabela payments para armazenar dados da Barte
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS barte_order_uuid TEXT,
  ADD COLUMN IF NOT EXISTS barte_charge_uuid TEXT,
  ADD COLUMN IF NOT EXISTS barte_split_uuid TEXT,
  ADD COLUMN IF NOT EXISTS barte_seller_id INTEGER,
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_fee DECIMAL(10,2), -- Taxa de parcelamento
  ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10,2), -- Comissão do afiliado
  ADD COLUMN IF NOT EXISTS organizer_amount DECIMAL(10,2), -- Valor que o organizador recebe
  ADD COLUMN IF NOT EXISTS platform_amount DECIMAL(10,2), -- Valor que a plataforma recebe (taxa + parcelamento)
  ADD COLUMN IF NOT EXISTS split_created BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS split_created_at TIMESTAMPTZ;

-- Criar índice para busca por charge UUID
CREATE INDEX IF NOT EXISTS idx_payments_barte_charge_uuid ON public.payments(barte_charge_uuid);

-- Criar índice para busca por order UUID
CREATE INDEX IF NOT EXISTS idx_payments_barte_order_uuid ON public.payments(barte_order_uuid);

-- Adicionar campos na tabela organizers para armazenar seller ID da Barte
ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS barte_seller_id INTEGER;

-- Adicionar campos na tabela affiliates para armazenar seller ID da Barte
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS barte_seller_id INTEGER;

-- Comentários
COMMENT ON COLUMN public.payments.barte_order_uuid IS 'UUID do pedido criado na Barte';
COMMENT ON COLUMN public.payments.barte_charge_uuid IS 'UUID da charge criada na Barte';
COMMENT ON COLUMN public.payments.barte_split_uuid IS 'UUID do split criado na Barte';
COMMENT ON COLUMN public.payments.barte_seller_id IS 'ID do seller principal (plataforma) na Barte';
COMMENT ON COLUMN public.payments.affiliate_id IS 'ID do afiliado que gerou a venda (se houver)';
COMMENT ON COLUMN public.payments.installment_fee IS 'Taxa de parcelamento (se aplicável)';
COMMENT ON COLUMN public.payments.affiliate_commission IS 'Comissão do afiliado (se houver)';
COMMENT ON COLUMN public.payments.organizer_amount IS 'Valor que o organizador receberá após split';
COMMENT ON COLUMN public.payments.platform_amount IS 'Valor que a plataforma receberá (taxa + parcelamento)';
COMMENT ON COLUMN public.payments.split_created IS 'Indica se o split foi criado com sucesso';
COMMENT ON COLUMN public.organizers.barte_seller_id IS 'ID do seller do organizador na Barte';
COMMENT ON COLUMN public.affiliates.barte_seller_id IS 'ID do seller do afiliado na Barte';

