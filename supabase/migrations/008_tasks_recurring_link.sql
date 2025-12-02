-- ============================================================================
-- TASKS RECURRING LINK
-- Phase 6: Link tasks to recurring_task_items
-- Note: This migration is idempotent and can be safely re-run
-- ============================================================================

-- Add foreign key constraint to existing recurring_item_id column
-- (Column was added in 001_initial_schema.sql, but FK couldn't be added 
-- until recurring_task_items table exists)
-- Idempotent: Drop constraint if exists before creating
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_recurring_item;
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_recurring_item 
    FOREIGN KEY (recurring_item_id) 
    REFERENCES recurring_task_items(id) 
    ON DELETE SET NULL;

-- Index for finding incomplete tasks by recurring item
-- Used when deleting a recurring item to clean up future uncompleted tasks
CREATE INDEX IF NOT EXISTS idx_tasks_recurring_incomplete 
    ON tasks(recurring_item_id, completed) 
    WHERE recurring_item_id IS NOT NULL AND completed = FALSE;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON CONSTRAINT fk_tasks_recurring_item ON tasks IS 
    'Links generated tasks to their recurring item template. SET NULL on delete preserves completed task history.';
