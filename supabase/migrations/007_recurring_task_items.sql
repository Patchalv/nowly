-- ============================================================================
-- RECURRING TASK ITEMS TABLE
-- Phase 6: Recurring Tasks Foundation
-- Note: This migration is idempotent and can be safely re-run
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Recurrence frequency options (idempotent: catches duplicate_object exception)
DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM (
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'weekdays',
        'weekends'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Recurring Task Items
-- Templates for generating recurring task instances
CREATE TABLE IF NOT EXISTS recurring_task_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Task template fields (copied to generated tasks)
    title TEXT NOT NULL CHECK (title <> ''),
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    priority priority_level DEFAULT 'medium',
    daily_section daily_section_type,
    bonus_section bonus_section_type,
    
    -- Recurrence configuration
    frequency recurring_frequency NOT NULL,
    rrule_string TEXT NOT NULL,  -- iCal RRULE format for flexible recurrence patterns
    
    -- Schedule boundaries
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL = indefinite recurrence
    due_offset_days INTEGER DEFAULT 0 CHECK (due_offset_days >= 0),  -- Days after scheduled_date for due_date
    
    -- Generation tracking
    last_generated_date DATE,  -- Last date tasks were generated up to
    tasks_to_generate_ahead INTEGER DEFAULT 15 CHECK (tasks_to_generate_ahead > 0),  -- Max tasks to generate ahead
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure end_date is not before start_date
    CONSTRAINT end_after_start CHECK (
        end_date IS NULL OR end_date >= start_date
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup by user
CREATE INDEX IF NOT EXISTS idx_recurring_items_user_id ON recurring_task_items(user_id);

-- Filter active items for a user
CREATE INDEX IF NOT EXISTS idx_recurring_items_user_active ON recurring_task_items(user_id, is_active);

-- Find items needing generation (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_recurring_items_generation ON recurring_task_items(user_id, last_generated_date)
    WHERE is_active = TRUE;

-- Index foreign key for category filtering and FK operations
CREATE INDEX IF NOT EXISTS idx_recurring_items_category_id ON recurring_task_items(category_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS (idempotent: running twice has no effect)
ALTER TABLE recurring_task_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own recurring items
DROP POLICY IF EXISTS "Users can view own recurring items" ON recurring_task_items;
CREATE POLICY "Users can view own recurring items"
    ON recurring_task_items
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own recurring items
DROP POLICY IF EXISTS "Users can insert own recurring items" ON recurring_task_items;
CREATE POLICY "Users can insert own recurring items"
    ON recurring_task_items
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own recurring items
DROP POLICY IF EXISTS "Users can update own recurring items" ON recurring_task_items;
CREATE POLICY "Users can update own recurring items"
    ON recurring_task_items
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recurring items
DROP POLICY IF EXISTS "Users can delete own recurring items" ON recurring_task_items;
CREATE POLICY "Users can delete own recurring items"
    ON recurring_task_items
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_recurring_task_items_updated_at ON recurring_task_items;
CREATE TRIGGER update_recurring_task_items_updated_at
    BEFORE UPDATE ON recurring_task_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE recurring_task_items IS 'Templates for generating recurring task instances';
COMMENT ON COLUMN recurring_task_items.rrule_string IS 'iCal RRULE format string for flexible recurrence patterns';
COMMENT ON COLUMN recurring_task_items.start_date IS 'Date from which recurrence begins';
COMMENT ON COLUMN recurring_task_items.end_date IS 'Date after which no more tasks are generated (NULL = indefinite)';
COMMENT ON COLUMN recurring_task_items.due_offset_days IS 'Number of days after scheduled_date to set due_date on generated tasks';
COMMENT ON COLUMN recurring_task_items.last_generated_date IS 'Tracks the last date up to which tasks have been generated';
COMMENT ON COLUMN recurring_task_items.tasks_to_generate_ahead IS 'Maximum number of future tasks to generate at once';
COMMENT ON COLUMN recurring_task_items.is_active IS 'Whether this recurring item is actively generating tasks';
