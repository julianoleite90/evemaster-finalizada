-- Script para deletar o usuário elo.gabriela@gmail.com
-- ATENÇÃO: Este script remove TODAS as referências ao usuário no banco de dados

-- 1. Buscar o ID do usuário
DO $$
DECLARE
    user_id_to_delete UUID;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT id INTO user_id_to_delete
    FROM public.users
    WHERE email = 'elo.gabriela@gmail.com';

    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado com o email: elo.gabriela@gmail.com';
        RETURN;
    END IF;

    RAISE NOTICE 'Usuário encontrado com ID: %', user_id_to_delete;

    -- 2. Deletar relacionamentos em organization_users
    DELETE FROM public.organization_users
    WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Relacionamentos em organization_users deletados';

    -- 3. Deletar relacionamentos em athletes (se houver)
    DELETE FROM public.athletes
    WHERE email = 'elo.gabriela@gmail.com' OR user_id = user_id_to_delete;
    RAISE NOTICE 'Dados em athletes deletados';

    -- 4. Deletar registrations relacionadas (se necessário)
    -- Nota: Isso pode afetar eventos, então comente se não quiser deletar
    -- DELETE FROM public.registrations
    -- WHERE buyer_id = user_id_to_delete;

    -- 5. Deletar da tabela users
    DELETE FROM public.users
    WHERE id = user_id_to_delete;
    RAISE NOTICE 'Usuário deletado da tabela users';

    -- 6. Deletar do auth.users (requer privilégios de admin)
    -- NOTA: Isso deve ser feito via Supabase Dashboard ou API Admin
    -- DELETE FROM auth.users WHERE id = user_id_to_delete;

    RAISE NOTICE 'Processo de deleção concluído para o usuário: elo.gabriela@gmail.com';
END $$;

-- Verificação: Verificar se o usuário foi deletado
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'elo.gabriela@gmail.com') 
        THEN 'Usuário ainda existe'
        ELSE 'Usuário deletado com sucesso'
    END AS status;

