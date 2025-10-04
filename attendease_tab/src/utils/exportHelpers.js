/**
 * Export Helpers
 * Utilities for exporting attendance data to various formats
 */

/**
 * Convert attendance data to CSV format
 */
export function generateAttendanceCSV(sessions, isMultiSession = false) {
  if (!Array.isArray(sessions)) {
    sessions = [sessions]; // Single session
  }

  const rows = [];
  
  // Headers
  if (isMultiSession) {
    rows.push(['Course', 'Section', 'Session Date', 'Student ID', 'Student Name', 'Email', 'Attendance Type', 'Status', 'Check-in Time', 'Confidence Score']);
  } else {
    rows.push(['Student ID', 'Student Name', 'Email', 'Attendance Type', 'Status', 'Check-in Time', 'Confidence Score']);
  }

  // Data rows
  sessions.forEach(session => {
    const courseInfo = session.courses || session.course;
    const attendance = session.attendance_records || [];

    attendance.forEach(record => {
      const student = record.users || record.student;
      const row = [];

      if (isMultiSession) {
        row.push(
          `${courseInfo.course_code}`,
          courseInfo.section,
          new Date(session.start_time).toLocaleDateString()
        );
      }

      row.push(
        student.id,
        student.full_name,
        student.email,
        record.attendance_type,
        record.status,
        new Date(record.check_in_time).toLocaleString(),
        record.confidence_score || 'N/A'
      );

      rows.push(row);
    });
  });

  // Convert to CSV string
  return rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

/**
 * Generate attendance summary report
 */
export function generateAttendanceSummary(session) {
  const course = session.courses || session.course;
  const attendance = session.attendance_records || [];
  
  const onsiteCount = attendance.filter(a => a.attendance_type === 'onsite').length;
  const onlineCount = attendance.filter(a => a.attendance_type === 'online').length;
  const totalPresent = attendance.length;

  return {
    courseCode: course.course_code,
    courseName: course.course_name,
    section: course.section,
    sessionDate: new Date(session.start_time).toLocaleDateString(),
    sessionTime: `${new Date(session.start_time).toLocaleTimeString()} - ${session.end_time ? new Date(session.end_time).toLocaleTimeString() : 'Ongoing'}`,
    totalPresent,
    onsiteCount,
    onlineCount,
    attendanceRate: null, // Calculated on frontend with enrollment data
    attendance: attendance.map(a => ({
      studentId: a.users?.id || a.student_id,
      studentName: a.users?.full_name,
      email: a.users?.email,
      type: a.attendance_type,
      status: a.status,
      checkInTime: a.check_in_time,
      confidence: a.confidence_score
    }))
  };
}

/**
 * Generate bulk summary for multiple sessions
 */
export function generateBulkSummary(sessions) {
  return sessions.map(session => generateAttendanceSummary(session));
}

/**
 * Format session data for export
 */
export function formatSessionForExport(session) {
  return {
    sessionId: session.id,
    courseCode: session.courses?.course_code,
    courseName: session.courses?.course_name,
    section: session.courses?.section,
    date: new Date(session.start_time).toLocaleDateString(),
    startTime: new Date(session.start_time).toLocaleTimeString(),
    endTime: session.end_time ? new Date(session.end_time).toLocaleTimeString() : null,
    status: session.status,
    attendanceCount: session.attendance_records?.length || 0
  };
}

export default {
  generateAttendanceCSV,
  generateAttendanceSummary,
  generateBulkSummary,
  formatSessionForExport
};

