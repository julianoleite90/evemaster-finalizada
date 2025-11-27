-- ============================================
-- MIGRATION: Adicionar coluna user_id à tabela registrations
-- ============================================
-- Esta migration adiciona a coluna user_id para vincular inscrições
-- diretamente ao usuário que fez a inscrição (além de athlete_id e buyer_id)

-- Adicionar coluna user_id (nullable, pois inscrições antigas podem não ter)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);

-- Comentário na coluna
COMMENT ON COLUMN public.registrations.user_id IS 'ID do usuário que fez a inscrição (pode ser diferente de athlete_id/buyer_id em casos de inscrições feitas por terceiros)';

