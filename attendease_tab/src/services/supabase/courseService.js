import { supabase } from '../../config/supabase.config.js';

/**
 * Course Management Service
 * Handles course and enrollment operations
 */

/**
 * Get all courses
 */
export async function getAllCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_professor_id_fkey (full_name, email),
        course_enrollments (count)
      `)
      .order('course_code', { ascending: true });

    if (error) throw error;
    
    return { success: true, courses: data };
  } catch (error) {
    console.error('❌ Error getting courses:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get courses for a specific professor
 */
export async function getProfessorCourses(professorId) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_enrollments (count)
      `)
      .eq('professor_id', professorId)
      .order('course_code', { ascending: true });

    if (error) throw error;
    
    return { success: true, courses: data };
  } catch (error) {
    console.error('❌ Error getting professor courses:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get course by ID with full details
 */
export async function getCourseById(courseId) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        users!courses_professor_id_fkey (full_name, email),
        course_enrollments (
          *,
          users (*)
        )
      `)
      .eq('id', courseId)
      .single();

    if (error) throw error;
    
    return { success: true, course: data };
  } catch (error) {
    console.error('❌ Error getting course:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new course
 */
export async function createCourse(courseData) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        course_code: courseData.code,
        course_name: courseData.name,
        section: courseData.section,
        professor_id: courseData.professorId,
        schedule: courseData.schedule || {}
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Course created: ${data.course_code}`);
    return { success: true, course: data };
  } catch (error) {
    console.error('❌ Error creating course:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update course
 */
export async function updateCourse(courseId, updates) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Course updated: ${courseId}`);
    return { success: true, course: data };
  } catch (error) {
    console.error('❌ Error updating course:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete course
 */
export async function deleteCourse(courseId) {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
    
    console.log(`✅ Course deleted: ${courseId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get students enrolled in a course
 */
export async function getCourseStudents(courseId) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        users (*)
      `)
      .eq('course_id', courseId);

    if (error) throw error;
    
    return { success: true, students: data.map(e => e.users) };
  } catch (error) {
    console.error('❌ Error getting course students:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enroll student in course
 */
export async function enrollStudent(courseId, studentId) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId
      })
      .select(`
        *,
        users (*),
        courses (*)
      `)
      .single();

    if (error) throw error;
    
    console.log(`✅ Student enrolled: ${data.users.full_name} in ${data.courses.course_code}`);
    return { success: true, enrollment: data };
  } catch (error) {
    console.error('❌ Error enrolling student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unenroll student from course
 */
export async function unenrollStudent(courseId, studentId) {
  try {
    const { error } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (error) throw error;
    
    console.log(`✅ Student unenrolled from course`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error unenrolling student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get courses a student is enrolled in
 */
export async function getStudentCourses(studentId) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        courses (
          *,
          users!courses_professor_id_fkey (full_name, email)
        )
      `)
      .eq('student_id', studentId);

    if (error) throw error;
    
    return { success: true, courses: data.map(e => e.courses) };
  } catch (error) {
    console.error('❌ Error getting student courses:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getAllCourses,
  getProfessorCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents,
  enrollStudent,
  unenrollStudent,
  getStudentCourses
};

