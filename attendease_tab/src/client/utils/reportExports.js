// Export utilities for attendance and engagement reports
// Uses native JavaScript for CSV, jsPDF + autoTable for PDF

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format date to readable string
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format date for filename
 */
function formatFileDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Download helper — creates a blob link and clicks it
 */
function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}

// ─── ATTENDANCE EXPORTS ────────────────────────────────────────────────

/**
 * Flatten Supabase attendance rows into export-ready objects
 */
function flattenAttendanceData(records) {
    return records.map(r => ({
        'Date': formatDate(r.check_in_time || r.created_at),
        'Course Code': r.sessions?.courses?.course_code || r.course_code || '-',
        'Course Name': r.sessions?.courses?.description || r.course_name || '-',
        'Student Number': r.user_profiles?.student_number || r.student_number || '-',
        'Student Name': r.user_profiles
            ? `${r.user_profiles.first_name || ''} ${r.user_profiles.last_name || ''}`.trim()
            : (r.student_name || '-'),
        'Mode': r.attendance_type || '-',
        'Status': r.status || '-',
        'Confidence': r.confidence_score != null ? `${Math.round(r.confidence_score)}%` : 'N/A',
        'Check-In Time': formatDate(r.check_in_time),
    }));
}

/**
 * Export attendance records to CSV
 */
export function exportAttendanceCSV(records, filename = `attendance_report_${formatFileDate()}`) {
    const rows = flattenAttendanceData(records);
    if (!rows.length) { alert('No data to export'); return; }

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export attendance records to PDF
 */
export function exportAttendancePDF(records, filename = `attendance_report_${formatFileDate()}`) {
    const rows = flattenAttendanceData(records);
    if (!rows.length) { alert('No data to export'); return; }

    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);
    doc.text(`Total Records: ${rows.length}`, 14, 34);

    const tableHeaders = ['Date', 'Course', 'Student', 'Student #', 'Mode', 'Status', 'Confidence'];
    const tableData = rows.map(r => [
        r['Date'],
        r['Course Code'],
        r['Student Name'],
        r['Student Number'],
        r['Mode'],
        r['Status'],
        r['Confidence'],
    ]);

    autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 59, 34] },
        margin: { top: 10 },
    });

    doc.save(`${filename}.pdf`);
}

// ─── ENGAGEMENT EXPORTS ────────────────────────────────────────────────

/**
 * Flatten Supabase engagement rows into export-ready objects
 */
function flattenEngagementData(records) {
    return records.map(r => ({
        'Timestamp': formatDate(r.timestamp),
        'Session Date': r.sessions?.session_date
            ? new Date(r.sessions.session_date).toLocaleDateString()
            : '-',
        'Course Code': r.sessions?.courses?.course_code || '-',
        'Student ID': r.student_id || '-',
        'Event Type': r.event_type || '-',
        'Engagement Score': r.engagement_score != null ? r.engagement_score : '-',
        'Duration (s)': r.duration_seconds != null ? r.duration_seconds : '-',
    }));
}

/**
 * Export engagement records to CSV
 */
export function exportEngagementCSV(records, filename = `engagement_report_${formatFileDate()}`) {
    const rows = flattenEngagementData(records);
    if (!rows.length) { alert('No data to export'); return; }

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export engagement records to PDF
 */
export function exportEngagementPDF(records, filename = `engagement_report_${formatFileDate()}`) {
    const rows = flattenEngagementData(records);
    if (!rows.length) { alert('No data to export'); return; }

    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text('Engagement Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);
    doc.text(`Total Events: ${rows.length}`, 14, 34);

    const tableHeaders = ['Timestamp', 'Session Date', 'Course', 'Student ID', 'Event', 'Score', 'Duration'];
    const tableData = rows.map(r => [
        r['Timestamp'],
        r['Session Date'],
        r['Course Code'],
        r['Student ID'],
        r['Event Type'],
        r['Engagement Score'],
        r['Duration (s)'],
    ]);

    autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 59, 34] },
        margin: { top: 10 },
    });

    doc.save(`${filename}.pdf`);
}

// ─── LEGACY COMPAT (kept for any old callers) ──────────────────────────

/**
 * @deprecated Use exportAttendanceCSV instead
 */
export function exportToCSV(sessions, filename) {
    // Legacy mock-data shape → flatten and delegate
    const records = [];
    (sessions || []).forEach(session => {
        (session.records || []).forEach(record => {
            records.push({
                check_in_time: record.checkInTime,
                course_code: session.courseCode,
                course_name: session.courseName,
                student_number: record.studentId,
                student_name: record.name,
                attendance_type: record.mode,
                status: record.status,
                confidence_score: record.confidence,
            });
        });
    });
    exportAttendanceCSV(records, filename);
}

/**
 * @deprecated Use exportAttendancePDF instead
 */
export function exportToPDF(sessions, stats, filename) {
    const records = [];
    (sessions || []).forEach(session => {
        (session.records || []).forEach(record => {
            records.push({
                check_in_time: record.checkInTime,
                course_code: session.courseCode,
                course_name: session.courseName,
                student_number: record.studentId,
                student_name: record.name,
                attendance_type: record.mode,
                status: record.status,
                confidence_score: record.confidence,
            });
        });
    });
    exportAttendancePDF(records, filename);
}
