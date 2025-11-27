-- ============================================
-- Adicionar campos de endereço na tabela users
-- ============================================
-- Esta migration adiciona os campos de endereço completo na tabela users
-- para permitir que os compradores/atletas tenham seus dados de endereço salvos

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Comentários
COMMENT ON COLUMN public.users.address IS 'Endereço completo (rua, avenida, etc.)';
COMMENT ON COLUMN public.users.address_number IS 'Número do endereço';
COMMENT ON COLUMN public.users.address_complement IS 'Complemento do endereço (apto, bloco, etc.)';
COMMENT ON COLUMN public.users.neighborhood IS 'Bairro';
COMMENT ON COLUMN public.users.city IS 'Cidade';
COMMENT ON COLUMN public.users.state IS 'Estado (UF)';
COMMENT ON COLUMN public.users.zip_code IS 'CEP';

