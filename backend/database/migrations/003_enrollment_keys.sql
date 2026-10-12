-- ============================================================================
-- Migration 003: Course Enrollment Keys (Moodle-Style Self-Enrollment)
-- Safe, additive migration: adds enrollment_key_hash and requires_enrollment_key
-- ============================================================================

-- Add requires_enrollment_key flag (default false)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS requires_enrollment_key BOOLEAN NOT NULL DEFAULT FALSE;

-- Add enrollment_key_hash (nullable text storing bcrypt hash of enrollment key)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS enrollment_key_hash TEXT NULL;

-- Index for fast lookup/filtering if needed
CREATE INDEX IF NOT EXISTS idx_courses_requires_key ON courses(requires_enrollment_key);
