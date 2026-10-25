-- ============================================================================
-- Migration 004: Course Enrollment Keys
-- Safe, additive migration: adds enrollment_key column to courses table
-- ============================================================================

-- Add enrollment_key column if it does not already exist
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS enrollment_key VARCHAR(100) NULL;

-- Ensure requires_enrollment_key column exists and defaults to TRUE
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS requires_enrollment_key BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE courses 
ALTER COLUMN requires_enrollment_key SET DEFAULT TRUE;

-- Add index on enrollment_key for fast querying
CREATE INDEX IF NOT EXISTS idx_courses_enrollment_key ON courses(enrollment_key);
