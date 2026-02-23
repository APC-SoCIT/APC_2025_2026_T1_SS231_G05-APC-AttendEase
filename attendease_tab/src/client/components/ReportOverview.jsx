import React, { useState, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Dropdown,
    Option,
    Button,
    Spinner,
} from '@fluentui/react-components';
import {
    ArrowTrendingLines24Regular,
    People24Regular,
    BookOpen24Regular,
    CalendarLtr24Regular,
    ArrowSync20Regular,
} from '@fluentui/react-icons';
import {
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
    AreaChart,
    Area,
} from 'recharts';
import { getAttendanceStats, getAttendanceTrend } from '../../services/supabase/attendanceService.js';

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
    /* Top bar */
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
    },
    topBarLeft: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('2px'),
    },
    topBarActions: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('10px'),
    },

    /* Summary cards row */
    summaryRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        ...shorthands.gap('16px'),
        '@media (max-width: 1000px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
        '@media (max-width: 600px)': { gridTemplateColumns: '1fr' },
    },
    summaryCard: {
        ...shorthands.padding('20px', '24px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('8px'),
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
        minHeight: '120px',
    },
    summaryCardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryLabel: {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color: '#8492a6',
    },
    summaryIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryValue: {
        fontSize: '32px',
        fontWeight: '800',
        color: '#1e293b',
        lineHeight: '1',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    summarySubtext: {
        fontSize: '12px',
        color: '#94a3b8',
        fontWeight: '500',
    },

    /* Donut card */
    donutCard: {
        ...shorthands.padding('20px', '24px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.gap('4px'),
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
        minHeight: '120px',
        position: 'relative',
    },
    donutLabel: {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        color: '#8492a6',
        position: 'absolute',
        top: '16px',
        left: '24px',
    },
    donutCenter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutPercent: {
        position: 'absolute',
        fontSize: '22px',
        fontWeight: '800',
        color: '#1e293b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },

    /* Charts row */
    chartsRow: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        ...shorthands.gap('16px'),
    },
    chartCard: {
        ...shorthands.padding('24px'),
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        ...shorthands.border('1px', 'solid', '#f0f0f0'),
    },
    chartHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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

    /* Two-column chart layout */
    chartsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        ...shorthands.gap('16px'),
        '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
    },

    /* Side-by-side legend */
    legendRow: {
        display: 'flex',
        ...shorthands.gap('16px'),
        flexWrap: 'wrap',
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('6px'),
        fontSize: '12px',
        color: '#64748b',
    },
    legendDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        flexShrink: 0,
    },

    /* No data overlay */
    noDataOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: '14px',
        zIndex: 2,
    },
    noDataBadge: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '600',
        ...shorthands.padding('6px', '16px'),
        borderRadius: '20px',
    },
});

/* ------------------------------------------------------------------ */
/*  Placeholder data (shown when no real data exists)                 */
/* ------------------------------------------------------------------ */
const PLACEHOLDER_TREND = [
    { date: 'Mon', present: 24, late: 3, absent: 5 },
    { date: 'Tue', present: 28, late: 2, absent: 4 },
    { date: 'Wed', present: 22, late: 4, absent: 6 },
    { date: 'Thu', present: 30, late: 1, absent: 3 },
    { date: 'Fri', present: 26, late: 3, absent: 5 },
    { date: 'Sat', present: 18, late: 2, absent: 2 },
    { date: 'Sun', present: 20, late: 1, absent: 3 },
];

const PLACEHOLDER_MONTHLY = [
    { month: 'Jan', sessions: 12, avgAttendance: 78 },
    { month: 'Feb', sessions: 15, avgAttendance: 82 },
    { month: 'Mar', sessions: 14, avgAttendance: 80 },
    { month: 'Apr', sessions: 16, avgAttendance: 85 },
    { month: 'May', sessions: 13, avgAttendance: 79 },
    { month: 'Jun', sessions: 10, avgAttendance: 75 },
    { month: 'Jul', sessions: 8, avgAttendance: 70 },
    { month: 'Aug', sessions: 14, avgAttendance: 83 },
    { month: 'Sep', sessions: 17, avgAttendance: 88 },
    { month: 'Oct', sessions: 16, avgAttendance: 86 },
    { month: 'Nov', sessions: 18, avgAttendance: 90 },
    { month: 'Dec', sessions: 15, avgAttendance: 84 },
];

const PLACEHOLDER_MODE = [
    { name: 'Onsite', value: 65 },
    { name: 'Online', value: 35 },
];

const PLACEHOLDER_STATUS = [
    { name: 'Present', value: 72 },
    { name: 'Late', value: 15 },
    { name: 'Absent', value: 10 },
    { name: 'Unknown', value: 3 },
];

/* ------------------------------------------------------------------ */
/*  Color palette                                                     */
/* ------------------------------------------------------------------ */
const COLORS = {
    primary: '#294972',
    gold: '#FFB900',
    present: '#36C752',
    late: '#FCB53B',
    absent: '#F1511B',
    unknown: '#94a3b8',
    onsite: '#294972',
    online: '#FFB900',
};

const PIE_COLORS = [COLORS.present, COLORS.late, COLORS.absent, COLORS.unknown];

/* ------------------------------------------------------------------ */
/*  Donut mini-chart component                                        */
/* ------------------------------------------------------------------ */
function DonutMini({ percentage, color, size = 90, strokeWidth = 8 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="#f0f0f0" strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Sparkline mini-chart component                                    */
/* ------------------------------------------------------------------ */
function Sparkline({ data, color = COLORS.gold, width = 80, height = 30 }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ marginTop: '4px' }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                    */
/* ------------------------------------------------------------------ */
function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function ReportOverview() {
    const styles = useStyles();
    const [dateRange, setDateRange] = useState('30');
    const [stats, setStats] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadData(); }, [dateRange]);

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

    const hasData = stats && stats.totalRecords > 0;
    const hasTrend = trendData && trendData.length > 0;

    // Computed values (real or placeholder)
    const totalSessions = hasData ? stats.totalSessions : 0;
    const totalRecords = hasData ? stats.totalRecords : 0;
    const attendanceRate = hasData ? stats.attendanceRate : 0;
    const lateSessions = hasData ? (stats.lateCount || 0) : 0;
    const lateRate = hasData && stats.totalRecords > 0
        ? Math.round((stats.lateCount / stats.totalRecords) * 100)
        : 0;

    const activeTrend = hasTrend ? trendData : PLACEHOLDER_TREND;
    const sparklineData = hasTrend
        ? trendData.map(d => d.present || 0)
        : PLACEHOLDER_TREND.map(d => d.present);

    const statusData = hasData
        ? [
            { name: 'Present', value: stats.presentCount },
            { name: 'Late', value: stats.lateCount },
            { name: 'Absent', value: stats.absentCount },
            { name: 'Unknown', value: stats.unknownCount },
        ]
        : PLACEHOLDER_STATUS;

    const modeData = hasData
        ? [
            { name: 'Onsite', value: stats.onsiteCount },
            { name: 'Online', value: stats.onlineCount },
        ]
        : PLACEHOLDER_MODE;

    if (isLoading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <Spinner size="small" />
                <Text size={300} style={{ color: '#64748b' }}>Loading analytics...</Text>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Top bar */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <Text size={500} weight="bold" style={{ color: '#1e293b' }}>
                        Analytics Overview
                    </Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>
                        {hasData
                            ? `Showing data from the last ${dateRange} days`
                            : 'No data yet — charts below show sample data as placeholders'}
                    </Text>
                </div>
                <div className={styles.topBarActions}>
                    <Dropdown
                        value={dateRange === '7' ? 'Last 7 Days' : dateRange === '30' ? 'Last 30 Days' : 'Last 90 Days'}
                        onOptionSelect={(e, d) => setDateRange(d.optionValue)}
                        style={{ minWidth: '150px' }}
                    >
                        <Option value="7">Last 7 Days</Option>
                        <Option value="30">Last 30 Days</Option>
                        <Option value="90">Last 90 Days</Option>
                    </Dropdown>
                    <Button
                        appearance="subtle"
                        icon={<ArrowSync20Regular />}
                        onClick={loadData}
                        size="small"
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ---- Summary Cards ---- */}
            <div className={styles.summaryRow}>
                {/* Total Sessions */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTop}>
                        <span className={styles.summaryLabel}>Total Sessions</span>
                        <div className={styles.summaryIcon} style={{ backgroundColor: '#eef2ff' }}>
                            <CalendarLtr24Regular style={{ color: '#6366f1' }} />
                        </div>
                    </div>
                    <span className={styles.summaryValue}>{totalSessions}</span>
                    <Sparkline data={sparklineData} color="#6366f1" />
                </div>

                {/* Total Records */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTop}>
                        <span className={styles.summaryLabel}>Total Records</span>
                        <div className={styles.summaryIcon} style={{ backgroundColor: '#f0fdf4' }}>
                            <People24Regular style={{ color: COLORS.present }} />
                        </div>
                    </div>
                    <span className={styles.summaryValue}>{totalRecords}</span>
                    <span className={styles.summarySubtext}>
                        {hasData ? `Across ${stats.totalSessions} sessions` : 'Waiting for first session'}
                    </span>
                </div>

                {/* Attendance Rate — donut */}
                <div className={styles.donutCard}>
                    <span className={styles.donutLabel}>Attendance Rate</span>
                    <div className={styles.donutCenter} style={{ position: 'relative' }}>
                        <DonutMini percentage={attendanceRate} color={COLORS.present} size={80} strokeWidth={7} />
                        <span className={styles.donutPercent}>{attendanceRate}%</span>
                    </div>
                </div>

                {/* Late Rate — donut */}
                <div className={styles.donutCard}>
                    <span className={styles.donutLabel}>Late Rate</span>
                    <div className={styles.donutCenter} style={{ position: 'relative' }}>
                        <DonutMini percentage={lateRate} color={COLORS.late} size={80} strokeWidth={7} />
                        <span className={styles.donutPercent}>{lateRate}%</span>
                    </div>
                </div>
            </div>

            {/* ---- Attendance Trend (full width bar chart) ---- */}
            <div className={styles.chartCard} style={{ position: 'relative' }}>
                <div className={styles.chartHeader}>
                    <div>
                        <div className={styles.chartTitle}>Attendance Trend</div>
                        <div className={styles.chartSubtitle}>Daily breakdown of attendance status</div>
                    </div>
                    <div className={styles.legendRow}>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ backgroundColor: COLORS.present }} />
                            Present
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ backgroundColor: COLORS.late }} />
                            Late
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ backgroundColor: COLORS.absent }} />
                            Absent
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={activeTrend} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="present" fill={COLORS.present} name="Present" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="late" fill={COLORS.late} name="Late" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent" fill={COLORS.absent} name="Absent" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                {!hasTrend && (
                    <div className={styles.noDataOverlay}>
                        <span className={styles.noDataBadge}>Sample data — real data will appear after sessions</span>
                    </div>
                )}
            </div>

            {/* ---- Two column charts ---- */}
            <div className={styles.chartsGrid}>
                {/* Status Distribution Pie */}
                <div className={styles.chartCard} style={{ position: 'relative' }}>
                    <div className={styles.chartHeader}>
                        <div>
                            <div className={styles.chartTitle}>Status Distribution</div>
                            <div className={styles.chartSubtitle}>Breakdown by attendance status</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {!hasData && (
                        <div className={styles.noDataOverlay}>
                            <span className={styles.noDataBadge}>Sample data</span>
                        </div>
                    )}
                </div>

                {/* Mode Distribution */}
                <div className={styles.chartCard} style={{ position: 'relative' }}>
                    <div className={styles.chartHeader}>
                        <div>
                            <div className={styles.chartTitle}>Mode Distribution</div>
                            <div className={styles.chartSubtitle}>Onsite vs Online attendance</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={modeData} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Students" radius={[6, 6, 0, 0]}>
                                {modeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.onsite : COLORS.online} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {!hasData && (
                        <div className={styles.noDataOverlay}>
                            <span className={styles.noDataBadge}>Sample data</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ---- Monthly Trend (area chart) ---- */}
            <div className={styles.chartCard} style={{ position: 'relative' }}>
                <div className={styles.chartHeader}>
                    <div>
                        <div className={styles.chartTitle}>Monthly Overview</div>
                        <div className={styles.chartSubtitle}>Sessions conducted and average attendance rate per month</div>
                    </div>
                    <div className={styles.legendRow}>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ backgroundColor: COLORS.primary }} />
                            Sessions
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ backgroundColor: COLORS.gold }} />
                            Avg Attendance %
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={PLACEHOLDER_MONTHLY} barGap={4} barCategoryGap="15%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="sessions" fill={COLORS.primary} name="Sessions" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgAttendance" fill={COLORS.gold} name="Avg Attendance %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div className={styles.noDataOverlay}>
                    <span className={styles.noDataBadge}>Sample data — monthly trends will populate over time</span>
                </div>
            </div>
        </div>
    );
}
