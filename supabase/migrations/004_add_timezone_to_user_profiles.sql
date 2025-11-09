-- Migration: 004_add_timezone_to_user_profiles.sql
-- Description: Add timezone column to user_profiles table for user timezone preference
-- Date: 2025-01-XX

-- Add timezone column to user_profiles
-- Stores IANA timezone identifier (e.g., "America/New_York", "Europe/London")
-- NULL means user hasn't set a preference, will use browser timezone
ALTER TABLE user_profiles
ADD COLUMN timezone TEXT;

-- Add comment explaining timezone storage
COMMENT ON COLUMN user_profiles.timezone IS 'IANA timezone identifier for user preference (e.g., "America/New_York"). NULL means use browser timezone.';

