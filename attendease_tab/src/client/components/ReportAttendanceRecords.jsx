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
    ArrowSync20Regular,
} from '@fluentui/react-icons';
import { getAllAttendanceRecords } from '../../services/supabase/attendanceService.js';
import { fetchCourses } from '../../services/supabase/referenceData.js';

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('20px'),
    },
    /* Filter bar */
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
        minWidth: '150px',
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    /* Table card */
    tableCard: {
        ...shorthands.padding('24px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
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
        cursor: 'pointer',
        '&:hover': { backgroundColor: '#f1f5f9' },
        whiteSpace: 'nowrap',
    },
    tableCell: {
        ...shorthands.padding('12px', '16px'),
        ...shorthands.borderBottom('1px', 'solid', '#f0f0f0'),
        color: '#334155',
        fontSize: '13px',
    },
    tableRowHover: {
        '&:hover': { backgroundColor: '#fafbfc' },
    },
    /* Pagination */
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...shorthands.gap('12px'),
        ...shorthands.padding('8px', '0'),
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
    /* Count badge */
    countBadge: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
        fontSize: '12px',
        fontWeight: '600',
        ...shorthands.padding('4px', '12px'),
        borderRadius: '20px',
    },
});

/* ------------------------------------------------------------------ */
/*  Status badge color helper                                         */
/* ------------------------------------------------------------------ */
const statusColor = (status) => {
    switch (status) {
        case 'present': return 'success';
        case 'late': return 'warning';
        case 'absent': return 'danger';
        default: return 'subtle';
    }
};

const statusStyle = (status) => {
    const map = {
        present: { backgroundColor: '#dcfce7', color: '#166534' },
        late: { backgroundColor: '#fef3c7', color: '#92400e' },
        absent: { backgroundColor: '#fee2e2', color: '#991b1b' },
    };
    return map[status] || { backgroundColor: '#f1f5f9', color: '#64748b' };
};

const modeStyle = (mode) => {
    return mode === 'onsite'
        ? { backgroundColor: '#dbeafe', color: '#1e40af' }
        : { backgroundColor: '#f3e8ff', color: '#6b21a8' };
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
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

    useEffect(() => { loadCourses(); }, []);

    useEffect(() => {
        setCurrentPage(1);
        loadRecords();
    }, [dateRange, selectedCourse, selectedStatus, selectedMode]);

    useEffect(() => { loadRecords(); }, [currentPage]);

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

    // Client-side search filtering
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
        if (!date) return '—';
        return new Date(date).toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadRecords();
    };

    const handleReset = () => {
        setDateRange('30');
        setSelectedCourse('all');
        setSelectedStatus('all');
        setSelectedMode('all');
        setSearchQuery('');
    };

    const sortIndicator = (key) =>
        sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : '';

    return (
        <div className={styles.container}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Date Range</span>
                    <Dropdown
                        value={dateRange === '7' ? 'Last 7 Days' : dateRange === '30' ? 'Last 30 Days' : 'Last 90 Days'}
                        onOptionSelect={(e, d) => setDateRange(d.optionValue)}
                        style={{ minWidth: '140px' }}
                    >
                        <Option value="7">Last 7 Days</Option>
                        <Option value="30">Last 30 Days</Option>
                        <Option value="90">Last 90 Days</Option>
                    </Dropdown>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Course</span>
                    <Dropdown
                        value={selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.course_code || 'All'}
                        onOptionSelect={(e, d) => setSelectedCourse(d.optionValue)}
                        style={{ minWidth: '160px' }}
                    >
                        <Option value="all">All Courses</Option>
                        {courses.map(c => (
                            <Option key={c.id} value={c.id}>{c.course_code} — {c.description}</Option>
                        ))}
                    </Dropdown>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Status</span>
                    <Dropdown
                        value={selectedStatus === 'all' ? 'All Statuses' : selectedStatus}
                        onOptionSelect={(e, d) => setSelectedStatus(d.optionValue)}
                        style={{ minWidth: '130px' }}
                    >
                        <Option value="all">All Statuses</Option>
                        <Option value="present">Present</Option>
                        <Option value="late">Late</Option>
                        <Option value="absent">Absent</Option>
                    </Dropdown>
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Mode</span>
                    <Dropdown
                        value={selectedMode === 'all' ? 'All Modes' : selectedMode}
                        onOptionSelect={(e, d) => setSelectedMode(d.optionValue)}
                        style={{ minWidth: '120px' }}
                    >
                        <Option value="all">All Modes</Option>
                        <Option value="onsite">Onsite</Option>
                        <Option value="online">Online</Option>
                    </Dropdown>
                </div>

                <Button appearance="subtle" onClick={handleReset} size="small" style={{ color: '#64748b' }}>
                    Reset
                </Button>
            </div>

            {/* Data Table */}
            <div className={styles.tableCard}>
                <div className={styles.controls}>
                    <Input
                        placeholder="Search by name, course, or student #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        contentBefore={<Search24Regular style={{ color: '#94a3b8' }} />}
                        style={{ minWidth: '280px', maxWidth: '400px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={styles.countBadge}>{totalCount} records</span>
                        <Button appearance="subtle" icon={<ArrowSync20Regular />} onClick={loadRecords} size="small" />
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ padding: '60px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <Spinner size="small" />
                        <Text size={300} style={{ color: '#64748b' }}>Loading records...</Text>
                    </div>
                ) : sortedRecords.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <Text weight="semibold" size={400} style={{ color: '#334155' }}>No attendance records found</Text>
                        <Text size={200} style={{ color: '#94a3b8' }}>Try adjusting your filters or date range.</Text>
                    </div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.tableHeader} onClick={() => handleSort('date')}>
                                            Date{sortIndicator('date')}
                                        </th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('course')}>
                                            Course{sortIndicator('course')}
                                        </th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('student')}>
                                            Student{sortIndicator('student')}
                                        </th>
                                        <th className={styles.tableHeader}>Student #</th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('mode')}>
                                            Mode{sortIndicator('mode')}
                                        </th>
                                        <th className={styles.tableHeader} onClick={() => handleSort('status')}>
                                            Status{sortIndicator('status')}
                                        </th>
                                        <th className={styles.tableHeader}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRecords.map((record, index) => (
                                        <tr key={record.id || index}>
                                            <td className={styles.tableCell}>{formatDate(record.check_in_time)}</td>
                                            <td className={styles.tableCell}>
                                                <span style={{ fontWeight: 600, color: '#294972' }}>
                                                    {record.sessions?.courses?.course_code || '—'}
                                                </span>
                                            </td>
                                            <td className={styles.tableCell}>
                                                {record.user_profiles?.last_name}, {record.user_profiles?.first_name}
                                            </td>
                                            <td className={styles.tableCell} style={{ color: '#64748b' }}>
                                                {record.user_profiles?.student_number || '—'}
                                            </td>
                                            <td className={styles.tableCell}>
                                                <span style={{
                                                    ...modeStyle(record.attendance_type),
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {record.attendance_type}
                                                </span>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <span style={{
                                                    ...statusStyle(record.status),
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className={styles.tableCell}>
                                                {record.confidence_score != null
                                                    ? <span style={{ fontWeight: 600 }}>{Number(record.confidence_score).toFixed(0)}%</span>
                                                    : <span style={{ color: '#cbd5e1' }}>—</span>}
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
                                    size="small"
                                />
                                <Text size={200} style={{ color: '#64748b', fontWeight: 600 }}>
                                    Page {currentPage} of {totalPages}
                                </Text>
                                <Button
                                    icon={<ChevronRight20Regular />}
                                    appearance="subtle"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    size="small"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
