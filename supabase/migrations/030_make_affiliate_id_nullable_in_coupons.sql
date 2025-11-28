-- ============================================
-- MIGRATION: Tornar affiliate_id nullable em affiliate_coupons
-- ============================================
-- Permite criar cupons sem vincular a um afiliado específico

ALTER TABLE public.affiliate_coupons
  ALTER COLUMN affiliate_id DROP NOT NULL;

