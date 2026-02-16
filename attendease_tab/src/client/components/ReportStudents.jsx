import React, { useState, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Badge,
    Dropdown,
    Option,
    Input,
    Spinner,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { getStudentAttendanceReport, getStudentsWithAttendance } from '../../services/supabase/attendanceService.js';

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
        minWidth: '280px',
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

export default function ReportStudents() {
    const styles = useStyles();
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) loadReport();
    }, [selectedStudent]);

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
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    const selectedStudentInfo = students.find(s => s.user_id === selectedStudent);

    return (
        <div className={styles.container}>
            {/* Filter */}
            <Card className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Select Student</Text>
                    {isLoadingStudents ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Spinner size="tiny" /><Text size={200}>Loading students...</Text>
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
            </Card>

            {!selectedStudent ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold" size={400}>Select a student to view their report</Text>
                    <Text size={200}>Choose a student from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Spinner size="small" /><Text>Loading student report...</Text>
                </div>
            ) : !reportData || !reportData.totals ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold">No attendance data for this student</Text>
                    <Text size={200}>This student has no recorded attendance yet.</Text>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className={styles.summaryGrid}>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Courses Enrolled</Text>
                            <Badge appearance="filled" color="brand" size="extra-large">{reportData.totals.totalCourses}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Sessions Attended</Text>
                            <Badge appearance="filled" color="informative" size="extra-large">{reportData.totals.totalSessions}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Total Records</Text>
                            <Badge appearance="filled" color="informative" size="extra-large">{reportData.totals.totalRecords}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Overall Rate</Text>
                            <Badge appearance="filled" color="success" size="extra-large">{reportData.totals.overallRate}%</Badge>
                        </Card>
                    </div>

                    {/* Per-Course Breakdown */}
                    <Card className={styles.tableCard}>
                        <Text weight="semibold" size={400}>Per-Course Breakdown</Text>
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.tableHeader}>Course</th>
                                        <th className={styles.tableHeader}>Description</th>
                                        <th className={styles.tableHeader}>Sessions</th>
                                        <th className={styles.tableHeader}>Present</th>
                                        <th className={styles.tableHeader}>Late</th>
                                        <th className={styles.tableHeader}>Absent</th>
                                        <th className={styles.tableHeader}>Rate</th>
                                        <th className={styles.tableHeader}>Latest</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.courses.map((c, i) => (
                                        <tr key={c.course_id || i}>
                                            <td className={styles.tableCell}>
                                                <Text weight="semibold">{c.course_code}</Text>
                                            </td>
                                            <td className={styles.tableCell}>{c.description || '—'}</td>
                                            <td className={styles.tableCell}>{c.sessionsAttended}</td>
                                            <td className={styles.tableCell}>{c.present}</td>
                                            <td className={styles.tableCell}>{c.late}</td>
                                            <td className={styles.tableCell}>{c.absent}</td>
                                            <td className={styles.tableCell}>
                                                <Badge color={c.rate >= 80 ? 'success' : c.rate >= 60 ? 'warning' : 'danger'}>
                                                    {c.rate}%
                                                </Badge>
                                            </td>
                                            <td className={styles.tableCell}>{formatDate(c.latestDate)}</td>
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
