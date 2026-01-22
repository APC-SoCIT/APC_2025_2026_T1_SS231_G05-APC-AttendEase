-- Migration: Create System Reference Data Tables (Courses and Sections)
-- Purpose: Create public.courses and public.sections tables for system reference data
-- Date: 2026-01-22

-- ============================================================================
-- 1. CREATE COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  description TEXT,
  units INTEGER DEFAULT 3,
  is_laboratory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on course_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON public.courses(course_code);

-- ============================================================================
-- 2. CREATE SECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_sections_name ON public.sections(name);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON COURSES
-- ============================================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT for all authenticated users
CREATE POLICY "courses_select_authenticated" ON public.courses
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 2: Allow INSERT for Admins only
CREATE POLICY "courses_insert_admin" ON public.courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  );

-- Policy 3: Allow UPDATE for Admins only
CREATE POLICY "courses_update_admin" ON public.courses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  );

-- Policy 4: Allow DELETE for Admins only
CREATE POLICY "courses_delete_admin" ON public.courses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  );

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS) ON SECTIONS
-- ============================================================================
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT for all authenticated users
CREATE POLICY "sections_select_authenticated" ON public.sections
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 2: Allow INSERT for Admins only
CREATE POLICY "sections_insert_admin" ON public.sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  );

-- Policy 3: Allow UPDATE for Admins only
CREATE POLICY "sections_update_admin" ON public.sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  );

-- Policy 4: Allow DELETE for Admins only
CREATE POLICY "sections_delete_admin" ON public.sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
        AND role = 'Admin'::user_role
    )
  );

-- ============================================================================
-- End of Migration
-- ============================================================================
-- Note: Execute this migration in Supabase SQL Editor to apply schema changes
-- After execution, verify RLS policies are active using:
-- SELECT * FROM pg_policies WHERE tablename IN ('courses', 'sections');
