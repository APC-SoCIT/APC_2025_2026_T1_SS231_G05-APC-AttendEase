import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Button,
    Dropdown,
    Option,
    Badge,
    Input,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem
} from '@fluentui/react-components';
import {
    ArrowCircleLeft24Regular,
    ArrowDownload24Regular,
    Search24Regular,
    ChevronLeft20Regular,
    ChevronRight20Regular
} from '@fluentui/react-icons';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { mockReportData, getSessionsByDateRange, getSessionsByCourse, filterRecordsByStatus, filterRecordsByMode, calculateStats } from '../utils/mockReportData';
import { exportToCSV, exportToPDF } from '../utils/reportExports';

const useStyles = makeStyles({
    container: {
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(to right, rgb(66, 59, 34), #FFCC00)',
        ...shorthands.padding('40px'),
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '24px',
        color: 'white'
    },
    headerTitle: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        color: 'white'
    },
    actions: {
        display: 'flex',
        ...shorthands.gap('12px')
    },
    content: {
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('20px')
    },
    filterBar: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
        alignItems: 'flex-end'
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        minWidth: '160px'
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        ...shorthands.gap('16px')
    },
    summaryCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('8px'),
        alignItems: 'center',
        textAlign: 'center'
    },
    chartsSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        ...shorthands.gap('16px')
    },
    chartCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('12px')
    },
    tableCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px')
    },
    tableControls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...shorthands.gap('12px')
    },
    searchBox: {
        minWidth: '250px'
    },
    exportActions: {
        display: 'flex',
        ...shorthands.gap('8px'),
        alignItems: 'center'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        textAlign: 'left',
        ...shorthands.padding('12px'),
        fontWeight: '600',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: '#e0e0e0'
        }
    },
    tableCell: {
        ...shorthands.padding('12px'),
        ...shorthands.borderBottom('1px', 'solid', '#e0e0e0')
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...shorthands.gap('12px'),
        marginTop: '16px'
    }
});

const COLORS = {
    Present: '#2e7d32',
    Late: '#ed6c02',
    Absent: '#d32f2f',
    Unknown: '#757575',
    Onsite: '#1976d2',
    Online: '#9c27b0'
};

const PIE_COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#757575'];

function AdminReports() {
    const styles = useStyles();
    const navigate = useNavigate();

    // Filter states
    const [dateRange, setDateRange] = useState('30'); // days
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedMode, setSelectedMode] = useState('all');

    // Table states
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(25);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Calculate filtered data
    const filteredSessions = useMemo(() => {
        let sessions = [...mockReportData.sessions];

        // Date range filter
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
        sessions = getSessionsByDateRange(sessions, startDate, endDate);

        // Course filter
        sessions = getSessionsByCourse(sessions, selectedCourse);

        // Status filter
        sessions = filterRecordsByStatus(sessions, selectedStatus);

        // Mode filter
        sessions = filterRecordsByMode(sessions, selectedMode);

        return sessions;
    }, [dateRange, selectedCourse, selectedStatus, selectedMode]);

    // Calculate statistics
    const stats = useMemo(() => calculateStats(filteredSessions), [filteredSessions]);

    // Flatten records for table
    const tableRecords = useMemo(() => {
        const records = [];
        filteredSessions.forEach(session => {
            session.records.forEach(record => {
                records.push({
                    sessionDate: session.date,
                    courseCode: session.courseCode,
                    courseName: session.courseName,
                    studentId: record.studentId,
                    studentName: record.name,
                    mode: record.mode,
                    status: record.status,
                    confidence: record.confidence,
                    checkInTime: record.checkInTime,
                    duration: record.duration
                });
            });
        });
        return records;
    }, [filteredSessions]);

    // Search filter
    const searchedRecords = useMemo(() => {
        if (!searchQuery) return tableRecords;
        const query = searchQuery.toLowerCase();
        return tableRecords.filter(record =>
            record.studentName.toLowerCase().includes(query) ||
            record.courseCode.toLowerCase().includes(query) ||
            record.courseName.toLowerCase().includes(query) ||
            record.status.toLowerCase().includes(query)
        );
    }, [tableRecords, searchQuery]);

    // Sort records
    const sortedRecords = useMemo(() => {
        if (!sortConfig.key) return searchedRecords;

        const sorted = [...searchedRecords].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [searchedRecords, sortConfig]);

    // Pagination
    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * recordsPerPage;
        return sortedRecords.slice(startIndex, startIndex + recordsPerPage);
    }, [sortedRecords, currentPage, recordsPerPage]);

    const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

    // Chart data
    const trendData = useMemo(() => {
        const dailyStats = {};

        filteredSessions.forEach(session => {
            const dateKey = new Date(session.date).toLocaleDateString();
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { date: dateKey, present: 0, late: 0, absent: 0 };
            }

            session.records.forEach(record => {
                if (record.status === 'Present') dailyStats[dateKey].present++;
                else if (record.status === 'Late') dailyStats[dateKey].late++;
                else if (record.status === 'Absent') dailyStats[dateKey].absent++;
            });
        });

        return Object.values(dailyStats).slice(-10); // Last 10 days
    }, [filteredSessions]);

    const modeData = [
        { name: 'Onsite', value: stats.onsiteCount },
        { name: 'Online', value: stats.onlineCount }
    ];

    const statusData = [
        { name: 'Present', value: stats.presentCount },
        { name: 'Late', value: stats.lateCount },
        { name: 'Absent', value: stats.absentCount },
        { name: 'Unknown', value: stats.unknownCount }
    ];

    // Handlers
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleExport = (format) => {
        const filename = `attendance_report_${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'csv':
                exportToCSV(filteredSessions, filename);
                break;
            case 'pdf':
                exportToPDF(filteredSessions, stats, filename);
                break;
            default:
                break;
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Text weight="bold" size={600}>View Reports</Text>
                    <Text size={300} style={{ color: '#ffffff' }}>
                        Attendance analytics and export history
                    </Text>
                </div>
                <div className={styles.actions}>
                    <Button
                        appearance="secondary"
                        icon={<ArrowCircleLeft24Regular />}
                        onClick={() => navigate('/admin')}
                    >
                        Back
                    </Button>
                </div>
            </div>

            <div className={styles.content}>
                {/* Filter Bar */}
                <Card className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <Text size={200} weight="semibold">Date Range</Text>
                        <Dropdown
                            value={dateRange === '7' ? 'Last 7 Days' : dateRange === '30' ? 'Last 30 Days' : 'Last 90 Days'}
                            onOptionSelect={(e, data) => setDateRange(data.optionValue)}
                        >
                            <Option value="7">Last 7 Days</Option>
                            <Option value="30">Last 30 Days</Option>
                            <Option value="90">Last 90 Days</Option>
                        </Dropdown>
                    </div>

                    <div className={styles.filterGroup}>
                        <Text size={200} weight="semibold">Course</Text>
                        <Dropdown
                            value={selectedCourse === 'all' ? 'All Courses' : mockReportData.courses.find(c => c.id === selectedCourse)?.name}
                            onOptionSelect={(e, data) => setSelectedCourse(data.optionValue)}
                        >
                            <Option value="all">All Courses</Option>
                            {mockReportData.courses.map(course => (
                                <Option key={course.id} value={course.id}>{course.name}</Option>
                            ))}
                        </Dropdown>
                    </div>

                    <div className={styles.filterGroup}>
                        <Text size={200} weight="semibold">Status</Text>
                        <Dropdown
                            value={selectedStatus === 'all' ? 'All Statuses' : selectedStatus}
                            onOptionSelect={(e, data) => setSelectedStatus(data.optionValue)}
                        >
                            <Option value="all">All Statuses</Option>
                            <Option value="Present">Present</Option>
                            <Option value="Late">Late</Option>
                            <Option value="Absent">Absent</Option>
                            <Option value="Unknown">Unknown</Option>
                        </Dropdown>
                    </div>

                    <div className={styles.filterGroup}>
                        <Text size={200} weight="semibold">Mode</Text>
                        <Dropdown
                            value={selectedMode === 'all' ? 'All Modes' : selectedMode}
                            onOptionSelect={(e, data) => setSelectedMode(data.optionValue)}
                        >
                            <Option value="all">All Modes</Option>
                            <Option value="Onsite">Onsite</Option>
                            <Option value="Online">Online</Option>
                        </Dropdown>
                    </div>

                    <Button
                        appearance="outline"
                        onClick={() => {
                            setDateRange('30');
                            setSelectedCourse('all');
                            setSelectedStatus('all');
                            setSelectedMode('all');
                        }}
                    >
                        Reset Filters
                    </Button>
                </Card>

                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <Card className={styles.summaryCard}>
                        <Text size={300} style={{ color: '#666' }}>Total Sessions</Text>
                        <Badge appearance="filled" color="brand" size="extra-large">
                            {stats.totalSessions}
                        </Badge>
                    </Card>

                    <Card className={styles.summaryCard}>
                        <Text size={300} style={{ color: '#666' }}>Total Records</Text>
                        <Badge appearance="filled" color="informative" size="extra-large">
                            {stats.totalRecords}
                        </Badge>
                    </Card>

                    <Card className={styles.summaryCard}>
                        <Text size={300} style={{ color: '#666' }}>Attendance Rate</Text>
                        <Badge appearance="filled" color="success" size="extra-large">
                            {stats.attendanceRate}%
                        </Badge>
                    </Card>

                    <Card className={styles.summaryCard}>
                        <Text size={300} style={{ color: '#666' }}>Latest Session</Text>
                        <Text size={200}>
                            {filteredSessions.length > 0 ? formatDate(filteredSessions[0].date) : 'No data'}
                        </Text>
                    </Card>
                </div>

                {/* Charts */}
                <div className={styles.chartsSection}>
                    {/* Trend Chart */}
                    <Card className={styles.chartCard}>
                        <Text weight="semibold" size={400}>Attendance Trend (Last 10 Days)</Text>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="present" stroke={COLORS.Present} name="Present" />
                                <Line type="monotone" dataKey="late" stroke={COLORS.Late} name="Late" />
                                <Line type="monotone" dataKey="absent" stroke={COLORS.Absent} name="Absent" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Mode Distribution */}
                    <Card className={styles.chartCard}>
                        <Text weight="semibold" size={400}>Mode Distribution</Text>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={modeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill={COLORS.Onsite}>
                                    {modeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.Onsite : COLORS.Online} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Status Distribution */}
                    <Card className={styles.chartCard}>
                        <Text weight="semibold" size={400}>Status Distribution</Text>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Data Table */}
                <Card className={styles.tableCard}>
                    <div className={styles.tableControls}>
                        <Input
                            className={styles.searchBox}
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            contentBefore={<Search24Regular />}
                        />

                        <div className={styles.exportActions}>
                            <Text size={200} style={{ color: '#666' }}>
                                {sortedRecords.length} records
                            </Text>
                            <Menu>
                                <MenuTrigger>
                                    <Button icon={<ArrowDownload24Regular />} appearance="primary">
                                        Export
                                    </Button>
                                </MenuTrigger>
                                <MenuPopover>
                                    <MenuList>
                                        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
                                        <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
                                    </MenuList>
                                </MenuPopover>
                            </Menu>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.tableHeader} onClick={() => handleSort('sessionDate')}>
                                        Session Date {sortConfig.key === 'sessionDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className={styles.tableHeader} onClick={() => handleSort('courseCode')}>
                                        Course {sortConfig.key === 'courseCode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className={styles.tableHeader} onClick={() => handleSort('studentName')}>
                                        Student {sortConfig.key === 'studentName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className={styles.tableHeader} onClick={() => handleSort('mode')}>
                                        Mode {sortConfig.key === 'mode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className={styles.tableHeader} onClick={() => handleSort('status')}>
                                        Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className={styles.tableHeader}>Confidence</th>
                                    <th className={styles.tableHeader}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((record, index) => (
                                    <tr key={index}>
                                        <td className={styles.tableCell}>{formatDate(record.sessionDate)}</td>
                                        <td className={styles.tableCell}>{record.courseCode}</td>
                                        <td className={styles.tableCell}>{record.studentName}</td>
                                        <td className={styles.tableCell}>
                                            <Badge color={record.mode === 'Onsite' ? 'informative' : 'brand'}>
                                                {record.mode}
                                            </Badge>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <Badge
                                                color={
                                                    record.status === 'Present' ? 'success' :
                                                        record.status === 'Late' ? 'warning' :
                                                            record.status === 'Absent' ? 'danger' :
                                                                'subtle'
                                                }
                                            >
                                                {record.status}
                                            </Badge>
                                        </td>
                                        <td className={styles.tableCell}>
                                            {record.confidence ? `${record.confidence}%` : 'N/A'}
                                        </td>
                                        <td className={styles.tableCell}>{record.duration || 0} min</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <Button
                                icon={<ChevronLeft20Regular />}
                                appearance="subtle"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            />
                            <Text size={200}>
                                Page {currentPage} of {totalPages}
                            </Text>
                            <Button
                                icon={<ChevronRight20Regular />}
                                appearance="subtle"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default AdminReports;
