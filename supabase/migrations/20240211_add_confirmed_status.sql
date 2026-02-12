-- Add CONFIRMED status to orders table CHECK constraint
-- This allows the delivery tracking workflow: PAID -> CONFIRMED -> IN_PRODUCTION -> SHIPPED -> DELIVERED

-- Drop old constraint and add new one with CONFIRMED status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
    status IN ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELED', 'TEST_ORDER')
);
