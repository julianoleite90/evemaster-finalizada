-- ============================================
-- CORREÇÃO FINAL PARA JULIANO
-- ============================================
-- Este script corrige TUDO de uma vez

-- 1. Identificar o ID correto do usuário
DO $$
DECLARE
  v_user_id UUID;
  v_organizer_id UUID := '0530a74c-a807-4d33-be12-95f42f41c76e';
BEGIN
  -- Buscar o user_id correto
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'julianodesouzaleite@gmail.com'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado!';
  END IF;

  RAISE NOTICE 'User ID correto: %', v_user_id;

  -- Atualizar o user_id do organizador
  UPDATE public.organizers
  SET 
    user_id = v_user_id,
    updated_at = NOW()
  WHERE id = v_organizer_id;

  IF FOUND THEN
    RAISE NOTICE '✅ Organizador atualizado com sucesso!';
  ELSE
    RAISE NOTICE '⚠️ Organizador não encontrado com ID: %', v_organizer_id;
  END IF;

  -- Verificar resultado
  PERFORM 1 FROM public.organizers 
  WHERE id = v_organizer_id AND user_id = v_user_id;
  
  IF FOUND THEN
    RAISE NOTICE '✅ Verificação: user_id está correto agora!';
  ELSE
    RAISE NOTICE '❌ Verificação: user_id ainda está incorreto!';
  END IF;
END $$;

-- 2. Verificar resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info,
  au.id as auth_user_id,
  au.email,
  o.id as organizer_id,
  o.user_id as organizer_user_id,
  o.company_name,
  o.company_cnpj,
  o.company_address,
  o.bank_name,
  o.agency,
  o.account_number,
  CASE 
    WHEN o.user_id = au.id THEN '✅ CORRETO - Deve funcionar agora!'
    ELSE '❌ AINDA ERRADO'
  END as status
FROM auth.users au
LEFT JOIN public.organizers o ON o.user_id = au.id
WHERE au.email = 'julianodesouzaleite@gmail.com';



