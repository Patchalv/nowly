-- ============================================================================
-- Migration: Update Default Category Colors
-- ============================================================================
-- This migration updates the create_default_categories() function to use
-- colors from CATEGORY_COLOR_OPTIONS instead of hardcoded Tailwind colors.
-- Colors are now pastel: blue for Work, green for Personal, rose for Health.

-- Update the create_default_categories function with new colors
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
    -- Colors match CATEGORY_COLOR_OPTIONS from src/config/constants.ts
    INSERT INTO public.categories (user_id, name, color, icon, position) 
    VALUES
        (user_uid, 'Work', '#B0E0E6', 'Briefcase', 'a0'),
        (user_uid, 'Personal', '#C8E6C9', 'Home', 'a1'),
        (user_uid, 'Health', '#FFB6C1', 'Heart', 'a2');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function comment
COMMENT ON FUNCTION create_default_categories() IS 
    'Creates 3 default categories (Work, Personal, Health) for new users with lucide-react icon names and pastel colors from CATEGORY_COLOR_OPTIONS';

