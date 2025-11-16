-- ============================================================================
-- Migration: Create rebalance_tasks stored procedure
-- ============================================================================
-- This migration creates a PL/pgSQL stored procedure that atomically updates
-- multiple task positions in a single transaction, with proper authorization
-- checks and error handling.
--
-- Purpose: Replace N+1 queries with atomic transaction for drag-and-drop rebalancing
-- Date: 2025-11-16

-- ============================================================================
-- FUNCTION: Rebalance Tasks (Atomic Position Updates)
-- ============================================================================

CREATE OR REPLACE FUNCTION rebalance_tasks(
    p_user_id UUID,
    p_updates JSONB
)
RETURNS TABLE(
    task_id UUID,
    success BOOLEAN,
    error_message TEXT
)
SECURITY DEFINER  -- Runs with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    update_record JSONB;
    task_uuid UUID;
    task_user_id UUID;
    new_pos TEXT;
BEGIN
    -- Validate that p_updates is an array
    IF jsonb_typeof(p_updates) != 'array' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Invalid updates format: expected array';
        RETURN;
    END IF;

    -- Validate that array is not empty
    IF jsonb_array_length(p_updates) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'No updates provided';
        RETURN;
    END IF;

    -- Loop through updates to verify ownership and lock rows
    FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
    LOOP
        -- Extract taskId and newPosition from JSONB
        task_uuid := (update_record->>'taskId')::UUID;
        new_pos := update_record->>'newPosition';

        -- Validate required fields exist
        IF task_uuid IS NULL OR new_pos IS NULL THEN
            RETURN QUERY SELECT 
                task_uuid, 
                FALSE, 
                'Missing taskId or newPosition in update';
            RETURN;
        END IF;

        -- Lock and verify task ownership
        SELECT user_id INTO task_user_id
        FROM tasks
        WHERE id = task_uuid
        FOR UPDATE;

        -- Check if task exists
        IF NOT FOUND THEN
            RETURN QUERY SELECT 
                task_uuid, 
                FALSE, 
                'Task not found';
            RETURN;
        END IF;

        -- Check ownership
        IF task_user_id != p_user_id THEN
            RETURN QUERY SELECT 
                task_uuid, 
                FALSE, 
                'Unauthorized: task does not belong to user';
            RETURN;
        END IF;
    END LOOP;

    -- All checks passed, perform updates
    FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
    LOOP
        task_uuid := (update_record->>'taskId')::UUID;
        new_pos := update_record->>'newPosition';

        -- Update the task position
        UPDATE tasks
        SET position = new_pos
        WHERE id = task_uuid;

        -- Return success for this task
        RETURN QUERY SELECT task_uuid, TRUE, NULL::TEXT;
    END LOOP;

    -- Transaction will commit automatically if no errors
END;
$$;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION rebalance_tasks(UUID, JSONB) IS 
    'Atomically updates multiple task positions in a single transaction.
    
    Parameters:
    - p_user_id: UUID of the user performing the operation
    - p_updates: JSONB array of {taskId: UUID, newPosition: TEXT} objects
    
    Returns:
    - Table with columns: task_id, success, error_message
    - Each row represents the result of updating one task
    - If any authorization check fails, transaction is rolled back
    - Uses SELECT ... FOR UPDATE to prevent concurrent modification conflicts
    
    Security:
    - SECURITY DEFINER bypasses RLS for performance
    - Authorization checked explicitly server-side in function
    - All tasks must belong to p_user_id or transaction fails
    
    Error Handling:
    - Returns error row on invalid input
    - Returns error row on task not found
    - Returns error row on unauthorized access
    - PostgreSQL automatically rolls back on errors
    - Serialization conflicts (SQLSTATE 40001) are surfaced to caller';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify function was created successfully
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'rebalance_tasks'
    ) THEN
        RAISE EXCEPTION 'Function rebalance_tasks was not created';
    END IF;
    
    RAISE NOTICE 'Function rebalance_tasks created successfully';
END $$;

