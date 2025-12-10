-- ============================================================================
-- REMOVE PRIORITY DEFAULT FROM RECURRING TASK ITEMS
-- Migration: 010
-- Description: Remove DEFAULT 'medium' and NOT NULL constraints from 
--              recurring_task_items.priority column to allow null priority
--              for new items. Existing items with 'medium' priority are preserved.
-- ============================================================================

-- Alter the column to remove DEFAULT and NOT NULL constraints
-- This makes priority nullable with no default value for new items
-- Existing rows with 'medium' priority will remain unchanged
ALTER TABLE recurring_task_items
ALTER COLUMN priority DROP DEFAULT,
ALTER COLUMN priority DROP NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN recurring_task_items.priority IS 
  'Priority level for generated tasks. NULL means no priority assigned.';

