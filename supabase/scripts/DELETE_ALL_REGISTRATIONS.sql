-- DELETAR TODAS AS INSCRIÇÕES E DADOS RELACIONADOS

-- Primeiro deletar pagamentos
DELETE FROM public.payments;

-- Depois deletar atletas
DELETE FROM public.athletes;

-- Por último deletar inscrições
DELETE FROM public.registrations;

-- Verificar se foi tudo deletado
SELECT 
  (SELECT COUNT(*) FROM public.registrations) as total_registrations,
  (SELECT COUNT(*) FROM public.athletes) as total_athletes,
  (SELECT COUNT(*) FROM public.payments) as total_payments;

SELECT 'TODAS AS INSCRIÇÕES FORAM DELETADAS!' as status;


