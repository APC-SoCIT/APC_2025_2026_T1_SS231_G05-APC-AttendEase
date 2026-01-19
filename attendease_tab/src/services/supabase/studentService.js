import { supabase } from '../../config/supabase.config.js';

/**
 * Student Management Service
 * Handles student profile operations interacting with 'user_profiles' table
 */

/**
 * Get student by email
 * Used for login and profile retrieval
 * @param {string} email 
 */
export async function getStudentByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      // If error is "PGRST116" (JSON object requested, multiple (or no) rows returned), it means not found
      if (error.code === 'PGRST116') {
        return { success: true, student: null }; 
      }
      throw error;
    }
    
    return { success: true, student: data };
  } catch (error) {
    console.error('❌ Error getting student by email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get student by UUID
 * @param {string} id 
 */
export async function getStudentById(id) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error) throw error;
    
    return { success: true, student: data };
  } catch (error) {
    console.error('❌ Error getting student by ID:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new student profile
 * @param {Object} studentData 
 */
export async function createStudent(studentData) {
  try {
    // Check if email already exists
    const existing = await getStudentByEmail(studentData.email);
    if (existing.success && existing.student) {
      return { success: false, error: 'Student with this email already exists' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        email: studentData.email,
        student_number: studentData.studentNumber,
        section: studentData.section,
        program: studentData.program, // 'course' in frontend, 'program' in DB
        role: 'Student',
        photo_url: studentData.photoUrl || null
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Student created: ${data.email}`);
    return { success: true, student: data };
  } catch (error) {
    console.error('❌ Error creating student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update student profile
 * @param {string} id - UUID
 * @param {Object} updates 
 */
export async function updateStudent(id, updates) {
  try {
    // Map frontend camelCase to DB snake_case if needed
    const dbUpdates = {};
    if (updates.firstName) dbUpdates.first_name = updates.firstName;
    if (updates.lastName) dbUpdates.last_name = updates.lastName;
    if (updates.studentNumber) dbUpdates.student_number = updates.studentNumber;
    if (updates.section) dbUpdates.section = updates.section;
    if (updates.program) dbUpdates.program = updates.program; // course -> program
    if (updates.course) dbUpdates.program = updates.course;   // handle both
    if (updates.photoUrl) dbUpdates.photo_url = updates.photoUrl;
    if (updates.email) dbUpdates.email = updates.email;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('user_id', id)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Student updated: ${id}`);
    return { success: true, student: data };
  } catch (error) {
    console.error('❌ Error updating student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete student
 * @param {string} id 
 */
export async function deleteStudent(id) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', id);

    if (error) throw error;
    
    console.log(`✅ Student deleted: ${id}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all students (for admin)
 */
export async function getAllStudents() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'Student')
      .order('last_name', { ascending: true });

    if (error) throw error;
    
    return { success: true, students: data };
  } catch (error) {
    console.error('❌ Error getting all students:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getStudentByEmail,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getAllStudents
};

