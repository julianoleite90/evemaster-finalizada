-- ============================================
-- MIGRATION: Deletar usuários participantes/compradores de eventos
-- ============================================
-- Este script deleta usuários que são participantes/compradores de eventos
-- (role = 'ATLETA' e que têm registrations)
-- 
-- ATENÇÃO: Este script é destrutivo e não pode ser revertido!
-- Execute apenas se tiver certeza do que está fazendo.
-- 
-- O script deleta:
-- 1. Pagamentos relacionados às inscrições
-- 2. Dados de atletas relacionados
-- 3. Inscrições (registrations)
-- 4. Usuários que são apenas participantes (não organizadores ou afiliados)
-- 5. Usuários do auth.users do Supabase

-- ============================================
-- OPÇÃO 1: Deletar TODOS os usuários participantes
-- ============================================
-- Descomente as linhas abaixo para executar

/*
-- Deletar usuários que são apenas participantes (não organizadores, não afiliados)
-- e que têm inscrições
DELETE FROM auth.users
WHERE id IN (
  SELECT DISTINCT u.id
  FROM public.users u
  WHERE u.role = 'ATLETA'
    AND (
      -- Usuário é athlete_id em alguma registration
      EXISTS (SELECT 1 FROM public.registrations r WHERE r.athlete_id = u.id)
      OR
      -- Usuário é buyer_id em alguma registration
      EXISTS (SELECT 1 FROM public.registrations r WHERE r.buyer_id = u.id)
      OR
      -- Usuário é user_id em alguma registration
      EXISTS (SELECT 1 FROM public.registrations r WHERE r.user_id = u.id)
    )
    -- Não é organizador
    AND NOT EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id)
    -- Não é afiliado
    AND NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id)
);

-- Nota: Como as foreign keys têm ON DELETE CASCADE, as registrations,
-- payments e athletes serão deletados automaticamente quando os usuários
-- forem deletados do auth.users (que por sua vez deleta da public.users)
*/

-- ============================================
-- OPÇÃO 2: Deletar usuários participantes de eventos específicos
-- ============================================
-- Substitua 'EVENT_ID_AQUI' pelo ID do evento

/*
DELETE FROM auth.users
WHERE id IN (
  SELECT DISTINCT u.id
  FROM public.users u
  INNER JOIN public.registrations r ON (
    r.athlete_id = u.id 
    OR r.buyer_id = u.id 
    OR r.user_id = u.id
  )
  WHERE r.event_id = 'EVENT_ID_AQUI'::uuid
    AND u.role = 'ATLETA'
    AND NOT EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id)
);
*/

-- ============================================
-- OPÇÃO 3: Deletar usuários participantes criados em um período específico
-- ============================================
-- Substitua as datas conforme necessário

/*
DELETE FROM auth.users
WHERE id IN (
  SELECT DISTINCT u.id
  FROM public.users u
  WHERE u.role = 'ATLETA'
    AND u.created_at BETWEEN '2024-01-01'::timestamp AND '2024-12-31'::timestamp
    AND (
      EXISTS (SELECT 1 FROM public.registrations r WHERE r.athlete_id = u.id)
      OR EXISTS (SELECT 1 FROM public.registrations r WHERE r.buyer_id = u.id)
      OR EXISTS (SELECT 1 FROM public.registrations r WHERE r.user_id = u.id)
    )
    AND NOT EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id)
);
*/

-- ============================================
-- OPÇÃO 4: Apenas visualizar usuários que seriam deletados (SEM DELETAR)
-- ============================================
-- Use esta query para ver quais usuários seriam deletados antes de executar
-- IMPORTANTE: Esta query EXCLUI organizadores e afiliados do resultado

SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  COUNT(DISTINCT r.id) as total_registrations,
  COUNT(DISTINCT CASE WHEN r.athlete_id = u.id THEN r.id END) as as_athlete,
  COUNT(DISTINCT CASE WHEN r.buyer_id = u.id THEN r.id END) as as_buyer,
  COUNT(DISTINCT CASE WHEN r.user_id = u.id THEN r.id END) as as_user,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id) THEN 'SIM'
    ELSE 'NÃO'
  END as is_organizer,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id) THEN 'SIM'
    ELSE 'NÃO'
  END as is_affiliate
FROM public.users u
LEFT JOIN public.registrations r ON (
  r.athlete_id = u.id 
  OR r.buyer_id = u.id 
  OR r.user_id = u.id
)
WHERE u.role = 'ATLETA'
  AND (
    EXISTS (SELECT 1 FROM public.registrations r2 WHERE r2.athlete_id = u.id)
    OR EXISTS (SELECT 1 FROM public.registrations r2 WHERE r2.buyer_id = u.id)
    OR EXISTS (SELECT 1 FROM public.registrations r2 WHERE r2.user_id = u.id)
  )
  -- EXCLUIR organizadores e afiliados do resultado
  AND NOT EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id)
GROUP BY u.id, u.email, u.full_name, u.role, u.created_at
ORDER BY total_registrations DESC, u.created_at DESC;

-- ============================================
-- OPÇÃO 5: Deletar apenas usuários sem inscrições confirmadas
-- ============================================
-- Deleta apenas usuários que têm inscrições pendentes ou canceladas

/*
DELETE FROM auth.users
WHERE id IN (
  SELECT DISTINCT u.id
  FROM public.users u
  INNER JOIN public.registrations r ON (
    r.athlete_id = u.id 
    OR r.buyer_id = u.id 
    OR r.user_id = u.id
  )
  WHERE u.role = 'ATLETA'
    AND r.status IN ('pending', 'cancelled')
    AND NOT EXISTS (SELECT 1 FROM public.organizers o WHERE o.user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id)
    -- Não tem inscrições confirmadas
    AND NOT EXISTS (
      SELECT 1 FROM public.registrations r2 
      WHERE (r2.athlete_id = u.id OR r2.buyer_id = u.id OR r2.user_id = u.id)
        AND r2.status = 'confirmed'
    )
);
*/

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Este script deleta do auth.users, que automaticamente deleta de public.users
--    devido ao ON DELETE CASCADE
-- 2. As registrations serão deletadas automaticamente devido ao ON DELETE CASCADE
--    nas foreign keys athlete_id e buyer_id
-- 3. Os payments serão deletados automaticamente devido ao ON DELETE CASCADE
--    na foreign key registration_id
-- 4. Os athletes serão deletados automaticamente devido ao ON DELETE CASCADE
--    na foreign key registration_id
-- 5. O script protege organizadores e afiliados de serem deletados
-- 6. SEMPRE execute a OPÇÃO 4 primeiro para ver quais usuários seriam deletados
-- 7. Faça backup do banco antes de executar qualquer DELETE
-- 8. Teste em ambiente de desenvolvimento primeiro
