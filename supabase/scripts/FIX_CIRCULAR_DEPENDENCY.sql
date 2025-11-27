-- RESOLVER DEPENDÊNCIA CIRCULAR
-- O fluxo correto é: Criar atleta -> Criar inscrição com athlete_id -> Atualizar atleta com registration_id

-- Tornar registration_id opcional no athletes (será preenchido depois)
ALTER TABLE public.athletes ALTER COLUMN registration_id DROP NOT NULL;

-- Verificar
SELECT 'athletes.registration_id' as campo, is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes' AND column_name = 'registration_id' AND table_schema = 'public';



