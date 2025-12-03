-- Migration: Add cancellation and refund tracking fields
-- Date: 2025-12-02

-- First, add new values to payment_status enum (if it exists as enum)
DO $$ 
BEGIN
    -- Try to add 'refunded' to the enum
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';
EXCEPTION
    WHEN undefined_object THEN
        -- Enum doesn't exist or column is text, ignore
        NULL;
END $$;

DO $$ 
BEGIN
    -- Try to add 'pending_refund' to the enum
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending_refund';
EXCEPTION
    WHEN undefined_object THEN
        -- Enum doesn't exist or column is text, ignore
        NULL;
END $$;

DO $$ 
BEGIN
    -- Try to add 'cancelled' to the enum
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION
    WHEN undefined_object THEN
        -- Enum doesn't exist or column is text, ignore
        NULL;
END $$;

-- Add cancellation fields to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add refund fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_transaction_id TEXT;

-- Create index for faster queries on cancelled registrations
CREATE INDEX IF NOT EXISTS idx_registrations_cancelled_at ON registrations(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN registrations.cancelled_at IS 'Timestamp when the registration was cancelled';
COMMENT ON COLUMN registrations.cancelled_by IS 'User ID who cancelled the registration';
COMMENT ON COLUMN registrations.cancellation_reason IS 'Reason for cancellation';
COMMENT ON COLUMN payments.refund_requested_at IS 'Timestamp when refund was requested';
COMMENT ON COLUMN payments.refund_processed_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN payments.refund_reason IS 'Reason for the refund';
COMMENT ON COLUMN payments.refund_amount IS 'Amount refunded';
COMMENT ON COLUMN payments.refund_transaction_id IS 'Transaction ID from payment gateway for the refund';

