import React, { useState, useMemo, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Badge,
    Dropdown,
    Option,
    Button,
    Spinner,
} from '@fluentui/react-components';
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
    ResponsiveContainer,
} from 'recharts';
import { getAttendanceStats, getAttendanceTrend } from '../../services/supabase/attendanceService.js';

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
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        minWidth: '160px',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    chartsSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        ...shorthands.gap('16px'),
    },
    chartCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('12px'),
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

const COLORS = {
    Present: '#2e7d32',
    Late: '#ed6c02',
    Absent: '#d32f2f',
    Unknown: '#757575',
    Onsite: '#1976d2',
    Online: '#9c27b0',
};
const PIE_COLORS = ['#2e7d32', '#ed6c02', '#d32f2f', '#757575'];

export default function ReportOverview() {
    const styles = useStyles();
    const [dateRange, setDateRange] = useState('30');
    const [stats, setStats] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setIsLoading(true);
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [statsResult, trendResult] = await Promise.all([
            getAttendanceStats({ startDate: startDate.toISOString() }),
            getAttendanceTrend(days),
        ]);

        if (statsResult.success) setStats(statsResult.data);
        if (trendResult.success) setTrendData(trendResult.data);
        setIsLoading(false);
    };

    const formatDate = (date) => {
        if (!date) return 'No data';
        return new Date(date).toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const modeData = stats ? [
        { name: 'Onsite', value: stats.onsiteCount },
        { name: 'Online', value: stats.onlineCount },
    ] : [];

    const statusData = stats ? [
        { name: 'Present', value: stats.presentCount },
        { name: 'Late', value: stats.lateCount },
        { name: 'Absent', value: stats.absentCount },
        { name: 'Unknown', value: stats.unknownCount },
    ] : [];

    if (isLoading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Spinner size="small" />
                <Text>Loading overview...</Text>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Filter */}
            <Card className={styles.filterBar} style={{ padding: '16px' }}>
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
                <Button appearance="outline" onClick={loadData}>Refresh</Button>
            </Card>

            {/* Summary Cards */}
            {!stats || stats.totalRecords === 0 ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold" size={400}>No attendance data found</Text>
                    <Text size={200}>Attendance records will appear here once sessions are conducted.</Text>
                </div>
            ) : (
                <>
                    <div className={styles.summaryGrid}>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Total Sessions</Text>
                            <Badge appearance="filled" color="brand" size="extra-large">{stats.totalSessions}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Total Records</Text>
                            <Badge appearance="filled" color="informative" size="extra-large">{stats.totalRecords}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Attendance Rate</Text>
                            <Badge appearance="filled" color="success" size="extra-large">{stats.attendanceRate}%</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={300} style={{ color: '#666' }}>Latest Session</Text>
                            <Text size={200}>{formatDate(stats.latestSession)}</Text>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className={styles.chartsSection}>
                        <Card className={styles.chartCard}>
                            <Text weight="semibold" size={400}>Attendance Trend</Text>
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
                </>
            )}
        </div>
    );
}
