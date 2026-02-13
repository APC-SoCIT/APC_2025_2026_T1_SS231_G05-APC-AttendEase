import React, { useState, useEffect, useMemo } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Badge,
    Dropdown,
    Option,
    Input,
    Button,
    Spinner,
} from '@fluentui/react-components';
import {
    Search24Regular,
    ChevronLeft20Regular,
    ChevronRight20Regular,
} from '@fluentui/react-icons';
import { getAllAttendanceRecords } from '../../services/supabase/attendanceService.js';
import { fetchCourses } from '../../services/supabase/referenceData.js';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
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
        minWidth: '150px',
    },
    tableCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
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
        cursor: 'pointer',
        '&:hover': { backgroundColor: '#e0e0e0' },
    },
    tableCell: {
        ...shorthands.padding('12px'),
        ...shorthands.borderBottom('1px', 'solid', '#e0e0e0'),
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...shorthands.gap('12px'),
        marginTop: '16px',
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

export default function ReportAttendanceRecords() {
    const styles = useStyles();

    // Filters
    const [dateRange, setDateRange] = useState('30');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedMode, setSelectedMode] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Data
    const [records, setRecords] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 25;

    // Sort
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        loadRecords();
    }, [dateRange, selectedCourse, selectedStatus, selectedMode]);

    useEffect(() => {
        loadRecords();
    }, [currentPage]);

    const loadCourses = async () => {
        const result = await fetchCourses();
        if (result.success) setCourses(result.data);
    };

    const loadRecords = async () => {
        setIsLoading(true);
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await getAllAttendanceRecords({
            startDate: startDate.toISOString(),
            courseId: selectedCourse,
            status: selectedStatus,
            mode: selectedMode,
            search: searchQuery,
            page: currentPage,
            pageSize,
        });

        if (result.success) {
            setRecords(result.data);
            setTotalCount(result.count || result.data.length);
        }
        setIsLoading(false);
    };

    // Client-side search filtering (on currently loaded page)
    const filteredRecords = useMemo(() => {
        if (!searchQuery) return records;
        const q = searchQuery.toLowerCase();
        return records.filter(r => {
            const name = `${r.user_profiles?.first_name || ''} ${r.user_profiles?.last_name || ''}`.toLowerCase();
            const code = (r.sessions?.courses?.course_code || '').toLowerCase();
            const num = (r.user_profiles?.student_number || '').toLowerCase();
            return name.includes(q) || code.includes(q) || num.includes(q);
        });
    }, [records, searchQuery]);

    // Client-side sorting
    const sortedRecords = useMemo(() => {
        if (!sortConfig.key) return filteredRecords;
        return [...filteredRecords].sort((a, b) => {
            let aVal, bVal;
            switch (sortConfig.key) {
                case 'date': aVal = a.check_in_time; bVal = b.check_in_time; break;
                case 'course': aVal = a.sessions?.courses?.course_code || ''; bVal = b.sessions?.courses?.course_code || ''; break;
                case 'student': aVal = `${a.user_profiles?.last_name} ${a.user_profiles?.first_name}`; bVal = `${b.user_profiles?.last_name} ${b.user_profiles?.first_name}`; break;
                case 'mode': aVal = a.attendance_type; bVal = b.attendance_type; break;
                case 'status': aVal = a.status; bVal = b.status; break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredRecords, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadRecords();
    };

    return (
        <div className={styles.container}>
            {/* Filter Bar */}
            <Card className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Date Range</Text>
                    <Dropdown
                        value={dateRange === '7' ? 'Last 7 Days' : dateRange === '30' ? 'Last 30 Days' : 'Last 90 Days'}
                        onOptionSelect={(e, d) => setDateRange(d.optionValue)}
                    >
                        <Option value="7">Last 7 Days</Option>
                        <Option value="30">Last 30 Days</Option>
                        <Option value="90">Last 90 Days</Option>
                    </Dropdown>
                </div>

                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Course</Text>
                    <Dropdown
                        value={selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.course_code || 'All Courses'}
                        onOptionSelect={(e, d) => setSelectedCourse(d.optionValue)}
                    >
                        <Option value="all">All Courses</Option>
                        {courses.map(c => (
                            <Option key={c.id} value={c.id}>{c.course_code} — {c.description}</Option>
                        ))}
                    </Dropdown>
                </div>

                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Status</Text>
                    <Dropdown
                        value={selectedStatus === 'all' ? 'All Statuses' : selectedStatus}
                        onOptionSelect={(e, d) => setSelectedStatus(d.optionValue)}
                    >
                        <Option value="all">All Statuses</Option>
                        <Option value="present">Present</Option>
                        <Option value="late">Late</Option>
                        <Option value="absent">Absent</Option>
                        <Option value="unknown">Unknown</Option>
                    </Dropdown>
                </div>

                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Mode</Text>
                    <Dropdown
                        value={selectedMode === 'all' ? 'All Modes' : selectedMode}
                        onOptionSelect={(e, d) => setSelectedMode(d.optionValue)}
                    >
                        <Option value="all">All Modes</Option>
                        <Option value="onsite">Onsite</Option>
                        <Option value="online">Online</Option>
                    </Dropdown>
                </div>

                <Button appearance="outline" onClick={() => {
                    setDateRange('30'); setSelectedCourse('all');
                    setSelectedStatus('all'); setSelectedMode('all');
                    setSearchQuery('');
                }}>Reset</Button>
            </Card>

            {/* Data Table */}
            <Card className={styles.tableCard}>
                <div className={styles.controls}>
                    <Input
                        placeholder="Search by name, course, or student #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        contentBefore={<Search24Regular />}
                        style={{ minWidth: '280px' }}
                    />
                    <Text size={200} style={{ color: '#666' }}>
                        {totalCount} records total
                    </Text>
                </div>

                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <Spinner size="small" />
                        <Text>Loading records...</Text>
                    </div>
                ) : sortedRecords.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Text weight="semibold">No attendance records found</Text>
                        <Text size={200}>Try adjusting your filters or date range.</Text>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.tableHeader} onClick={() => handleSort('date')}>
                                            Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('course')}>
                                            Course {sortConfig.key === 'course' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('student')}>
                                            Student {sortConfig.key === 'student' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className={styles.tableHeader}>Student #</th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('mode')}>
                                            Mode {sortConfig.key === 'mode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('status')}>
                                            Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className={styles.tableHeader}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRecords.map((record, index) => (
                                        <tr key={record.id || index}>
                                            <td className={styles.tableCell}>{formatDate(record.check_in_time)}</td>
                                            <td className={styles.tableCell}>{record.sessions?.courses?.course_code || '—'}</td>
                                            <td className={styles.tableCell}>
                                                {record.user_profiles?.last_name}, {record.user_profiles?.first_name}
                                            </td>
                                            <td className={styles.tableCell}>{record.user_profiles?.student_number || '—'}</td>
                                            <td className={styles.tableCell}>
                                                <Badge color={record.attendance_type === 'onsite' ? 'informative' : 'brand'}>
                                                    {record.attendance_type}
                                                </Badge>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <Badge
                                                    color={
                                                        record.status === 'present' ? 'success' :
                                                        record.status === 'late' ? 'warning' :
                                                        record.status === 'absent' ? 'danger' : 'subtle'
                                                    }
                                                >
                                                    {record.status}
                                                </Badge>
                                            </td>
                                            <td className={styles.tableCell}>
                                                {record.confidence_score != null ? `${Number(record.confidence_score).toFixed(0)}%` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <Button
                                    icon={<ChevronLeft20Regular />}
                                    appearance="subtle"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                />
                                <Text size={200}>Page {currentPage} of {totalPages}</Text>
                                <Button
                                    icon={<ChevronRight20Regular />}
                                    appearance="subtle"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}
