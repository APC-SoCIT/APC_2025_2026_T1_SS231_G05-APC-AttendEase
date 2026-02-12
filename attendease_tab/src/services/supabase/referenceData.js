// Supabase Service: Reference Data Management (Courses and Sections)
// Purpose: CRUD operations for system reference tables with error handling

import { supabase } from '../../config/supabase.config.js';

// ============================================================================
// COURSES SERVICE
// ============================================================================

/**
 * Fetch all courses
 * @returns {Promise<Object>} { success: boolean, data: Array, error: string }
 */
export async function fetchCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('course_code', { ascending: true });

    if (error) {
      console.error('❌ Error fetching courses:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Courses fetched successfully:', data?.length || 0, 'records');
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('❌ Unexpected error in fetchCourses:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Create a new course
 * @param {Object} courseData - { course_code, description, units, is_laboratory }
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function createCourse(courseData) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating course:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Course created successfully:', data?.course_code);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in createCourse:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Update an existing course
 * @param {string} courseId - UUID of the course
 * @param {Object} courseData - { course_code, description, units, is_laboratory }
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function updateCourse(courseId, courseData) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating course:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Course updated successfully:', data?.course_code);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in updateCourse:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Delete a course
 * @param {string} courseId - UUID of the course
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function deleteCourse(courseId) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting course:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Course deleted successfully:', data?.course_code);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in deleteCourse:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================================================
// SECTIONS SERVICE
// ============================================================================

/**
 * Fetch all sections
 * @returns {Promise<Object>} { success: boolean, data: Array, error: string }
 */
export async function fetchSections() {
  try {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching sections:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Sections fetched successfully:', data?.length || 0, 'records');
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('❌ Unexpected error in fetchSections:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Create a new section
 * @param {Object} sectionData - { name }
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function createSection(sectionData) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .insert([sectionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating section:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Section created successfully:', data?.name);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in createSection:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Update an existing section
 * @param {string} sectionId - UUID of the section
 * @param {Object} sectionData - { name }
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function updateSection(sectionId, sectionData) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .update(sectionData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating section:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Section updated successfully:', data?.name);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in updateSection:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Delete a section
 * @param {string} sectionId - UUID of the section
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function deleteSection(sectionId) {
  try {
    const { data, error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting section:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Section deleted successfully:', data?.name);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in deleteSection:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================================================
// PROGRAMS SERVICE
// ============================================================================

/**
 * Fetch all programs
 * @returns {Promise<Object>} { success: boolean, data: Array, error: string }
 */
export async function fetchPrograms() {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('abbreviation', { ascending: true });

    if (error) {
      console.error('❌ Error fetching programs:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Programs fetched successfully:', data?.length || 0, 'records');
    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('❌ Unexpected error in fetchPrograms:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Create a new program
 * @param {Object} programData - { name, abbreviation }
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function createProgram(programData) {
  try {
    const { data, error } = await supabase
      .from('programs')
      .insert([programData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating program:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Program created successfully:', data?.abbreviation);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in createProgram:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Update an existing program
 * @param {string} programId - UUID of the program
 * @param {Object} programData - { name, abbreviation }
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function updateProgram(programId, programData) {
  try {
    const { data, error } = await supabase
      .from('programs')
      .update(programData)
      .eq('id', programId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating program:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Program updated successfully:', data?.abbreviation);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in updateProgram:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Delete a program
 * @param {string} programId - UUID of the program
 * @returns {Promise<Object>} { success: boolean, data: Object, error: string }
 */
export async function deleteProgram(programId) {
  try {
    const { data, error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting program:', error.message);
      return { success: false, data: null, error: error.message };
    }

    console.log('✅ Program deleted successfully:', data?.abbreviation);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in deleteProgram:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================
export default {
  // Courses
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  // Sections
  fetchSections,
  createSection,
  updateSection,
  deleteSection,
  // Programs
  fetchPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
};
