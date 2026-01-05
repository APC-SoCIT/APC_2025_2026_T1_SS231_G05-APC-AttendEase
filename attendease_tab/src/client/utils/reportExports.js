// Export utilities for attendance reports
// Uses native JavaScript for CSV, external libraries for PDF

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
 * Flatten sessions into records array for export
 */
function flattenSessionData(sessions) {
    const records = [];

    sessions.forEach(session => {
        session.records.forEach(record => {
            records.push({
                'Session Date': formatDate(session.date),
                'Course Code': session.courseCode,
                'Course Name': session.courseName,
                'Student ID': record.studentId,
                'Student Name': record.name,
                'Mode': record.mode,
                'Status': record.status,
                'Confidence': record.confidence ? `${record.confidence}%` : 'N/A',
                'Check-In Time': formatDate(record.checkInTime),
                'Duration (min)': record.duration || 0
            });
        });
    });

    return records;
}

/**
 * Export to CSV (Native JavaScript - follows ProfessorDashboard pattern)
 */
export function exportToCSV(sessions, filename = `attendance_report_${formatFileDate()}`) {
    const records = flattenSessionData(sessions);

    if (records.length === 0) {
        alert('No data to export');
        return;
    }

    // Get headers from first record
    const headers = Object.keys(records[0]);

    // Build CSV content
    const csvContent = [
        headers.join(','),
        ...records.map(record =>
            headers.map(header => `"${record[header] || ''}"`).join(',')
        )
    ].join('\n');

    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Export to PDF (using jsPDF)
 */
export function exportToPDF(sessions, stats, filename = `attendance_report_${formatFileDate()}`) {
    const records = flattenSessionData(sessions);

    if (records.length === 0) {
        alert('No data to export');
        return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

    // Add title
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 20);

    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);

    // Add summary statistics if provided
    if (stats) {
        doc.setFontSize(12);
        doc.text('Summary Statistics:', 14, 38);
        doc.setFontSize(10);
        doc.text(`Total Sessions: ${stats.totalSessions}`, 14, 45);
        doc.text(`Total Records: ${stats.totalRecords}`, 14, 50);
        doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 14, 55);
        doc.text(`Onsite: ${stats.onsiteCount} | Online: ${stats.onlineCount}`, 14, 60);
    }

    // Prepare table data
    const tableData = records.map(record => [
        record['Session Date'],
        record['Course Code'],
        record['Student Name'],
        record['Mode'],
        record['Status'],
        record['Confidence'],
        record['Duration (min)']
    ]);

    // Add table
    autoTable(doc, {
        head: [['Session Date', 'Course', 'Student', 'Mode', 'Status', 'Confidence', 'Duration']],
        body: tableData,
        startY: stats ? 68 : 38,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 59, 34] },
        margin: { top: 10 }
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
}
