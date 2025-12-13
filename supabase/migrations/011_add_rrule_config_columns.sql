-- ============================================================================
-- ADD RRULE CONFIGURATION COLUMNS
-- Stores RRULE parameters for easy regeneration when recurrence config changes
-- Note: This migration is idempotent and can be safely re-run
-- ============================================================================

-- Add columns to store RRULE configuration parameters
ALTER TABLE recurring_task_items
ADD COLUMN IF NOT EXISTS weekly_days INTEGER[],
ADD COLUMN IF NOT EXISTS monthly_day INTEGER,
ADD COLUMN IF NOT EXISTS yearly_month INTEGER,
ADD COLUMN IF NOT EXISTS yearly_day INTEGER;

-- Add constraints for valid ranges
ALTER TABLE recurring_task_items
ADD CONSTRAINT IF NOT EXISTS monthly_day_range CHECK (monthly_day IS NULL OR (monthly_day >= 1 AND monthly_day <= 31));

ALTER TABLE recurring_task_items
ADD CONSTRAINT IF NOT EXISTS yearly_month_range CHECK (yearly_month IS NULL OR (yearly_month >= 1 AND yearly_month <= 12));

ALTER TABLE recurring_task_items
ADD CONSTRAINT IF NOT EXISTS yearly_day_range CHECK (yearly_day IS NULL OR (yearly_day >= 1 AND yearly_day <= 31));

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN recurring_task_items.weekly_days IS 
  'Days of week for weekly recurrence (0=Sunday, 1=Monday, ..., 6=Saturday). JavaScript native day numbers.';
  
COMMENT ON COLUMN recurring_task_items.monthly_day IS 
  'Day of month for monthly recurrence (1-31).';
  
COMMENT ON COLUMN recurring_task_items.yearly_month IS 
  'Month for yearly recurrence (1-12).';
  
COMMENT ON COLUMN recurring_task_items.yearly_day IS 
  'Day of month for yearly recurrence (1-31).';

