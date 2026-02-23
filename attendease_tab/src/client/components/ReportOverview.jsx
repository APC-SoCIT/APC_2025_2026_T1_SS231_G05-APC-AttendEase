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
});

/* ------------------------------------------------------------------ */
/*  Color palette                                                     */
/* ------------------------------------------------------------------ */
const COLORS = {
    primary: '#294972',
    gold: '#FFB900',
    present: '#36C752',
    absent: '#F1511B',
    onsite: '#294972',
    online: '#FFB900',
};

const PIE_COLORS = [COLORS.present, COLORS.absent];

/* ------------------------------------------------------------------ */
/*  Date range helper                                                 */
/* ------------------------------------------------------------------ */
function computeDateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - Number(days));
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    return `${fmt(start)} — ${fmt(end)}`;
}

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

    // Computed values
    const totalSessions = hasData ? stats.totalSessions : 0;
    const totalRecords = hasData ? stats.totalRecords : 0;
    const attendanceRate = hasData ? stats.attendanceRate : 0;
    const onsiteCount = hasData ? stats.onsiteCount : 0;
    const onlineCount = hasData ? stats.onlineCount : 0;
    const onsiteRate = totalRecords > 0 ? Math.round((onsiteCount / totalRecords) * 100) : 0;

    const sparklineData = hasTrend
        ? trendData.map(d => d.present || 0)
        : [];

    const modeData = hasData
        ? [
            { name: 'Onsite', value: stats.onsiteCount },
            { name: 'Online', value: stats.onlineCount },
        ].filter(d => d.value > 0)
        : [];

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
                        {computeDateRange(dateRange)}
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

            {!hasData ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>No attendance data available</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>Attendance records will appear here once sessions are completed.</Text>
                </div>
            ) : (
                <>
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
                            {sparklineData.length > 0 && <Sparkline data={sparklineData} color="#6366f1" />}
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
                                Across {stats.totalSessions} sessions
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

                        {/* Onsite Rate — donut */}
                        <div className={styles.donutCard}>
                            <span className={styles.donutLabel}>Onsite Rate</span>
                            <div className={styles.donutCenter} style={{ position: 'relative' }}>
                                <DonutMini percentage={onsiteRate} color={COLORS.onsite} size={80} strokeWidth={7} />
                                <span className={styles.donutPercent}>{onsiteRate}%</span>
                            </div>
                        </div>
                    </div>

                    {/* ---- Attendance Trend (full width bar chart) ---- */}
                    {hasTrend && (
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <div>
                                    <div className={styles.chartTitle}>Attendance Trend</div>
                                    <div className={styles.chartSubtitle}>Daily breakdown of attendance mode</div>
                                </div>
                                <div className={styles.legendRow}>
                                    <div className={styles.legendItem}>
                                        <div className={styles.legendDot} style={{ backgroundColor: COLORS.onsite }} />
                                        Onsite
                                    </div>
                                    <div className={styles.legendItem}>
                                        <div className={styles.legendDot} style={{ backgroundColor: COLORS.online }} />
                                        Online
                                    </div>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={trendData} barGap={2} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="onsite" fill={COLORS.onsite} name="Onsite" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="online" fill={COLORS.online} name="Online" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ---- Two column charts ---- */}
                    <div className={styles.chartsGrid}>
                        {/* Mode Distribution Pie */}
                        {modeData.length > 0 && (
                            <div className={styles.chartCard}>
                                <div className={styles.chartHeader}>
                                    <div>
                                        <div className={styles.chartTitle}>Mode Distribution</div>
                                        <div className={styles.chartSubtitle}>Onsite vs Online attendance</div>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={modeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={85}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {modeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === 'Onsite' ? COLORS.onsite : COLORS.online} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Mode Distribution Bar */}
                        {modeData.length > 0 && (
                            <div className={styles.chartCard}>
                                <div className={styles.chartHeader}>
                                    <div>
                                        <div className={styles.chartTitle}>Mode Comparison</div>
                                        <div className={styles.chartSubtitle}>Students attending Onsite vs Online</div>
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
                                                <Cell key={`cell-${index}`} fill={entry.name === 'Onsite' ? COLORS.onsite : COLORS.online} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
