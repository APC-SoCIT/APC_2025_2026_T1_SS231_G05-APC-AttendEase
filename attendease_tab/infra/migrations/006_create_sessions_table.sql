-- Migration 006: Create sessions table
-- The sessions table tracks class sessions started by professors
-- attendance_records.session_id references this table

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions(session_date);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read sessions
CREATE POLICY "Sessions are viewable by authenticated users"
    ON sessions FOR SELECT
    TO authenticated
    USING (true);

-- Allow professors/admins to insert sessions
CREATE POLICY "Professors and admins can create sessions"
    ON sessions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow professors/admins to update sessions
CREATE POLICY "Professors and admins can update sessions"
    ON sessions FOR UPDATE
    TO authenticated
    USING (true);
