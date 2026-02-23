import React, { useState, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Text,
    Dropdown,
    Option,
    Input,
    Spinner,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { getStudentAttendanceReport, getStudentsWithAttendance } from '../../services/supabase/attendanceService.js';

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('20px'),
    },
    filterBar: {
        display: 'flex',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
        alignItems: 'flex-end',
        ...shorthands.padding('20px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        minWidth: '280px',
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    /* Summary cards */
    summaryRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        ...shorthands.gap('14px'),
        '@media (max-width: 900px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
        '@media (max-width: 500px)': { gridTemplateColumns: '1fr' },
    },
    summaryCard: {
        ...shorthands.padding('20px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        alignItems: 'center',
        textAlign: 'center',
    },
    summaryLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#8492a6',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
    },
    summaryValue: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#1e293b',
        lineHeight: '1',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    /* Chart card */
    chartCard: {
        ...shorthands.padding('24px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    chartTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1e293b',
    },
    chartSubtitle: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    /* Table card */
    tableCard: {
        ...shorthands.padding('24px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    tableWrapper: {
        overflowX: 'auto',
        borderRadius: '10px',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        textAlign: 'left',
        ...shorthands.padding('12px', '16px'),
        fontWeight: '700',
        fontSize: '12px',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    tableCell: {
        ...shorthands.padding('12px', '16px'),
        ...shorthands.borderBottom('1px', 'solid', '#f0f0f0'),
        color: '#334155',
    },
    /* Empty state */
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...shorthands.padding('60px', '20px'),
        ...shorthands.gap('8px'),
    },
    emptyIcon: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
        fontSize: '28px',
    },
    /* Student info header */
    studentHeader: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('12px'),
        ...shorthands.padding('16px', '20px'),
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        ...shorthands.border('1px', 'solid', '#eef2ff'),
    },
    studentAvatar: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#294972',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '16px',
        flexShrink: 0,
    },
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const rateStyle = (rate) => {
    if (rate >= 80) return { backgroundColor: '#dcfce7', color: '#166534' };
    if (rate >= 60) return { backgroundColor: '#fef3c7', color: '#92400e' };
    return { backgroundColor: '#fee2e2', color: '#991b1b' };
};

const BAR_COLORS = ['#294972', '#FFB900', '#36C752', '#F1511B', '#0ea5e9', '#8b5cf6'];

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
                padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ margin: '2px 0 0', fontSize: '12px', color: entry.color }}>
                        {entry.name}: <strong>{entry.value}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function ReportStudents() {
    const styles = useStyles();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    useEffect(() => { loadStudents(); }, []);
    useEffect(() => { if (selectedStudent) loadReport(); }, [selectedStudent]);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredStudents(students);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredStudents(students.filter(s => {
                const name = `${s.first_name} ${s.last_name}`.toLowerCase();
                const num = (s.student_number || '').toLowerCase();
                return name.includes(q) || num.includes(q);
            }));
        }
    }, [searchQuery, students]);

    const loadStudents = async () => {
        setIsLoadingStudents(true);
        const result = await getStudentsWithAttendance();
        if (result.success) {
            setStudents(result.data);
            setFilteredStudents(result.data);
        }
        setIsLoadingStudents(false);
    };

    const loadReport = async () => {
        setIsLoading(true);
        const result = await getStudentAttendanceReport(selectedStudent);
        if (result.success) setReportData(result.data);
        else setReportData(null);
        setIsLoading(false);
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const selectedStudentInfo = students.find(s => s.user_id === selectedStudent);

    // Build chart data from courses
    const courseChartData = reportData?.courses?.map(c => ({
        name: c.course_code,
        present: c.present,
        onsite: c.onsite,
        online: c.online,
    })) || [];

    return (
        <div className={styles.container}>
            {/* Filter */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Select Student</span>
                    {isLoadingStudents ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Spinner size="tiny" /><Text size={200} style={{ color: '#94a3b8' }}>Loading students...</Text>
                        </div>
                    ) : students.length === 0 ? (
                        <Text size={200} style={{ color: '#94a3b8' }}>No students with attendance records.</Text>
                    ) : (
                        <Dropdown
                            placeholder="Choose a student..."
                            value={selectedStudentInfo
                                ? `${selectedStudentInfo.last_name}, ${selectedStudentInfo.first_name} (${selectedStudentInfo.student_number || 'N/A'})`
                                : undefined}
                            onOptionSelect={(e, d) => setSelectedStudent(d.optionValue)}
                        >
                            {filteredStudents.map(s => (
                                <Option key={s.user_id} value={s.user_id}>
                                    {s.last_name}, {s.first_name} ({s.student_number || 'N/A'})
                                </Option>
                            ))}
                        </Dropdown>
                    )}
                </div>
                {students.length > 5 && (
                    <div className={styles.filterGroup} style={{ minWidth: '200px' }}>
                        <span className={styles.filterLabel}>Search</span>
                        <Input
                            placeholder="Filter students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            contentBefore={<Search24Regular style={{ color: '#94a3b8' }} />}
                        />
                    </div>
                )}
            </div>

            {!selectedStudent ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎓</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>Select a student to view their report</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>Choose a student from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <Spinner size="small" /><Text size={300} style={{ color: '#64748b' }}>Loading student report...</Text>
                </div>
            ) : !reportData || !reportData.totals ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>No attendance data for this student</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>This student has no recorded attendance yet.</Text>
                </div>
            ) : (
                <>
                    {/* Student info header */}
                    {selectedStudentInfo && (
                        <div className={styles.studentHeader}>
                            <div className={styles.studentAvatar}>
                                {(selectedStudentInfo.first_name?.[0] || '').toUpperCase()}{(selectedStudentInfo.last_name?.[0] || '').toUpperCase()}
                            </div>
                            <div>
                                <Text weight="bold" size={400} style={{ color: '#1e293b' }}>
                                    {selectedStudentInfo.first_name} {selectedStudentInfo.last_name}
                                </Text>
                                <Text size={200} style={{ color: '#64748b', display: 'block' }}>
                                    {selectedStudentInfo.student_number || 'N/A'} • {selectedStudentInfo.email || ''}
                                </Text>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className={styles.summaryRow}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Courses Enrolled</span>
                            <span className={styles.summaryValue}>{reportData.totals.totalCourses}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Sessions Attended</span>
                            <span className={styles.summaryValue}>{reportData.totals.totalSessions}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Records</span>
                            <span className={styles.summaryValue}>{reportData.totals.totalRecords}</span>
                        </div>
                    </div>

                    {/* Course Attendance Chart */}
                    {courseChartData.length > 0 && (
                        <div className={styles.chartCard}>
                            <div>
                                <div className={styles.chartTitle}>Attendance by Course</div>
                                <div className={styles.chartSubtitle}>Onsite and online counts per course</div>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={courseChartData} barGap={2} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="onsite" fill="#36C752" name="Onsite" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="online" fill="#F1511B" name="Online" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Per-Course Breakdown Table */}
                    <div className={styles.tableCard}>
                        <div className={styles.chartTitle}>Per-Course Breakdown</div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.tableHeader}>Course</th>
                                        <th className={styles.tableHeader}>Description</th>
                                        <th className={styles.tableHeader}>Sessions Attended</th>
                                        <th className={styles.tableHeader}>Onsite</th>
                                        <th className={styles.tableHeader}>Online</th>
                                        <th className={styles.tableHeader}>Latest</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.courses.map((c, i) => (
                                        <tr key={c.course_id || i}>
                                            <td className={styles.tableCell} style={{ fontWeight: 600, color: '#294972' }}>
                                                {c.course_code}
                                            </td>
                                            <td className={styles.tableCell} style={{ color: '#64748b' }}>{c.description || '—'}</td>
                                            <td className={styles.tableCell}>{c.sessionsAttended}</td>
                                            <td className={styles.tableCell}>{c.onsite}</td>
                                            <td className={styles.tableCell}>{c.online}</td>
                                            <td className={styles.tableCell} style={{ color: '#64748b' }}>{formatDate(c.latestDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
