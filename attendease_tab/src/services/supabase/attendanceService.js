import { supabase } from '../../config/supabase.config.js';

/**
 * Attendance Management Service
 * Handles attendance record operations
 */

/**
 * Record attendance for a student (onsite or online)
 */
export async function recordAttendance(sessionId, studentId, type, metadata = {}) {
  try {
    const { data, error} = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        attendance_type: type, // 'onsite' or 'online'
        check_in_time: new Date().toISOString(),
        confidence_score: metadata.confidence || null,
        status: metadata.status || 'present',
        notes: metadata.notes || null
      })
      .select('*, users(*)')
      .single();

    if (error) throw error;
    
    console.log(`✅ Attendance recorded: ${data.users.full_name} - ${type}`);
    return { success: true, attendance: data };
  } catch (error) {
    console.error('❌ Error recording attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all attendance records for a session
 */
export async function getSessionAttendance(sessionId) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        users (*)
      `)
      .eq('session_id', sessionId)
      .order('check_in_time', { ascending: true });

    if (error) throw error;
    
    return { success: true, attendance: data };
  } catch (error) {
    console.error('❌ Error getting attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attendance records for a specific student across all sessions
 */
export async function getStudentAttendanceHistory(studentId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        sessions (
          *,
          courses (*)
        )
      `)
      .eq('student_id', studentId)
      .order('check_in_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return { success: true, attendance: data };
  } catch (error) {
    console.error('❌ Error getting student attendance history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if student already has attendance record for this session
 */
export async function checkAttendanceExists(sessionId, studentId) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id, attendance_type')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .limit(1);

    if (error) throw error;
    
    return { 
      success: true, 
      exists: data.length > 0,
      record: data[0] || null
    };
  } catch (error) {
    console.error('❌ Error checking attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update attendance record
 */
export async function updateAttendance(attendanceId, updates) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', attendanceId)
      .select('*, users(*)')
      .single();

    if (error) throw error;
    
    console.log(`✅ Attendance updated: ${attendanceId}`);
    return { success: true, attendance: data };
  } catch (error) {
    console.error('❌ Error updating attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(attendanceId) {
  try {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', attendanceId);

    if (error) throw error;
    
    console.log(`✅ Attendance deleted: ${attendanceId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attendance summary for a session
 */
export async function getSessionAttendanceSummary(sessionId) {
  try {
    // Get all attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*, users(*)')
      .eq('session_id', sessionId);

    if (attendanceError) throw attendanceError;

    // Get course enrollment count
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        courses (
          *,
          course_enrollments (count)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Calculate summary
    const totalEnrolled = session.courses.course_enrollments[0]?.count || 0;
    const totalPresent = attendance.length;
    const onsiteCount = attendance.filter(a => a.attendance_type === 'onsite').length;
    const onlineCount = attendance.filter(a => a.attendance_type === 'online').length;
    const absentCount = totalEnrolled - totalPresent;

    return {
      success: true,
      summary: {
        totalEnrolled,
        totalPresent,
        absentCount,
        onsiteCount,
        onlineCount,
        attendanceRate: totalEnrolled > 0 ? (totalPresent / totalEnrolled * 100).toFixed(2) : 0,
        attendance: attendance
      }
    };
  } catch (error) {
    console.error('❌ Error getting attendance summary:', error);
    return { success: false, error: error.message };
  }
}

export default {
  recordAttendance,
  getSessionAttendance,
  getStudentAttendanceHistory,
  checkAttendanceExists,
  updateAttendance,
  deleteAttendance,
  getSessionAttendanceSummary
};

