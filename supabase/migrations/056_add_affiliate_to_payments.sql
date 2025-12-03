-- Migration: Add affiliate fields to payments table
-- Date: 2025-12-03

-- Add affiliate tracking fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10, 2);

-- Create index for faster queries on affiliate payments
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_id ON payments(affiliate_id) WHERE affiliate_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.affiliate_id IS 'ID of the affiliate who generated this sale';
COMMENT ON COLUMN payments.affiliate_commission IS 'Commission earned by the affiliate for this sale';

-- Migration: Add affiliate fields to payments table
-- Date: 2025-12-03

-- Add affiliate tracking fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10, 2);

-- Create index for faster queries on affiliate payments
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_id ON payments(affiliate_id) WHERE affiliate_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.affiliate_id IS 'ID of the affiliate who generated this sale';
COMMENT ON COLUMN payments.affiliate_commission IS 'Commission earned by the affiliate for this sale';

-- Migration: Add affiliate fields to payments table
-- Date: 2025-12-03

-- Add affiliate tracking fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10, 2);

-- Create index for faster queries on affiliate payments
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_id ON payments(affiliate_id) WHERE affiliate_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.affiliate_id IS 'ID of the affiliate who generated this sale';
COMMENT ON COLUMN payments.affiliate_commission IS 'Commission earned by the affiliate for this sale';

-- Migration: Add affiliate fields to payments table
-- Date: 2025-12-03

-- Add affiliate tracking fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10, 2);

-- Create index for faster queries on affiliate payments
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_id ON payments(affiliate_id) WHERE affiliate_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.affiliate_id IS 'ID of the affiliate who generated this sale';
COMMENT ON COLUMN payments.affiliate_commission IS 'Commission earned by the affiliate for this sale';

-- Migration: Add affiliate fields to payments table
-- Date: 2025-12-03

-- Add affiliate tracking fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10, 2);

-- Create index for faster queries on affiliate payments
CREATE INDEX IF NOT EXISTS idx_payments_affiliate_id ON payments(affiliate_id) WHERE affiliate_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.affiliate_id IS 'ID of the affiliate who generated this sale';
COMMENT ON COLUMN payments.affiliate_commission IS 'Commission earned by the affiliate for this sale';

