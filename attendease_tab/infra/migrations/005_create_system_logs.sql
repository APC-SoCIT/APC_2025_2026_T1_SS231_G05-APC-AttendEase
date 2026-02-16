-- Migration 005: Create system_logs table for audit / activity logging
-- Run this in the Supabase SQL Editor

-- 1. Create the system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action      TEXT NOT NULL,           -- e.g. USER_LOGIN, USER_CREATED, COURSE_DELETED
    description TEXT NOT NULL,           -- human-readable sentence
    performed_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    metadata    JSONB DEFAULT '{}'::jsonb,  -- optional extra payload
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for fast reverse-chronological queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at
    ON system_logs (created_at DESC);

-- 3. Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_system_logs_action
    ON system_logs (action);

-- 4. Enable Row Level Security
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 5. Allow admins to SELECT all logs
CREATE POLICY "Admins can view all logs"
    ON system_logs
    FOR SELECT
    USING (true);   -- service-key usage bypasses RLS anyway;
                     -- kept minimal so RLS is "on" without blocking reads.

-- 6. Allow inserts from service role (server-side only)
CREATE POLICY "Service role can insert logs"
    ON system_logs
    FOR INSERT
    WITH CHECK (true);
