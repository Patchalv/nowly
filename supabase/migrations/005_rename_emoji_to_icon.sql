-- ============================================================================
-- Migration: Rename emoji column to icon in categories table
-- ============================================================================
-- This migration renames the emoji column to icon and updates the default
-- categories function to use icon names instead of emoji strings.

-- Rename emoji column to icon
ALTER TABLE categories RENAME COLUMN emoji TO icon;

-- Update the create_default_categories function to use icon names
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER 
SECURITY DEFINER  -- Runs with elevated privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
    user_uid UUID;
BEGIN
    user_uid := NEW.id;
    
    -- Insert default categories with proper positioning and icon names
    INSERT INTO public.categories (user_id, name, color, icon, position) 
    VALUES
        (user_uid, 'Work', '#3B82F6', 'Briefcase', 'a0'),
        (user_uid, 'Personal', '#10B981', 'Home', 'a1'),
        (user_uid, 'Health', '#EF4444', 'Heart', 'a2');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function comment
COMMENT ON FUNCTION create_default_categories() IS 
    'Creates 3 default categories (Work, Personal, Health) for new users with lucide-react icon names';

