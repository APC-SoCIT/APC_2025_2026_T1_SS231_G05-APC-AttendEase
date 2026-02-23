import React, { useState, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Text,
    Badge,
    Dropdown,
    Option,
    Spinner,
    TabList,
    Tab,
} from '@fluentui/react-components';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { getSessionEngagementSummary, getCourseEngagementSummary } from '../../services/supabase/engagementService.js';
import { getAllCompletedSessions } from '../../services/supabase/sessionService.js';
import { fetchCourses } from '../../services/supabase/referenceData.js';

/* ------------------------------------------------------------------ */
/*  Shared Styles                                                     */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('20px'),
    },
    subTabBar: {
        ...shorthands.padding('0', '0', '8px', '0'),
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        ...shorthands.gap('14px'),
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
});

/* ------------------------------------------------------------------ */
/*  Colors — 3 categories                                             */
/* ------------------------------------------------------------------ */
const COLORS = {
    engaged: '#294972',
    present: '#36C752',
    disengaged: '#FCB53B',
};

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                    */
/* ------------------------------------------------------------------ */
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
/*  Engagement badge style                                            */
/* ------------------------------------------------------------------ */
const engagementBadgeStyle = (type) => {
    switch (type) {
        case 'engaged': return { backgroundColor: '#dbeafe', color: '#1e40af' };
        case 'present': return { backgroundColor: '#dcfce7', color: '#166534' };
        case 'disengaged': return { backgroundColor: '#fef3c7', color: '#92400e' };
        default: return { backgroundColor: '#f1f5f9', color: '#64748b' };
    }
};

/* ------------------------------------------------------------------ */
/*  Main Export                                                       */
/* ------------------------------------------------------------------ */
export default function ReportEngagement() {
    const styles = useStyles();
    const [subTab, setSubTab] = useState('per-session');

    return (
        <div className={styles.container}>
            <div className={styles.subTabBar}>
                <TabList selectedValue={subTab} onTabSelect={(e, d) => setSubTab(d.value)}>
                    <Tab value="per-session">Per Session</Tab>
                    <Tab value="per-course">Per Course</Tab>
                </TabList>
            </div>

            {subTab === 'per-session' ? <PerSessionView styles={styles} /> : <PerCourseView styles={styles} />}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Per Session View                                                  */
/* ------------------------------------------------------------------ */
function PerSessionView({ styles }) {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    useEffect(() => { loadSessions(); }, []);
    useEffect(() => { if (selectedSession) loadSummary(); }, [selectedSession]);

    const loadSessions = async () => {
        setIsLoadingSessions(true);
        const result = await getAllCompletedSessions(100);
        if (result.success) setSessions(result.sessions || []);
        setIsLoadingSessions(false);
    };

    const loadSummary = async () => {
        setIsLoading(true);
        const result = await getSessionEngagementSummary(selectedSession);
        if (result.success) setSummary(result.data);
        else setSummary(null);
        setIsLoading(false);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const selectedSessionInfo = sessions.find(s => s.id === selectedSession);

    const chartData = summary ? [
        { name: 'Engaged', value: summary.engagedCount, fill: COLORS.engaged },
        { name: 'Present', value: summary.presentCount, fill: COLORS.present },
        { name: 'Disengaged', value: summary.disengagedCount, fill: COLORS.disengaged },
    ] : [];

    return (
        <>
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Select Session</span>
                    {isLoadingSessions ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Spinner size="tiny" /><Text size={200} style={{ color: '#94a3b8' }}>Loading sessions...</Text>
                        </div>
                    ) : sessions.length === 0 ? (
                        <Text size={200} style={{ color: '#94a3b8' }}>No completed sessions found.</Text>
                    ) : (
                        <Dropdown
                            placeholder="Choose a session..."
                            value={selectedSessionInfo ? `${selectedSessionInfo.courses?.course_code || 'Unknown'} — ${formatDate(selectedSessionInfo.start_time)}` : undefined}
                            onOptionSelect={(e, d) => setSelectedSession(d.optionValue)}
                        >
                            {sessions.map(s => (
                                <Option key={s.id} value={s.id}>
                                    {s.courses?.course_code || 'Unknown'} — {formatDate(s.start_time)}
                                </Option>
                            ))}
                        </Dropdown>
                    )}
                </div>
            </div>

            {!selectedSession ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>Select a session to view engagement</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>Choose a completed session from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <Spinner size="small" /><Text size={300} style={{ color: '#64748b' }}>Loading engagement data...</Text>
                </div>
            ) : !summary || summary.totalEvents === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📈</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>No engagement data for this session</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>Engagement events will appear once captured during sessions.</Text>
                </div>
            ) : (
                <>
                    <div className={styles.summaryRow}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Events</span>
                            <span className={styles.summaryValue}>{summary.totalEvents}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Engaged</span>
                            <span className={styles.summaryValue} style={{ color: COLORS.engaged }}>{summary.engagedCount}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Present</span>
                            <span className={styles.summaryValue} style={{ color: COLORS.present }}>{summary.presentCount}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Disengaged</span>
                            <span className={styles.summaryValue} style={{ color: COLORS.disengaged }}>{summary.disengagedCount}</span>
                        </div>
                    </div>

                    <div className={styles.chartCard}>
                        <div>
                            <div className={styles.chartTitle}>Engagement Distribution</div>
                            <div className={styles.chartSubtitle}>Engagement events captured during this session</div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={chartData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Events" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {summary.studentBreakdown && summary.studentBreakdown.length > 0 && (
                        <div className={styles.tableCard}>
                            <div className={styles.chartTitle}>Per-Student Engagement</div>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.tableHeader}>Student ID</th>
                                            <th className={styles.tableHeader}>Engaged</th>
                                            <th className={styles.tableHeader}>Present</th>
                                            <th className={styles.tableHeader}>Disengaged</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.studentBreakdown.map((s, i) => (
                                            <tr key={s.student_id || i}>
                                                <td className={styles.tableCell} style={{ fontWeight: 600, color: '#294972' }}>{s.student_id}</td>
                                                <td className={styles.tableCell}>{s.engaged}</td>
                                                <td className={styles.tableCell}>{s.present}</td>
                                                <td className={styles.tableCell}>{s.disengaged}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Per Course View                                                   */
/* ------------------------------------------------------------------ */
function PerCourseView({ styles }) {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);

    useEffect(() => { loadCourses(); }, []);
    useEffect(() => { if (selectedCourse) loadReport(); }, [selectedCourse]);

    const loadCourses = async () => {
        setIsLoadingCourses(true);
        const result = await fetchCourses();
        if (result.success) setCourses(result.data);
        setIsLoadingCourses(false);
    };

    const loadReport = async () => {
        setIsLoading(true);
        const result = await getCourseEngagementSummary(selectedCourse);
        if (result.success) setReportData(result.data);
        else setReportData(null);
        setIsLoading(false);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
    const selectedCourseName = courses.find(c => c.id === selectedCourse);

    const trendChartData = reportData?.sessions?.map(s => ({
        date: formatDate(s.session_date),
        engaged: s.engagedCount,
        present: s.presentCount,
        disengaged: s.disengagedCount,
    })) || [];

    return (
        <>
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Select Course</span>
                    {isLoadingCourses ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Spinner size="tiny" /><Text size={200} style={{ color: '#94a3b8' }}>Loading courses...</Text>
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
            </div>

            {!selectedCourse ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📚</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>Select a course to view engagement</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>Choose a course from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <Spinner size="small" /><Text size={300} style={{ color: '#64748b' }}>Loading course engagement...</Text>
                </div>
            ) : !reportData || !reportData.totals ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📈</div>
                    <Text weight="semibold" size={400} style={{ color: '#334155' }}>No engagement data for this course</Text>
                    <Text size={200} style={{ color: '#94a3b8' }}>No sessions or engagement events have been recorded yet.</Text>
                </div>
            ) : (
                <>
                    <div className={styles.summaryRow}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Sessions</span>
                            <span className={styles.summaryValue}>{reportData.totals.totalSessions}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Events</span>
                            <span className={styles.summaryValue}>{reportData.totals.totalEvents}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Engaged</span>
                            <span className={styles.summaryValue} style={{ color: COLORS.engaged }}>{reportData.totals.engagedCount}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Present</span>
                            <span className={styles.summaryValue} style={{ color: COLORS.present }}>{reportData.totals.presentCount}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Disengaged</span>
                            <span className={styles.summaryValue} style={{ color: COLORS.disengaged }}>{reportData.totals.disengagedCount}</span>
                        </div>
                    </div>

                    {trendChartData.length > 0 && (
                        <div className={styles.chartCard}>
                            <div>
                                <div className={styles.chartTitle}>Engagement Trend Across Sessions</div>
                                <div className={styles.chartSubtitle}>How engagement metrics changed over sessions</div>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={trendChartData} barGap={2} barCategoryGap="15%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="engaged" fill={COLORS.engaged} name="Engaged" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="present" fill={COLORS.present} name="Present" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="disengaged" fill={COLORS.disengaged} name="Disengaged" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {reportData.sessions && reportData.sessions.length > 0 && (
                        <div className={styles.tableCard}>
                            <div className={styles.chartTitle}>Per-Session Breakdown</div>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.tableHeader}>Date</th>
                                            <th className={styles.tableHeader}>Events</th>
                                            <th className={styles.tableHeader}>Engaged</th>
                                            <th className={styles.tableHeader}>Present</th>
                                            <th className={styles.tableHeader}>Disengaged</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.sessions.map((s, i) => (
                                            <tr key={s.session_id || i}>
                                                <td className={styles.tableCell} style={{ fontWeight: 600 }}>{formatDate(s.session_date)}</td>
                                                <td className={styles.tableCell}>{s.totalEvents}</td>
                                                <td className={styles.tableCell}>{s.engagedCount}</td>
                                                <td className={styles.tableCell}>{s.presentCount}</td>
                                                <td className={styles.tableCell}>{s.disengagedCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
