-- Adicionar campos de analytics na tabela event_settings
-- Se os campos já existirem, não causará erro devido ao IF NOT EXISTS

-- Google Analytics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_settings' 
    AND column_name = 'analytics_google_analytics_id'
  ) THEN
    ALTER TABLE event_settings
    ADD COLUMN analytics_google_analytics_id TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_settings' 
    AND column_name = 'analytics_google_analytics_enabled'
  ) THEN
    ALTER TABLE event_settings
    ADD COLUMN analytics_google_analytics_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Google Tag Manager
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_settings' 
    AND column_name = 'analytics_gtm_container_id'
  ) THEN
    ALTER TABLE event_settings
    ADD COLUMN analytics_gtm_container_id TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_settings' 
    AND column_name = 'analytics_gtm_enabled'
  ) THEN
    ALTER TABLE event_settings
    ADD COLUMN analytics_gtm_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Facebook Pixel
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_settings' 
    AND column_name = 'analytics_facebook_pixel_id'
  ) THEN
    ALTER TABLE event_settings
    ADD COLUMN analytics_facebook_pixel_id TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_settings' 
    AND column_name = 'analytics_facebook_pixel_enabled'
  ) THEN
    ALTER TABLE event_settings
    ADD COLUMN analytics_facebook_pixel_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Comentários explicativos
COMMENT ON COLUMN event_settings.analytics_google_analytics_id IS 'ID do Google Analytics (G-XXXXXXXXXX)';
COMMENT ON COLUMN event_settings.analytics_google_analytics_enabled IS 'Indica se o Google Analytics está habilitado';
COMMENT ON COLUMN event_settings.analytics_gtm_container_id IS 'ID do Google Tag Manager (GTM-XXXXXXX)';
COMMENT ON COLUMN event_settings.analytics_gtm_enabled IS 'Indica se o Google Tag Manager está habilitado';
COMMENT ON COLUMN event_settings.analytics_facebook_pixel_id IS 'ID do Facebook Pixel';
COMMENT ON COLUMN event_settings.analytics_facebook_pixel_enabled IS 'Indica se o Facebook Pixel está habilitado';

