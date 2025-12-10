-- ============================================================================
-- Seed File: Test User and Sample Data
-- ============================================================================
-- This seed file creates a test user with default categories and sample tasks
-- for feature branch testing. It is idempotent and safe to run multiple times.
--
-- Test User Credentials:
-- Email: patrick@avatar.com
-- Password: Nova1234!
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Create Test User
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID;
    test_user_email TEXT := 'patrick@avatar.com';
    work_category_id UUID;
    personal_category_id UUID;
    health_category_id UUID;
    instance_id_value UUID;
BEGIN
    -- Get instance_id (required for auth.users)
    -- Use COALESCE to get from auth.instances or use default
    SELECT COALESCE(
        (SELECT id FROM auth.instances LIMIT 1),
        '00000000-0000-0000-0000-000000000000'::UUID
    ) INTO instance_id_value;

    -- Check if test user already exists
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = test_user_email;

    -- Create user if doesn't exist
    IF test_user_id IS NULL THEN
        -- Generate UUID for new user
        test_user_id := gen_random_uuid();

        -- Insert into auth.users with password hash
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            test_user_id,
            instance_id_value,
            test_user_email,
            crypt('Nova1234!', gen_salt('bf')),
            NOW(),
            '{"first_name": "Patrick", "last_name": "Avatar"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        );

        RAISE NOTICE 'Created test user: %', test_user_email;
    ELSE
        RAISE NOTICE 'Test user already exists: %', test_user_email;
    END IF;

    -- Wait a moment for triggers to execute (they fire automatically)
    -- Then verify profile and categories exist, create if needed
    PERFORM pg_sleep(0.1);

    -- Ensure user profile exists (in case trigger didn't fire)
    INSERT INTO public.user_profiles (id, first_name, last_name)
    VALUES (test_user_id, 'Patrick', 'Avatar')
    ON CONFLICT (id) DO UPDATE
    SET first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;

    -- Ensure default categories exist (in case trigger didn't fire)
    -- Work category
    INSERT INTO public.categories (user_id, name, color, icon, position)
    VALUES (test_user_id, 'Work', '#3B82F6', 'Briefcase', 'a0')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Personal category
    INSERT INTO public.categories (user_id, name, color, icon, position)
    VALUES (test_user_id, 'Personal', '#10B981', 'Home', 'a1')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Health category
    INSERT INTO public.categories (user_id, name, color, icon, position)
    VALUES (test_user_id, 'Health', '#EF4444', 'Heart', 'a2')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Query category IDs
    SELECT id INTO work_category_id
    FROM public.categories
    WHERE user_id = test_user_id AND name = 'Work';

    SELECT id INTO personal_category_id
    FROM public.categories
    WHERE user_id = test_user_id AND name = 'Personal';

    SELECT id INTO health_category_id
    FROM public.categories
    WHERE user_id = test_user_id AND name = 'Health';

    -- ============================================================================
    -- Create Sample Tasks (with idempotency checks)
    -- ============================================================================

    -- Task 1: dueDate today, no category, no priority, morning, essential
    IF NOT EXISTS (
        SELECT 1 FROM public.tasks
        WHERE user_id = test_user_id AND title = 'Review project proposal'
    ) THEN
        INSERT INTO public.tasks (
            user_id,
            title,
            description,
            due_date,
            completed,
            completed_at,
            category_id,
            priority,
            daily_section,
            bonus_section,
            position,
            scheduled_date
        ) VALUES (
            test_user_id,
            'Review project proposal',
            'Go through the Q1 project proposal document and provide feedback on scope and timeline.',
            CURRENT_DATE,
            false,
            NULL,
            NULL,
            NULL,
            'morning',
            'essential',
            'a0',
            NULL
        );
    END IF;

    -- Task 2: dueDate +3 days, Work category, low priority, afternoon, bonus
    IF NOT EXISTS (
        SELECT 1 FROM public.tasks
        WHERE user_id = test_user_id AND title = 'Schedule team meeting'
    ) THEN
        INSERT INTO public.tasks (
            user_id,
            title,
            description,
            due_date,
            completed,
            completed_at,
            category_id,
            priority,
            daily_section,
            bonus_section,
            position,
            scheduled_date
        ) VALUES (
            test_user_id,
            'Schedule team meeting',
            'Coordinate with team members to find a suitable time for the quarterly planning session.',
            CURRENT_DATE + INTERVAL '3 days',
            false,
            NULL,
            work_category_id,
            'low',
            'afternoon',
            'bonus',
            'a1',
            NULL
        );
    END IF;

    -- Task 3: no dueDate, Personal category, medium priority, evening, essential
    IF NOT EXISTS (
        SELECT 1 FROM public.tasks
        WHERE user_id = test_user_id AND title = 'Update documentation'
    ) THEN
        INSERT INTO public.tasks (
            user_id,
            title,
            description,
            due_date,
            completed,
            completed_at,
            category_id,
            priority,
            daily_section,
            bonus_section,
            position,
            scheduled_date
        ) VALUES (
            test_user_id,
            'Update documentation',
            'Review and update the API documentation with the latest endpoint changes and examples.',
            NULL,
            false,
            NULL,
            personal_category_id,
            'medium',
            'evening',
            'essential',
            'a2',
            NULL
        );
    END IF;

    -- Task 4: no dueDate, Health category, high priority, no dailySection, bonus
    IF NOT EXISTS (
        SELECT 1 FROM public.tasks
        WHERE user_id = test_user_id AND title = 'Plan sprint retrospective'
    ) THEN
        INSERT INTO public.tasks (
            user_id,
            title,
            description,
            due_date,
            completed,
            completed_at,
            category_id,
            priority,
            daily_section,
            bonus_section,
            position,
            scheduled_date
        ) VALUES (
            test_user_id,
            'Plan sprint retrospective',
            'Prepare agenda and discussion points for the upcoming sprint retrospective meeting.',
            NULL,
            false,
            NULL,
            health_category_id,
            'high',
            NULL,
            'bonus',
            'a3',
            NULL
        );
    END IF;

    -- Task 5: no dueDate, no category, no priority, no dailySection, no bonusSection
    IF NOT EXISTS (
        SELECT 1 FROM public.tasks
        WHERE user_id = test_user_id AND title = 'Analyze user feedback'
    ) THEN
        INSERT INTO public.tasks (
            user_id,
            title,
            description,
            due_date,
            completed,
            completed_at,
            category_id,
            priority,
            daily_section,
            bonus_section,
            position,
            scheduled_date
        ) VALUES (
            test_user_id,
            'Analyze user feedback',
            'Review recent user feedback submissions and identify common themes and improvement opportunities.',
            NULL,
            false,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            'a4',
            NULL
        );
    END IF;

    RAISE NOTICE 'Seed data created successfully for user: %', test_user_email;
END $$;

