import React, { useState, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Badge,
    Dropdown,
    Option,
    Spinner,
} from '@fluentui/react-components';
import { getCourseAttendanceReport } from '../../services/supabase/attendanceService.js';
import { fetchCourses } from '../../services/supabase/referenceData.js';

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
        ...shorthands.padding('16px'),
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        minWidth: '250px',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        ...shorthands.gap('16px'),
    },
    summaryCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('8px'),
        alignItems: 'center',
        textAlign: 'center',
    },
    tableCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('12px'),
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        textAlign: 'left',
        ...shorthands.padding('12px'),
        fontWeight: '600',
    },
    tableCell: {
        ...shorthands.padding('12px'),
        ...shorthands.borderBottom('1px', 'solid', '#e0e0e0'),
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...shorthands.padding('40px'),
        ...shorthands.gap('8px'),
        color: '#94a3b8',
    },
});

export default function ReportCourses() {
    const styles = useStyles();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) loadReport();
    }, [selectedCourse]);

    const loadCourses = async () => {
        setIsLoadingCourses(true);
        const result = await fetchCourses();
        if (result.success) setCourses(result.data);
        setIsLoadingCourses(false);
    };

    const loadReport = async () => {
        setIsLoading(true);
        const result = await getCourseAttendanceReport(selectedCourse);
        if (result.success) setReportData(result.data);
        else setReportData(null);
        setIsLoading(false);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    const selectedCourseName = courses.find(c => c.id === selectedCourse);

    return (
        <div className={styles.container}>
            {/* Filter */}
            <Card className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Select Course</Text>
                    {isLoadingCourses ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Spinner size="tiny" /><Text size={200}>Loading courses...</Text>
                        </div>
                    ) : (
                        <Dropdown
                            placeholder="Choose a course..."
                            value={selectedCourseName ? `${selectedCourseName.course_code} — ${selectedCourseName.description}` : undefined}
                            onOptionSelect={(e, d) => setSelectedCourse(d.optionValue)}
                        >
                            {courses.map(c => (
                                <Option key={c.id} value={c.id}>{c.course_code} — {c.description}</Option>
                            ))}
                        </Dropdown>
                    )}
                </div>
            </Card>

            {!selectedCourse ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold" size={400}>Select a course to view its report</Text>
                    <Text size={200}>Choose a course from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Spinner size="small" /><Text>Loading course report...</Text>
                </div>
            ) : !reportData || !reportData.totals ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold">No attendance data for this course</Text>
                    <Text size={200}>No sessions have been conducted yet.</Text>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className={styles.summaryGrid}>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Total Sessions</Text>
                            <Badge appearance="filled" color="brand" size="extra-large">{reportData.totals.totalSessions}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Unique Students</Text>
                            <Badge appearance="filled" color="informative" size="extra-large">{reportData.totals.uniqueStudents}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Avg Attendance Rate</Text>
                            <Badge appearance="filled" color="success" size="extra-large">{reportData.totals.avgRate}%</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Total Records</Text>
                            <Badge appearance="filled" color="informative" size="extra-large">{reportData.totals.totalRecords}</Badge>
                        </Card>
                    </div>

                    {/* Session Breakdown Table */}
                    <Card className={styles.tableCard}>
                        <Text weight="semibold" size={400}>Per-Session Breakdown</Text>
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.tableHeader}>Session Date</th>
                                        <th className={styles.tableHeader}>Status</th>
                                        <th className={styles.tableHeader}>Present</th>
                                        <th className={styles.tableHeader}>Late</th>
                                        <th className={styles.tableHeader}>Absent</th>
                                        <th className={styles.tableHeader}>Total</th>
                                        <th className={styles.tableHeader}>Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.sessions.map((s, i) => (
                                        <tr key={s.session_id || i}>
                                            <td className={styles.tableCell}>{formatDate(s.session_date)}</td>
                                            <td className={styles.tableCell}>
                                                <Badge color={s.status === 'completed' ? 'success' : 'warning'}>{s.status}</Badge>
                                            </td>
                                            <td className={styles.tableCell}>{s.present}</td>
                                            <td className={styles.tableCell}>{s.late}</td>
                                            <td className={styles.tableCell}>{s.absent}</td>
                                            <td className={styles.tableCell}>{s.totalRecords}</td>
                                            <td className={styles.tableCell}>
                                                <Badge color={s.rate >= 80 ? 'success' : s.rate >= 60 ? 'warning' : 'danger'}>
                                                    {s.rate}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
