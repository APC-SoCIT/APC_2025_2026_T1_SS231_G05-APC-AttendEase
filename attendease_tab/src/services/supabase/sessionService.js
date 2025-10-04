import { supabase } from '../../config/supabase.config.js';

/**
 * Session Management Service
 * Handles class session CRUD operations
 */

/**
 * Start a new class session
 */
export async function startSession(courseId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        course_id: courseId,
        session_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        status: 'active'
      })
      .select('*, courses(*)')
      .single();

    if (error) throw error;
    
    console.log(`Session started for course: ${data.courses.course_code}`);
    return { success: true, session: data };
  } catch (error) {
    console.error('Error starting session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * End an active session
 */
export async function endSession(sessionId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', sessionId)
      .select('*, courses(*)')
      .single();

    if (error) throw error;
    
    console.log(`Session ended: ${sessionId}`);
    return { success: true, session: data };
  } catch (error) {
    console.error('Error ending session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active session for a course
 */
export async function getActiveSession(courseId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, courses(*)')
      .eq('course_id', courseId)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active session found
        return { success: true, session: null };
      }
      throw error;
    }
    
    return { success: true, session: data };
  } catch (error) {
    console.error('Error getting active session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get session by ID with full details
 */
export async function getSessionById(sessionId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        courses (*),
        attendance_records (
          *,
          users (*)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    
    return { success: true, session: data };
  } catch (error) {
    console.error('Error getting session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all sessions for a course (history)
 */
export async function getCourseSessionHistory(courseId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        courses (*),
        attendance_records (count)
      `)
      .eq('course_id', courseId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return { success: true, sessions: data };
  } catch (error) {
    console.error('Error getting session history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all completed sessions (all courses)
 */
export async function getAllCompletedSessions(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        courses (*)
      `)
      .eq('status', 'completed')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return { success: true, sessions: data };
  } catch (error) {
    console.error('Error getting completed sessions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId) {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
    
    console.log(`Session deleted: ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
}

export default {
  startSession,
  endSession,
  getActiveSession,
  getSessionById,
  getCourseSessionHistory,
  getAllCompletedSessions,
  deleteSession
};

