-- ============================================
-- ADICIONAR CAMPOS GPX E OPÇÕES DE EXIBIÇÃO AOS TICKETS
-- ============================================
-- Este script adiciona campos para upload de arquivo GPX por ingresso
-- e opções para habilitar/desabilitar exibição de percurso, mapa e altimetria

-- Adicionar colunas na tabela tickets
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS gpx_file_url TEXT,
ADD COLUMN IF NOT EXISTS show_route BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_map BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_elevation BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN public.tickets.gpx_file_url IS 'URL do arquivo GPX do percurso para este ingresso/distância';
COMMENT ON COLUMN public.tickets.show_route IS 'Habilitar/desabilitar exibição do percurso no mapa';
COMMENT ON COLUMN public.tickets.show_map IS 'Habilitar/desabilitar exibição do mapa na página do evento';
COMMENT ON COLUMN public.tickets.show_elevation IS 'Habilitar/desabilitar exibição do gráfico de altimetria';

