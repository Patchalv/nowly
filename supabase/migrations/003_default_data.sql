   -- ============================================================================-- FUNCTION: Create User Profile-- ============================================================================-- This function automatically creates a user profile when a new auth user signs up
   
   CREATE OR REPLACE FUNCTION create_user_profile()
   RETURNS TRIGGER 
   SECURITY DEFINER  -- Runs with elevated privileges to bypass RLS
   SET search_path = public
   AS $$
   BEGIN
       INSERT INTO public.user_profiles (id, first_name, last_name)
       VALUES (
           NEW.id,
           COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
           COALESCE(NEW.raw_user_meta_data->>'last_name', '')
       );
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   -- Trigger on auth.users table to create profile
   CREATE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW
       EXECUTE FUNCTION create_user_profile();
   
   -- ============================================================================-- FUNCTION: Create Default Categories-- ============================================================================-- This function creates 3 default categories for new users
   
   CREATE OR REPLACE FUNCTION create_default_categories()
   RETURNS TRIGGER 
   SECURITY DEFINER  -- Runs with elevated privileges to bypass RLS
   SET search_path = public
   AS $$
   DECLARE
       user_uid UUID;
   BEGIN
       user_uid := NEW.id;
       
       -- Insert default categories with proper positioning
       INSERT INTO public.categories (user_id, name, color, emoji, position) 
       VALUES
           (user_uid, 'Work', '#3B82F6', '💼', 'a0'),
           (user_uid, 'Personal', '#10B981', '🏠', 'a1'),
           (user_uid, 'Health', '#EF4444', '❤️', 'a2');
       
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   -- Trigger on user_profiles table to create categories
   CREATE TRIGGER create_user_default_categories
       AFTER INSERT ON user_profiles
       FOR EACH ROW
       EXECUTE FUNCTION create_default_categories();
   
   -- ============================================================================-- VERIFICATION & DOCUMENTATION-- ============================================================================
   
   COMMENT ON FUNCTION create_user_profile() IS 
       'Automatically creates a user profile when a new user signs up';
   
   COMMENT ON FUNCTION create_default_categories() IS 
       'Creates 3 default categories (Work, Personal, Health) for new users';
   
   -- Test that triggers are properly created
   DO $$
   BEGIN
       -- Check if triggers exist
       IF NOT EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
       ) THEN
           RAISE EXCEPTION 'Trigger on_auth_user_created not found';
       END IF;
       
       IF NOT EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = 'create_user_default_categories'
       ) THEN
           RAISE EXCEPTION 'Trigger create_user_default_categories not found';
       END IF;
       
       RAISE NOTICE 'All triggers created successfully';
   END $$;