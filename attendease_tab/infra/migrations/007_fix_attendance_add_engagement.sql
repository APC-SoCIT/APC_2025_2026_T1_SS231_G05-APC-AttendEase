-- Migration 007: Fix attendance_records and create engagement_logs
-- 1. Ensure attendance_records has proper session_id FK (UUID, not timestamp)
-- 2. Add any missing columns safely
-- 3. Create engagement_logs table for persisting real-time engagement data

-- ============================================================================
-- FIX attendance_records table
-- ============================================================================
-- If the table exists with a timestamp "session" column, we need to drop it
-- and add a proper session_id UUID FK column.
-- NOTE: Run this only if attendance_records already exists with wrong schema.
-- If starting fresh, the full CREATE TABLE below handles everything.

-- Drop the old column if it exists (safe — ignores if not present)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'session' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE attendance_records DROP COLUMN IF EXISTS session;
    END IF;
END $$;

-- Create attendance_records if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    attendance_type TEXT NOT NULL DEFAULT 'onsite' CHECK (attendance_type IN ('onsite', 'online')),
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    confidence_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'unknown')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely add all potentially missing columns for existing tables
DO $$
BEGIN
    -- session_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'session_id'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE CASCADE;
    END IF;

    -- attendance_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'attendance_type'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN attendance_type TEXT NOT NULL DEFAULT 'onsite';
    END IF;

    -- check_in_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'check_in_time'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN check_in_time TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- confidence_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'confidence_score'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN confidence_score NUMERIC;
    END IF;

    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'status'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN status TEXT NOT NULL DEFAULT 'present';
    END IF;

    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'notes'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN notes TEXT;
    END IF;

    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- Indexes for attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance_records(attendance_type);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON attendance_records(check_in_time);

-- ============================================================================
-- CREATE engagement_logs table
-- ============================================================================
-- Stores per-student engagement events captured during facial recognition
-- Events: hand_raised, sleeping, speaking, disengaged, engaged

CREATE TABLE IF NOT EXISTS engagement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('hand_raised', 'sleeping', 'speaking', 'disengaged', 'engaged')),
    engagement_score NUMERIC,
    duration_seconds NUMERIC,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for engagement_logs
CREATE INDEX IF NOT EXISTS idx_engagement_session_id ON engagement_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_student_id ON engagement_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_engagement_event_type ON engagement_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_timestamp ON engagement_logs(timestamp);

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for attendance_records (drop first to avoid "already exists" errors)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Attendance records viewable by authenticated users" ON attendance_records;
    DROP POLICY IF EXISTS "Attendance records insertable by authenticated users" ON attendance_records;
    DROP POLICY IF EXISTS "Attendance records updatable by authenticated users" ON attendance_records;
    DROP POLICY IF EXISTS "Attendance records deletable by authenticated users" ON attendance_records;
END $$;
CREATE POLICY "Attendance records viewable by authenticated users"
    ON attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Attendance records insertable by authenticated users"
    ON attendance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Attendance records updatable by authenticated users"
    ON attendance_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Attendance records deletable by authenticated users"
    ON attendance_records FOR DELETE TO authenticated USING (true);

-- RLS policies for engagement_logs
CREATE POLICY "Engagement logs viewable by authenticated users"
    ON engagement_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Engagement logs insertable by authenticated users"
    ON engagement_logs FOR INSERT TO authenticated WITH CHECK (true);
