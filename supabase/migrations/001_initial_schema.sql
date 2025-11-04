   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   
   -- ============================================================================-- REUSABLE FUNCTIONS-- ============================================================================
   
   -- Function to automatically update updated_at timestamp
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = CURRENT_TIMESTAMP;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   -- ============================================================================-- ENUMS-- ============================================================================
   
   -- Priority levels for tasks
   CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
   
   -- Time of day sections
   CREATE TYPE daily_section_type AS ENUM ('morning', 'afternoon', 'evening');
   
   -- Task importance classification
   CREATE TYPE bonus_section_type AS ENUM ('essential', 'bonus');
   
   -- ============================================================================-- TABLES-- ============================================================================
   
   -- User Profiles-- Extends auth.users with additional profile information
   CREATE TABLE user_profiles (
       id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
       first_name TEXT,
       last_name TEXT,
       created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
       updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   );
   
   -- Create index on user_profiles
   CREATE INDEX idx_user_profiles_id ON user_profiles(id);
   
   -- Add updated_at trigger
   CREATE TRIGGER update_user_profiles_updated_at
       BEFORE UPDATE ON user_profiles
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();
   
   -- Categories-- User-defined categories for organizing tasks
   CREATE TABLE categories (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       name TEXT NOT NULL CHECK (name <> ''),
       color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
       emoji TEXT,
       position TEXT NOT NULL DEFAULT 'a0',
       created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
       updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
       
       -- Ensure unique category names per user
       CONSTRAINT unique_user_category_name UNIQUE(user_id, name)
   );
   
   -- Indexes for categories
   CREATE INDEX idx_categories_user_id ON categories(user_id);
   CREATE INDEX idx_categories_user_position ON categories(user_id, position);
   
   -- Add updated_at trigger
   CREATE TRIGGER update_categories_updated_at
       BEFORE UPDATE ON categories
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();
   
   -- Tasks-- Individual task items (manual and recurring)
   CREATE TABLE tasks (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       title TEXT NOT NULL CHECK (title <> ''),
       description TEXT,
       scheduled_date DATE,
       due_date DATE,
       completed BOOLEAN DEFAULT FALSE NOT NULL,
       completed_at TIMESTAMPTZ,
       category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
       priority priority_level,
       daily_section daily_section_type,
       bonus_section bonus_section_type,
       position TEXT NOT NULL DEFAULT 'a0',
       recurring_item_id UUID,  -- For Phase 6: links to recurring_task_items
       created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
       updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
       
       -- Ensure due_date is not before scheduled_date
       CONSTRAINT due_after_scheduled CHECK (
           due_date IS NULL 
           OR scheduled_date IS NULL 
           OR due_date >= scheduled_date
       )
   );
   
   -- Critical indexes for tasks (optimized for common queries)
   CREATE INDEX idx_tasks_user_id ON tasks(user_id);
   CREATE INDEX idx_tasks_user_scheduled_completed_position 
       ON tasks(user_id, scheduled_date, completed, position);
   CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
   CREATE INDEX idx_tasks_user_scheduled_incomplete 
       ON tasks(user_id, scheduled_date) WHERE completed = FALSE;
   CREATE INDEX idx_tasks_category_incomplete 
       ON tasks(category_id) WHERE completed = FALSE;
   CREATE INDEX idx_tasks_user_due_incomplete 
       ON tasks(user_id, due_date) WHERE completed = FALSE AND due_date IS NOT NULL;
   CREATE INDEX idx_tasks_recurring_item ON tasks(recurring_item_id);
   
   -- Add updated_at trigger
   CREATE TRIGGER update_tasks_updated_at
       BEFORE UPDATE ON tasks
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();
   
   -- Trigger to automatically manage completed_at timestamp
   CREATE OR REPLACE FUNCTION update_completed_at()
   RETURNS TRIGGER AS $$
   BEGIN
       -- When task is completed, set completed_at
       IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
           NEW.completed_at = CURRENT_TIMESTAMP;
       -- When task is uncompleted, clear completed_at
       ELSIF NEW.completed = FALSE THEN
           NEW.completed_at = NULL;
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER tasks_completed_at_trigger
       BEFORE UPDATE ON tasks
       FOR EACH ROW
       EXECUTE FUNCTION update_completed_at();
   
   -- ============================================================================-- COMMENTS (Documentation)-- ============================================================================
   
   COMMENT ON TABLE user_profiles IS 'Extended user profile information';
   COMMENT ON TABLE categories IS 'User-defined task categories';
   COMMENT ON TABLE tasks IS 'Individual task items';
   
   COMMENT ON COLUMN tasks.scheduled_date IS 'The date the user plans to work on this task';
   COMMENT ON COLUMN tasks.due_date IS 'The deadline for completing this task';
   COMMENT ON COLUMN tasks.position IS 'Lexorank position for drag-and-drop ordering';
   COMMENT ON COLUMN tasks.recurring_item_id IS 'Links to recurring_task_items (Phase 6)';