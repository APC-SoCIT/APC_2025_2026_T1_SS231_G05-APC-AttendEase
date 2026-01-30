-- ============================================================================
-- MIGRATION: Refactor AttendEase Relationships
-- Description: Fix course schedules, link students to sections, add admin RLS
-- Created: 2026-01-27
-- ============================================================================

-- Backup reminder
-- IMPORTANT: Always backup your database before running migrations!
-- Run: pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

BEGIN;

-- ============================================================================
-- TASK 1: FIX COURSE SCHEDULES RELATIONSHIPS
-- ============================================================================

-- Drop the existing course_schedules table completely
DROP TABLE IF EXISTS course_schedules CASCADE;

-- Recreate course_schedules table with proper structure
CREATE TABLE course_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  room_number TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_course_schedules_course_id ON course_schedules(course_id);
CREATE INDEX idx_course_schedules_section_id ON course_schedules(section_id);

-- Add comments for documentation
COMMENT ON TABLE course_schedules IS 'Course schedules with foreign keys to courses and sections';
COMMENT ON COLUMN course_schedules.course_id IS 'Foreign key to courses table';
COMMENT ON COLUMN course_schedules.section_id IS 'Foreign key to sections table';
COMMENT ON COLUMN course_schedules.room_number IS 'Manually entered room number';
COMMENT ON COLUMN course_schedules.schedule IS 'Manually entered schedule information';

-- Enable Row Level Security
ALTER TABLE course_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow SELECT for authenticated users
CREATE POLICY "course_schedules_select_authenticated" ON course_schedules
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow INSERT/UPDATE/DELETE for admins only
CREATE POLICY "course_schedules_modify_admin" ON course_schedules
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

-- ============================================================================
-- TASK 2: LINK STUDENTS TO SECTIONS
-- ============================================================================

-- Check if section column exists and migrate data if it does
DO $$
BEGIN
  -- Only proceed with data migration if the section column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'section'
  ) THEN
    -- Step 1: Populate sections table from existing user_profiles.section data
    INSERT INTO sections (name)
    SELECT DISTINCT section
    FROM user_profiles
    WHERE section IS NOT NULL 
      AND section != ''
    ON CONFLICT (name) DO NOTHING;
    
    -- Step 2: Add section_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'section_id'
    ) THEN
      ALTER TABLE user_profiles ADD COLUMN section_id UUID;
    END IF;
    
    -- Step 3: Migrate data - link user_profiles to sections
    UPDATE user_profiles up
    SET section_id = s.id
    FROM sections s
    WHERE up.section = s.name
      AND up.section IS NOT NULL
      AND up.section != '';
    
    -- Step 4: Drop the old section text column
    ALTER TABLE user_profiles DROP COLUMN section CASCADE;
  ELSE
    -- If section column doesn't exist, just ensure section_id column exists
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'section_id'
    ) THEN
      ALTER TABLE user_profiles ADD COLUMN section_id UUID;
    END IF;
  END IF;
END $$;

-- Step 5: Create Foreign Key constraint (drop first if exists)
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_section_id_fkey;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_section_id_fkey 
  FOREIGN KEY (section_id) 
  REFERENCES sections(id) 
  ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_section_id 
  ON user_profiles(section_id);

COMMENT ON COLUMN user_profiles.section_id IS 'Foreign key to sections table';

-- ============================================================================
-- TASK 3: ADMIN POLICIES (RLS)
-- ============================================================================

-- Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if they exist (idempotent)
DROP POLICY IF EXISTS "admin_select_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_insert_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_delete_user_profiles" ON user_profiles;

-- Policy 1: Allow admins to SELECT (view) all user profiles
CREATE POLICY "admin_select_user_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'Admin'::user_role
    )
  );

-- Policy 2: Allow admins to INSERT new user profiles
CREATE POLICY "admin_insert_user_profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'Admin'::user_role
    )
  );

-- Policy 3: Allow admins to UPDATE any user profile
CREATE POLICY "admin_update_user_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'Admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'Admin'::user_role
    )
  );

-- Policy 4: Allow admins to DELETE any user profile
CREATE POLICY "admin_delete_user_profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'Admin'::user_role
    )
  );

-- Optional: Add policies for users to view/update their own profiles
DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;

CREATE POLICY "users_select_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- Verify course_schedules structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'course_schedules'
-- ORDER BY ordinal_position;

-- Verify user_profiles structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- ORDER BY ordinal_position;

-- Verify RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'user_profiles';

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (Save separately for emergencies)
-- ============================================================================

-- BEGIN;
-- ALTER TABLE course_schedules DROP CONSTRAINT IF EXISTS course_schedules_course_id_fkey;
-- ALTER TABLE course_schedules DROP CONSTRAINT IF EXISTS course_schedules_section_id_fkey;
-- ALTER TABLE course_schedules DROP COLUMN IF EXISTS section_id;
-- ALTER TABLE course_schedules RENAME COLUMN course_id TO course_name;
-- 
-- ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_section_id_fkey;
-- ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS section TEXT;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS section_id;
-- 
-- DROP POLICY IF EXISTS "admin_select_user_profiles" ON user_profiles;
-- DROP POLICY IF EXISTS "admin_update_user_profiles" ON user_profiles;
-- DROP POLICY IF EXISTS "admin_delete_user_profiles" ON user_profiles;
-- DROP POLICY IF EXISTS "users_select_own_profile" ON user_profiles;
-- DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
-- COMMIT;
