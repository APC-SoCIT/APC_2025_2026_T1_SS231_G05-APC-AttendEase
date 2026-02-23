// Mock data for attendance reports
// This will be replaced with real API calls in production

const courses = [
    { id: 'CS101', name: 'Introduction to Computer Science', code: 'CS101' },
    { id: 'CS201', name: 'Data Structures and Algorithms', code: 'CS201' },
    { id: 'CS301', name: 'Database Systems', code: 'CS301' },
    { id: 'CS401', name: 'Software Engineering', code: 'CS401' },
    { id: 'MATH101', name: 'Calculus I', code: 'MATH101' }
];

const students = [
    'John Smith', 'Emma Johnson', 'Michael Brown', 'Sophia Davis',
    'William Martinez', 'Olivia Garcia', 'James Rodriguez', 'Isabella Wilson',
    'Benjamin Anderson', 'Mia Taylor', 'Lucas Thomas', 'Charlotte Moore',
    'Henry Jackson', 'Amelia Martin', 'Alexander Lee', 'Harper White',
    'Daniel Harris', 'Evelyn Clark', 'Matthew Lewis', 'Abigail Walker',
    'David Hall', 'Emily Allen', 'Joseph Young', 'Elizabeth King',
    'Andrew Wright', 'Sofia Lopez', 'Ryan Hill', 'Avery Scott',
    'Christopher Green', 'Ella Adams'
];

const statuses = ['Present', 'Absent'];

// Generate random date within last N days
function getRandomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(Math.floor(Math.random() * 4) + 8, Math.floor(Math.random() * 60), 0, 0);
    return date;
}

// Generate random time for check-in
function getCheckInTime(sessionDate) {
    const time = new Date(sessionDate);
    time.setMinutes(time.getMinutes() + Math.floor(Math.random() * 30));
    return time;
}

// Generate mock sessions
function generateMockSessions(numberOfDays = 30) {
    const sessions = [];

    for (let day = 0; day < numberOfDays; day++) {
        // 1-3 sessions per day
        const sessionsPerDay = Math.floor(Math.random() * 3) + 1;

        for (let s = 0; s < sessionsPerDay; s++) {
            const course = courses[Math.floor(Math.random() * courses.length)];
            const sessionDate = getRandomDate(numberOfDays);
            const sessionId = `${course.id}-${sessionDate.getTime()}`;

            // Generate attendance records
            const numStudents = Math.floor(Math.random() * 15) + 10; // 10-25 students
            const records = [];

            for (let i = 0; i < numStudents; i++) {
                const student = students[Math.floor(Math.random() * students.length)];
                const mode = Math.random() < 0.6 ? 'Onsite' : 'Online';

                // Higher probability of being present (80%)
                let status;
                const rand = Math.random();
                if (rand < 0.8) status = 'Present';
                else status = 'Absent';

                const checkInTime = status !== 'Absent' ? getCheckInTime(sessionDate) : null;
                const duration = status !== 'Absent' ? Math.floor(Math.random() * 50) + 30 : 0; // 30-80 minutes

                records.push({
                    studentId: `STU${i.toString().padStart(3, '0')}`,
                    name: student,
                    mode: mode,
                    status: status,
                    confidence: mode === 'Onsite' ? Math.floor(Math.random() * 20) + 80 : null, // 80-100% for onsite
                    checkInTime: checkInTime,
                    duration: duration
                });
            }

            sessions.push({
                sessionId: sessionId,
                date: sessionDate,
                courseId: course.id,
                courseName: course.name,
                courseCode: course.code,
                totalStudents: numStudents,
                records: records
            });
        }
    }

    // Sort by date descending (most recent first)
    return sessions.sort((a, b) => b.date - a.date);
}

// Export mock data
export const mockReportData = {
    sessions: generateMockSessions(30),
    courses: courses
};

// Helper function to get sessions by date range
export function getSessionsByDateRange(sessions, startDate, endDate) {
    return sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startDate && sessionDate <= endDate;
    });
}

// Helper function to get sessions by course
export function getSessionsByCourse(sessions, courseId) {
    if (!courseId || courseId === 'all') return sessions;
    return sessions.filter(session => session.courseId === courseId);
}

// Helper function to filter records by status
export function filterRecordsByStatus(sessions, status) {
    if (!status || status === 'all') return sessions;

    return sessions.map(session => ({
        ...session,
        records: session.records.filter(record => record.status === status),
        totalStudents: session.records.filter(record => record.status === status).length
    })).filter(session => session.records.length > 0);
}

// Helper function to filter records by mode
export function filterRecordsByMode(sessions, mode) {
    if (!mode || mode === 'all') return sessions;

    return sessions.map(session => ({
        ...session,
        records: session.records.filter(record => record.mode === mode),
        totalStudents: session.records.filter(record => record.mode === mode).length
    })).filter(session => session.records.length > 0);
}

// Helper function to calculate statistics
export function calculateStats(sessions) {
    const totalSessions = sessions.length;

    let totalRecords = 0;
    let presentCount = 0;
    let absentCount = 0;
    let onsiteCount = 0;
    let onlineCount = 0;

    sessions.forEach(session => {
        session.records.forEach(record => {
            totalRecords++;
            if (record.status === 'Present') presentCount++;
            else if (record.status === 'Absent') absentCount++;

            if (record.mode === 'Onsite') onsiteCount++;
            else if (record.mode === 'Online') onlineCount++;
        });
    });

    const attendanceRate = totalRecords > 0
        ? Math.round((presentCount / totalRecords) * 100)
        : 0;

    return {
        totalSessions,
        totalRecords,
        presentCount,
        absentCount,
        onsiteCount,
        onlineCount,
        attendanceRate
    };
}
