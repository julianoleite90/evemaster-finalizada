-- Adicionar colunas faltantes na tabela registrations
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shirt_size TEXT;

-- Adicionar colunas faltantes na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'brasil',
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES public.registrations(id);

-- Tornar birth_date opcional
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar colunas faltantes na tabela payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Verificar estrutura atualizada
SELECT '=== REGISTRATIONS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public';

SELECT '=== ATHLETES ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public';

SELECT '=== PAYMENTS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public';

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shirt_size TEXT;

-- Adicionar colunas faltantes na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'brasil',
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES public.registrations(id);

-- Tornar birth_date opcional
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar colunas faltantes na tabela payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Verificar estrutura atualizada
SELECT '=== REGISTRATIONS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public';

SELECT '=== ATHLETES ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public';

SELECT '=== PAYMENTS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public';

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shirt_size TEXT;

-- Adicionar colunas faltantes na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'brasil',
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES public.registrations(id);

-- Tornar birth_date opcional
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar colunas faltantes na tabela payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Verificar estrutura atualizada
SELECT '=== REGISTRATIONS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public';

SELECT '=== ATHLETES ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public';

SELECT '=== PAYMENTS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public';

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shirt_size TEXT;

-- Adicionar colunas faltantes na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'brasil',
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES public.registrations(id);

-- Tornar birth_date opcional
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar colunas faltantes na tabela payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Verificar estrutura atualizada
SELECT '=== REGISTRATIONS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public';

SELECT '=== ATHLETES ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public';

SELECT '=== PAYMENTS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public';

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shirt_size TEXT;

-- Adicionar colunas faltantes na tabela athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'brasil',
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES public.registrations(id);

-- Tornar birth_date opcional
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar colunas faltantes na tabela payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Verificar estrutura atualizada
SELECT '=== REGISTRATIONS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public';

SELECT '=== ATHLETES ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public';

SELECT '=== PAYMENTS ATUALIZADO ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND table_schema = 'public';



