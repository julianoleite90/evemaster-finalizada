-- Adicionar campos faltantes na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'brasil',
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Tornar birth_date opcional (muitos formulários usam idade ao invés de data de nascimento)
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar campo de aceite do termo na tabela registrations
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

-- Comentários
COMMENT ON COLUMN public.athletes.age IS 'Idade do atleta (alternativa a birth_date)';
COMMENT ON COLUMN public.athletes.country IS 'País de residência do atleta';
COMMENT ON COLUMN public.athletes.address_number IS 'Número do endereço';
COMMENT ON COLUMN public.athletes.address_complement IS 'Complemento do endereço';
COMMENT ON COLUMN public.athletes.neighborhood IS 'Bairro';
COMMENT ON COLUMN public.registrations.accepted_terms IS 'Se aceitou o termo de responsabilidade';
COMMENT ON COLUMN public.registrations.accepted_terms_at IS 'Data/hora do aceite do termo';




