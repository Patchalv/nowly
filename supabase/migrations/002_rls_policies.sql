   -- ============================================================================-- ENABLE ROW LEVEL SECURITY-- ============================================================================
   
   -- Enable RLS on all tables
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
   
   -- ============================================================================-- USER_PROFILES POLICIES-- ============================================================================
   
   -- Users can view their own profile
   CREATE POLICY "Users can view own profile"
       ON user_profiles
       FOR SELECT
       USING (auth.uid() = id);
   
   -- Users can insert their own profile
   CREATE POLICY "Users can insert own profile"
       ON user_profiles
       FOR INSERT
       WITH CHECK (auth.uid() = id);
   
   -- Users can update their own profile
   CREATE POLICY "Users can update own profile"
       ON user_profiles
       FOR UPDATE
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);
   
   -- Users can delete their own profile
   CREATE POLICY "Users can delete own profile"
       ON user_profiles
       FOR DELETE
       USING (auth.uid() = id);
   
   -- ============================================================================-- CATEGORIES POLICIES-- ============================================================================
   
   -- Users can view their own categories
   CREATE POLICY "Users can view own categories"
       ON categories
       FOR SELECT
       USING (auth.uid() = user_id);
   
   -- Users can insert their own categories
   CREATE POLICY "Users can insert own categories"
       ON categories
       FOR INSERT
       WITH CHECK (auth.uid() = user_id);
   
   -- Users can update their own categories
   CREATE POLICY "Users can update own categories"
       ON categories
       FOR UPDATE
       USING (auth.uid() = user_id)
       WITH CHECK (auth.uid() = user_id);
   
   -- Users can delete their own categories
   CREATE POLICY "Users can delete own categories"
       ON categories
       FOR DELETE
       USING (auth.uid() = user_id);
   
   -- ============================================================================-- TASKS POLICIES-- ============================================================================
   
   -- Users can view their own tasks
   CREATE POLICY "Users can view own tasks"
       ON tasks
       FOR SELECT
       USING (auth.uid() = user_id);
   
   -- Users can insert their own tasks
   CREATE POLICY "Users can insert own tasks"
       ON tasks
       FOR INSERT
       WITH CHECK (auth.uid() = user_id);
   
   -- Users can update their own tasks
   CREATE POLICY "Users can update own tasks"
       ON tasks
       FOR UPDATE
       USING (auth.uid() = user_id)
       WITH CHECK (auth.uid() = user_id);
   
   -- Users can delete their own tasks
   CREATE POLICY "Users can delete own tasks"
       ON tasks
       FOR DELETE
       USING (auth.uid() = user_id);
   
   -- ============================================================================-- VERIFICATION-- ============================================================================
   
   -- Verify RLS is enabled (should return TRUE for all tables)
   DO $$
   DECLARE
       table_name TEXT;
       rls_enabled BOOLEAN;
   BEGIN
       FOR table_name IN 
           SELECT tablename FROM pg_tables 
           WHERE schemaname = 'public' 
           AND tablename IN ('user_profiles', 'categories', 'tasks')
       LOOP
           SELECT relrowsecurity INTO rls_enabled
           FROM pg_class
           WHERE relname = table_name;
           
           IF NOT rls_enabled THEN
               RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
           END IF;
           
           RAISE NOTICE 'RLS enabled on %: TRUE', table_name;
       END LOOP;
   END $$;