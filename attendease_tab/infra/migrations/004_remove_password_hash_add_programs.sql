-- Migration 004: Remove password_hash, add id_number, create programs table
-- Date: 2026-02-12
-- Description:
--   1. Drop password_hash column from user_profiles
--   2. Add id_number column to user_profiles (for professor/admin ID numbers)
--   3. Create programs reference table
--   4. Add program_id FK to user_profiles (replacing free-text program column)
--   5. Seed programs with initial data

-- ============================================================================
-- STEP 1: Remove password_hash from user_profiles
-- ============================================================================
ALTER TABLE user_profiles DROP COLUMN IF EXISTS password_hash;

-- ============================================================================
-- STEP 2: Add id_number column for professor/admin identification
-- ============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS id_number TEXT;

-- ============================================================================
-- STEP 3: Create programs reference table
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Seed programs with initial data
-- ============================================================================
INSERT INTO programs (name, abbreviation) VALUES
    ('Bachelor of Science in Computer Science With Specialization in Software Systems', 'BSCS-SS'),
    ('Bachelor of Science in Computer Science With Specialization in Cyber Security & Forensics', 'BSCS-CF'),
    ('Bachelor of Science in Computer Engineering', 'BSCpE'),
    ('Bachelor of Science in Electronics Engineering', 'BSEE'),
    ('Bachelor of Science in Industrial Engineering', 'BSIE'),
    ('Bachelor of Science in Accountancy', 'BSA'),
    ('Bachelor of Science in Business Administration', 'BSBA'),
    ('Bachelor of Science in Finance Management', 'BSFM'),
    ('Bachelor of Science in Tourism Management', 'BSTM'),
    ('Bachelor of Science in Management Accounting', 'BSMA'),
    ('Bachelor of Multimedia Arts', 'BMMA'),
    ('Bachelor of Arts in Psychology', 'BAPSY'),
    ('Bachelor of Science in Architecture', 'BSArch')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 5: Add program_id FK to user_profiles
-- ============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: Migrate existing free-text program data to program_id
-- (Best effort: match existing text values against program names or abbreviations)
-- ============================================================================
UPDATE user_profiles
SET program_id = p.id
FROM programs p
WHERE user_profiles.program IS NOT NULL
  AND (
    LOWER(user_profiles.program) = LOWER(p.name)
    OR LOWER(user_profiles.program) = LOWER(p.abbreviation)
  );

-- ============================================================================
-- STEP 7: Drop the old free-text program column
-- ============================================================================
ALTER TABLE user_profiles DROP COLUMN IF EXISTS program;

-- ============================================================================
-- STEP 8: Enable RLS on programs table
-- ============================================================================
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage programs"
ON programs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'Admin'::user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'Admin'::user_role
    )
);

-- All authenticated users can view programs
CREATE POLICY "Authenticated users can view programs"
ON programs
FOR SELECT
TO authenticated
USING (true);
