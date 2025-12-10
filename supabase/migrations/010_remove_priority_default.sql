-- ============================================================================
-- REMOVE PRIORITY DEFAULT FROM RECURRING TASK ITEMS
-- Migration: 010
-- Description: Remove DEFAULT 'medium' and NOT NULL constraints from 
--              recurring_task_items.priority column to allow null priority
-- ============================================================================

-- Update existing rows with 'medium' priority to NULL for consistency
UPDATE recurring_task_items
SET priority = NULL
WHERE priority = 'medium';

-- Alter the column to remove DEFAULT and NOT NULL constraints
-- This makes priority nullable with no default value
ALTER TABLE recurring_task_items
ALTER COLUMN priority DROP DEFAULT,
ALTER COLUMN priority DROP NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN recurring_task_items.priority IS 
  'Priority level for generated tasks. NULL means no priority assigned.';

