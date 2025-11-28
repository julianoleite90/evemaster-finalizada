-- ============================================
-- MIGRATION: Sistema de Aprovação Admin
-- ============================================
-- Adiciona campos para aprovação de cadastros e configurações admin

-- Adicionar campos de aprovação na tabela organizers
ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS payment_term_days INTEGER DEFAULT 7, -- Prazo de recebimento em dias
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS barte_seller_id INTEGER; -- Será preenchido pelo admin na aprovação

-- Adicionar campos de aprovação na tabela affiliates
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Adicionar campos de status na tabela users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_organizers_status ON public.organizers(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Comentários
COMMENT ON COLUMN public.organizers.status IS 'Status de aprovação: pending, approved, rejected';
COMMENT ON COLUMN public.organizers.platform_fee_percentage IS 'Taxa da plataforma para este organizador (padrão 10%)';
COMMENT ON COLUMN public.organizers.payment_term_days IS 'Prazo de recebimento em dias (padrão 7 dias)';
COMMENT ON COLUMN public.organizers.is_active IS 'Indica se o organizador está ativo';
COMMENT ON COLUMN public.affiliates.status IS 'Status de aprovação: pending, approved, rejected';
COMMENT ON COLUMN public.affiliates.is_active IS 'Indica se o afiliado está ativo';
COMMENT ON COLUMN public.users.is_active IS 'Indica se o usuário está ativo';

