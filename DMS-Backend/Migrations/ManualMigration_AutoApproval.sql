-- Manual Migration Script for Auto-Approval Feature
-- Date: 2026-05-27
-- Purpose: Create auto_approval_configs table and migrate Draft status to Pending

-- ==========================================
-- 1. Create auto_approval_configs table
-- ==========================================
CREATE TABLE IF NOT EXISTS auto_approval_configs (
    "Id" uuid PRIMARY KEY,
    "SubsectionCode" text NOT NULL,
    "SubsectionName" text NOT NULL,
    "Module" text NOT NULL,
    "IsEnabled" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz,
    "UpdatedBy" uuid
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "IX_auto_approval_configs_SubsectionCode" 
    ON auto_approval_configs ("SubsectionCode");

-- ==========================================
-- 2. Seed initial auto-approval configurations
-- ==========================================
INSERT INTO auto_approval_configs ("Id", "SubsectionCode", "SubsectionName", "Module", "IsEnabled", "CreatedAt")
VALUES 
    (gen_random_uuid(), 'production:daily', 'Daily Production', 'Production', false, NOW()),
    (gen_random_uuid(), 'production:cancel', 'Production Cancel', 'Production', false, NOW()),
    (gen_random_uuid(), 'production:stock-adjustment', 'Stock Adjustment', 'Production', false, NOW()),
    (gen_random_uuid(), 'production:daily-plan', 'Daily Production Plan', 'Production', false, NOW()),
    (gen_random_uuid(), 'operation:delivery', 'Delivery', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:delivery-return', 'Delivery Return', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:transfer', 'Transfer', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:disposal', 'Disposal', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:cancellation', 'Cancellation', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:label-printing', 'Label Printing', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:stock-bf', 'Stock B/F', 'Operation', false, NOW()),
    (gen_random_uuid(), 'operation:stores-issue-note', 'Stores Issue Note', 'Operation', false, NOW()),
    (gen_random_uuid(), 'dms:delivery-plan', 'Delivery Plan', 'DMS', false, NOW()),
    (gen_random_uuid(), 'dms:immediate-order', 'Immediate Order', 'DMS', false, NOW()),
    (gen_random_uuid(), 'dms:reconciliation', 'Reconciliation', 'DMS', false, NOW())
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. Migrate Draft status (0) to Pending status (1)
-- ==========================================

-- Daily Productions
UPDATE daily_productions SET "Status" = 1 WHERE "Status" = 0;

-- Production Cancels  
UPDATE production_cancels SET "Status" = 1 WHERE "Status" = 0;

-- Stock Adjustments
UPDATE stock_adjustments SET "Status" = 1 WHERE "Status" = 0;

-- Daily Production Plans
UPDATE daily_production_plans SET "Status" = 1 WHERE "Status" = 0;

-- Deliveries
UPDATE deliveries SET "Status" = 1 WHERE "Status" = 0;

-- Delivery Returns
UPDATE delivery_returns SET "Status" = 1 WHERE "Status" = 0;

-- Transfers
UPDATE transfers SET "Status" = 1 WHERE "Status" = 0;

-- Disposals
UPDATE disposals SET "Status" = 1 WHERE "Status" = 0;

-- Cancellations
UPDATE cancellations SET "Status" = 1 WHERE "Status" = 0;

-- Label Print Requests
UPDATE label_print_requests SET "Status" = 1 WHERE "Status" = 0;

-- Stock BFs
UPDATE stock_bfs SET "Status" = 1 WHERE "Status" = 0;

-- Stores Issue Notes
UPDATE stores_issue_notes SET "Status" = 1 WHERE "Status" = 0;

-- Delivery Plans
UPDATE delivery_plans SET "Status" = 1 WHERE "Status" = 0;

-- Immediate Orders
UPDATE immediate_orders SET "Status" = 1 WHERE "Status" = 0;

-- Reconciliations (if using Draft status)
-- UPDATE reconciliations SET "Status" = 1 WHERE "Status" = 0;

-- ==========================================
-- Verification Queries (Optional - for testing)
-- ==========================================

-- Check auto_approval_configs table
-- SELECT * FROM auto_approval_configs ORDER BY "Module", "SubsectionName";

-- Check for any remaining Draft statuses (should return 0 rows)
-- SELECT 'daily_productions' as table_name, COUNT(*) as draft_count FROM daily_productions WHERE "Status" = 0
-- UNION ALL
-- SELECT 'production_cancels', COUNT(*) FROM production_cancels WHERE "Status" = 0
-- UNION ALL
-- SELECT 'stock_adjustments', COUNT(*) FROM stock_adjustments WHERE "Status" = 0;
-- ... (add more tables as needed)

COMMIT;
