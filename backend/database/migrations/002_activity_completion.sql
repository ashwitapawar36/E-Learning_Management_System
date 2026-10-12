-- =============================================================================
-- Migration 002: Activity Completion, Capacity, Deadline & Grade-Release
-- Safe, additive migration. Preserves all existing tables and rows.
-- =============================================================================

BEGIN;

-- 1. Create activity_completions table to track student activity completion
CREATE TABLE IF NOT EXISTS activity_completions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('material', 'assignment')),
    activity_id INT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completion_source VARCHAR(50) DEFAULT 'view',
    CONSTRAINT unique_student_activity UNIQUE (student_id, course_id, activity_type, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_completions_student_course 
  ON activity_completions(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_activity_completions_activity 
  ON activity_completions(activity_type, activity_id);

-- 2. Add course capacity and enrollment deadline to courses table
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS max_capacity INT DEFAULT 50 CHECK (max_capacity > 0),
  ADD COLUMN IF NOT EXISTS enrollment_deadline TIMESTAMPTZ;

-- Set default capacity and deadlines for existing courses if not set
UPDATE courses 
SET max_capacity = 60,
    enrollment_deadline = CURRENT_TIMESTAMP + INTERVAL '30 days'
WHERE max_capacity IS NULL OR enrollment_deadline IS NULL;

-- 3. Add grade release status to assignments table
ALTER TABLE assignments 
  ADD COLUMN IF NOT EXISTS grades_released BOOLEAN DEFAULT TRUE;

-- 4. Backfill activity completion for existing student submissions
INSERT INTO activity_completions (student_id, course_id, activity_type, activity_id, completion_source, completed_at)
SELECT 
    s.student_id,
    a.course_id,
    'assignment',
    s.assignment_id,
    'submission',
    s.submitted_at
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
ON CONFLICT (student_id, course_id, activity_type, activity_id) DO NOTHING;

-- 5. Mark first material of Module 1 as completed for student Riddhi (demo parity)
INSERT INTO activity_completions (student_id, course_id, activity_type, activity_id, completion_source)
SELECT 3, 1, 'material', 1, 'view'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 3) 
  AND EXISTS (SELECT 1 FROM course_materials WHERE id = 1)
ON CONFLICT (student_id, course_id, activity_type, activity_id) DO NOTHING;

COMMIT;
