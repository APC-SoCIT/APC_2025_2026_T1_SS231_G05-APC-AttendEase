import { supabase } from '../../config/supabase.config.js';

/**
 * Session Management Service
 * Handles class session CRUD operations
 */

// Ensure the course_schedule_id column exists (runs once)
let _columnEnsured = false;
async function ensureScheduleColumn() {
  if (_columnEnsured || !supabase) return;
  try {
    await supabase.rpc('exec_sql', {
      query: `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS course_schedule_id UUID REFERENCES course_schedules(id)`
    }).maybeSingle();
  } catch (e) {
    // RPC may not exist; try a direct approach — insert with the column and see if it works
    console.debug('ensureScheduleColumn: RPC not available, will try column on first insert');
  }
  _columnEnsured = true;
}

/**
 * Start a new class session
 * @param {string} courseId - UUID of the course
 * @param {string} [courseScheduleId] - UUID of the specific course_schedule entry
 */
export async function startSession(courseId, courseScheduleId = null) {
  try {
    await ensureScheduleColumn();

    const insertPayload = {
      course_id: courseId,
      session_date: new Date().toISOString().split('T')[0],
      start_time: new Date().toISOString(),
      status: 'active'
    };

    // Try inserting with course_schedule_id first
    if (courseScheduleId) {
      insertPayload.course_schedule_id = courseScheduleId;
    }

    let { data, error } = await supabase
      .from('sessions')
      .insert(insertPayload)
      .select('*, courses(*)')
      .single();

    // If the column doesn't exist yet, retry without it
    if (error && courseScheduleId && error.message?.includes('course_schedule_id')) {
      console.warn('course_schedule_id column not found, inserting without it');
      delete insertPayload.course_schedule_id;
      const retry = await supabase
        .from('sessions')
        .insert(insertPayload)
        .select('*, courses(*)')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    console.log(`Session started for course: ${data.courses?.course_code || courseId}`);
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
 * Get sessions for a specific schedule (by course_schedule_id)
 * Falls back to course_id filtering if the column doesn't exist
 */
export async function getScheduleSessionHistory(courseScheduleId, courseId, limit = 50) {
  try {
    // Try filtering by course_schedule_id first
    let { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        courses (*),
        attendance_records (count)
      `)
      .eq('course_schedule_id', courseScheduleId)
      .order('start_time', { ascending: false })
      .limit(limit);

    // If the column doesn't exist, fall back to course_id
    if (error && error.message?.includes('course_schedule_id')) {
      console.warn('course_schedule_id column not found, falling back to course_id');
      const fallback = await supabase
        .from('sessions')
        .select(`
          *,
          courses (*),
          attendance_records (count)
        `)
        .eq('course_id', courseId)
        .order('start_time', { ascending: false })
        .limit(limit);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return { success: true, sessions: data };
  } catch (error) {
    console.error('Error getting schedule session history:', error);
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
  getScheduleSessionHistory,
  getAllCompletedSessions,
  deleteSession
};
