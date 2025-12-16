-- Migration: Remove due_after_scheduled constraint
-- Description: Allow tasks to have due_date < scheduled_date to support overdue task rollover
-- Date: 2024-12-16

ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS due_after_scheduled;

COMMENT ON COLUMN tasks.due_date IS 
  'Due date for the task. Can be before scheduled_date for overdue tasks.';
