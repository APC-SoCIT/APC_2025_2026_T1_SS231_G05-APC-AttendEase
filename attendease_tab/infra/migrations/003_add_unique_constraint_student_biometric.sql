-- Migration: Add UNIQUE constraint to student_biometric_data.student_id
-- Purpose: Enforce one-to-one relationship between students and biometric data
-- Date: 2026-02-05

-- Add UNIQUE constraint to prevent duplicate biometric enrollments per student
ALTER TABLE student_biometric_data 
ADD CONSTRAINT unique_student_biometric_enrollment 
UNIQUE (student_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_student_biometric_enrollment ON student_biometric_data 
IS 'Ensures each student can have only one biometric enrollment record';
