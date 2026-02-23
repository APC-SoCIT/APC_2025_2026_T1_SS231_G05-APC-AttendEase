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
    const { data, error } = await supabase
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
    const onsiteCount = attendance.filter(a => (a.status || '').toLowerCase() === 'onsite').length;
    const onlineCount = attendance.filter(a => (a.status || '').toLowerCase() === 'online').length;
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
  getSessionAttendanceSummary,
  getAllAttendanceRecords,
  getAttendanceStats,
  getAttendanceTrend,
  getCourseAttendanceReport,
  getStudentAttendanceReport,
  getStudentsWithAttendance,
  getAttendanceForExport,
};

// ============================================================================
// REPORT QUERIES
// ============================================================================

/**
 * Get all attendance records with filters (paginated)
 * @param {Object} filters - { startDate, endDate, courseId, status, mode, search, page, pageSize }
 */
export async function getAllAttendanceRecords(filters = {}) {
  try {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        user_profiles!attendance_records_student_id_fkey(first_name, last_name, student_number, email),
        sessions!attendance_records_session_id_fkey(
          id, session_date, start_time, end_time, status,
          courses(id, course_code, description)
        )
      `, { count: 'exact' })
      .order('check_in_time', { ascending: false })
      .range(from, to);

    // Apply filters via session subquery when needed
    if (filters.startDate) {
      query = query.gte('check_in_time', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('check_in_time', filters.endDate);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.mode && filters.mode !== 'all') {
      // UI refers to onsite/online as mode, DB uses status
      query = query.eq('status', filters.mode);
    }
    if (filters.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Client-side course filter (PostgREST can't filter nested joins easily)
    let records = data || [];
    if (filters.courseId && filters.courseId !== 'all') {
      records = records.filter(r => r.sessions?.courses?.id === filters.courseId);
    }

    // Client-side search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(r => {
        const name = `${r.user_profiles?.first_name || ''} ${r.user_profiles?.last_name || ''}`.toLowerCase();
        const code = (r.sessions?.courses?.course_code || '').toLowerCase();
        const num = (r.user_profiles?.student_number || '').toLowerCase();
        return name.includes(q) || code.includes(q) || num.includes(q);
      });
    }

    return { success: true, data: records, count, error: null };
  } catch (err) {
    console.error('❌ Error in getAllAttendanceRecords:', err.message);
    return { success: false, data: null, count: 0, error: err.message };
  }
}

/**
 * Get aggregate attendance statistics with filters
 */
export async function getAttendanceStats(filters = {}) {
  try {
    let query = supabase
      .from('attendance_records')
      .select('status, session_id, check_in_time');

    if (filters.startDate) query = query.gte('check_in_time', filters.startDate);
    if (filters.endDate) query = query.lte('check_in_time', filters.endDate);
    if (filters.sessionId) query = query.eq('session_id', filters.sessionId);

    const { data, error } = await query;
    if (error) throw error;

    const records = data || [];
    const totalRecords = records.length;
    const presentCount = records.length; // Every record is a present student
    const absentCount = 0; // Cannot calculate without course enrollments
    const onsiteCount = records.filter(r => (r.status || '').toLowerCase() === 'onsite').length;
    const onlineCount = records.filter(r => (r.status || '').toLowerCase() === 'online').length;
    const uniqueSessions = [...new Set(records.map(r => r.session_id))].length;
    const attendanceRate = totalRecords > 0
      ? 100 // We don't have absent, so this metric is less meaningful
      : 0;


    // Latest session date
    let latestSession = null;
    if (records.length > 0) {
      const sorted = records.sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));
      latestSession = sorted[0].check_in_time;
    }

    return {
      success: true,
      data: {
        totalSessions: uniqueSessions,
        totalRecords,
        presentCount,
        absentCount,
        onsiteCount,
        onlineCount,
        attendanceRate,
        latestSession,
      },
      error: null,
    };
  } catch (err) {
    console.error('❌ Error in getAttendanceStats:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get daily attendance trend data for charts
 */
export async function getAttendanceTrend(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('attendance_records')
      .select('status, check_in_time')
      .gte('check_in_time', startDate.toISOString())
      .order('check_in_time', { ascending: true });

    if (error) throw error;

    // Group by date
    const dailyStats = {};
    (data || []).forEach(record => {
      const dateKey = new Date(record.check_in_time).toLocaleDateString();
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { date: dateKey, present: 0, onsite: 0, online: 0 };
      }
      dailyStats[dateKey].present++;
      if ((record.status || '').toLowerCase() === 'onsite') dailyStats[dateKey].onsite++;
      else if ((record.status || '').toLowerCase() === 'online') dailyStats[dateKey].online++;
    });

    return { success: true, data: Object.values(dailyStats), error: null };
  } catch (err) {
    console.error('❌ Error in getAttendanceTrend:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get attendance report for a specific course
 */
export async function getCourseAttendanceReport(courseId) {
  try {
    // Get all sessions for this course
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, session_date, start_time, end_time, status')
      .eq('course_id', courseId)
      .order('session_date', { ascending: false });

    if (sessErr) throw sessErr;

    if (!sessions || sessions.length === 0) {
      return { success: true, data: { sessions: [], totals: null }, error: null };
    }

    const sessionIds = sessions.map(s => s.id);

    // Get all attendance records for these sessions
    const { data: records, error: recErr } = await supabase
      .from('attendance_records')
      .select('session_id, student_id, status')
      .in('session_id', sessionIds);

    if (recErr) throw recErr;

    const allRecords = records || [];

    // Per-session breakdown
    const sessionBreakdown = sessions.map(session => {
      const sRecords = allRecords.filter(r => r.session_id === session.id);
      const present = sRecords.length;
      const onsite = sRecords.filter(r => (r.status || '').toLowerCase() === 'onsite').length;
      const online = sRecords.filter(r => (r.status || '').toLowerCase() === 'online').length;

      return {
        session_id: session.id,
        session_date: session.session_date,
        start_time: session.start_time,
        status: session.status,
        totalRecords: present,
        present,
        onsite,
        online,
      };
    });

    // Course totals
    const totalPresent = allRecords.length;
    const uniqueStudents = [...new Set(allRecords.map(r => r.student_id))].length;

    return {
      success: true,
      data: {
        sessions: sessionBreakdown,
        totals: {
          totalSessions: sessions.length,
          totalRecords: allRecords.length,
          totalPresent,
          uniqueStudents,
          avgRate: allRecords.length > 0
            ? Math.round((totalPresent / allRecords.length) * 100)
            : 0,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error('❌ Error in getCourseAttendanceReport:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get attendance report for a specific student
 */
export async function getStudentAttendanceReport(studentId) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        sessions(
          id, session_date, start_time,
          courses(id, course_code, description)
        )
      `)
      .eq('student_id', studentId)
      .order('check_in_time', { ascending: false });

    if (error) throw error;

    const records = data || [];

    // Group by course
    const courseMap = {};
    records.forEach(r => {
      const courseId = r.sessions?.courses?.id;
      const courseCode = r.sessions?.courses?.course_code || 'Unknown';
      if (!courseId) return;
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          course_id: courseId,
          course_code: courseCode,
          description: r.sessions?.courses?.description || '',
          totalRecords: 0,
          present: 0,
          onsite: 0,
          online: 0,
          sessionsAttended: new Set(),
          latestDate: null,
        };
      }
      courseMap[courseId].totalRecords++;
      courseMap[courseId].present++;
      if ((r.status || '').toLowerCase() === 'onsite') courseMap[courseId].onsite++;
      else if ((r.status || '').toLowerCase() === 'online') courseMap[courseId].online++;
      courseMap[courseId].sessionsAttended.add(r.session_id);
      const checkIn = new Date(r.check_in_time);
      if (!courseMap[courseId].latestDate || checkIn > courseMap[courseId].latestDate) {
        courseMap[courseId].latestDate = checkIn;
      }
    });

    const courseBreakdown = Object.values(courseMap).map(c => ({
      ...c,
      sessionsAttended: c.sessionsAttended.size,
      latestDate: c.latestDate?.toISOString() || null,
      rate: c.totalRecords > 0 ? Math.round((c.present / c.totalRecords) * 100) : 0,
    }));

    // Overall
    const totalPresent = records.length;

    return {
      success: true,
      data: {
        courses: courseBreakdown,
        totals: {
          totalCourses: courseBreakdown.length,
          totalRecords: records.length,
          totalSessions: [...new Set(records.map(r => r.session_id))].length,
          overallRate: records.length > 0
            ? Math.round((totalPresent / records.length) * 100)
            : 0,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error('❌ Error in getStudentAttendanceReport:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get list of students who have attendance records (for student report dropdown)
 */
export async function getStudentsWithAttendance() {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('student_id, user_profiles!attendance_records_student_id_fkey(first_name, last_name, student_number)')
      .order('student_id');

    if (error) throw error;

    // Deduplicate
    const seen = new Set();
    const students = [];
    (data || []).forEach(r => {
      if (!seen.has(r.student_id) && r.user_profiles) {
        seen.add(r.student_id);
        students.push({
          user_id: r.student_id,
          first_name: r.user_profiles.first_name,
          last_name: r.user_profiles.last_name,
          student_number: r.user_profiles.student_number,
        });
      }
    });

    students.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
    return { success: true, data: students, error: null };
  } catch (err) {
    console.error('❌ Error in getStudentsWithAttendance:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get raw attendance data for export (flat, with joins)
 */
export async function getAttendanceForExport(filters = {}) {
  try {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        user_profiles!attendance_records_student_id_fkey(first_name, last_name, student_number, email),
        sessions!attendance_records_session_id_fkey(
          session_date, start_time,
          courses(course_code, description)
        )
      `)
      .order('check_in_time', { ascending: false });

    if (filters.startDate) query = query.gte('check_in_time', filters.startDate);
    if (filters.endDate) query = query.lte('check_in_time', filters.endDate);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.mode && filters.mode !== 'all') query = query.eq('status', filters.mode);

    const { data, error } = await query;
    if (error) throw error;

    let records = data || [];
    if (filters.courseId && filters.courseId !== 'all') {
      records = records.filter(r => r.sessions?.courses?.course_code === filters.courseId);
    }

    return { success: true, data: records, error: null };
  } catch (err) {
    console.error('❌ Error in getAttendanceForExport:', err.message);
    return { success: false, data: null, error: err.message };
  }
}
