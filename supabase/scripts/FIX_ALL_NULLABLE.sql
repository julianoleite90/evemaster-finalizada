-- RESOLVER TODAS AS CONSTRAINTS DE UMA VEZ

-- Registrations
ALTER TABLE public.registrations ALTER COLUMN athlete_id DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN buyer_id DROP NOT NULL;

-- Athletes
ALTER TABLE public.athletes ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN gender DROP NOT NULL;

-- Verificar
SELECT 'REGISTRATIONS' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public'
AND is_nullable = 'NO';

SELECT 'ATHLETES' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public'
AND is_nullable = 'NO';


-- Registrations
ALTER TABLE public.registrations ALTER COLUMN athlete_id DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN buyer_id DROP NOT NULL;

-- Athletes
ALTER TABLE public.athletes ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN gender DROP NOT NULL;

-- Verificar
SELECT 'REGISTRATIONS' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public'
AND is_nullable = 'NO';

SELECT 'ATHLETES' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public'
AND is_nullable = 'NO';


-- Registrations
ALTER TABLE public.registrations ALTER COLUMN athlete_id DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN buyer_id DROP NOT NULL;

-- Athletes
ALTER TABLE public.athletes ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN gender DROP NOT NULL;

-- Verificar
SELECT 'REGISTRATIONS' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public'
AND is_nullable = 'NO';

SELECT 'ATHLETES' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public'
AND is_nullable = 'NO';


-- Registrations
ALTER TABLE public.registrations ALTER COLUMN athlete_id DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN buyer_id DROP NOT NULL;

-- Athletes
ALTER TABLE public.athletes ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN gender DROP NOT NULL;

-- Verificar
SELECT 'REGISTRATIONS' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public'
AND is_nullable = 'NO';

SELECT 'ATHLETES' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public'
AND is_nullable = 'NO';


-- Registrations
ALTER TABLE public.registrations ALTER COLUMN athlete_id DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN buyer_id DROP NOT NULL;

-- Athletes
ALTER TABLE public.athletes ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.athletes ALTER COLUMN gender DROP NOT NULL;

-- Verificar
SELECT 'REGISTRATIONS' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations' AND table_schema = 'public'
AND is_nullable = 'NO';

SELECT 'ATHLETES' as tabela, column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes' AND table_schema = 'public'
AND is_nullable = 'NO';



