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
} from 'recharts';
import { getSessionEngagementSummary, getCourseEngagementSummary } from '../../services/supabase/engagementService.js';
import { getAllCompletedSessions } from '../../services/supabase/sessionService.js';
import { fetchCourses } from '../../services/supabase/referenceData.js';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('20px'),
    },
    subTabBar: {
        ...shorthands.padding('0', '0', '12px', '0'),
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
    chartCard: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('12px'),
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

const ENGAGEMENT_COLORS = {
    hand_raised: '#2e7d32',
    engaged: '#1976d2',
    speaking: '#0288d1',
    sleeping: '#d32f2f',
    disengaged: '#ed6c02',
};

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

function PerSessionView({ styles }) {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) loadSummary();
    }, [selectedSession]);

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

    const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : '-';

    const selectedSessionInfo = sessions.find(s => s.id === selectedSession);

    const chartData = summary ? [
        { name: 'Hand Raised', value: summary.handRaises, fill: ENGAGEMENT_COLORS.hand_raised },
        { name: 'Engaged', value: summary.engagedEvents, fill: ENGAGEMENT_COLORS.engaged },
        { name: 'Speaking', value: summary.speakingEvents, fill: ENGAGEMENT_COLORS.speaking },
        { name: 'Sleeping', value: summary.sleepingEvents, fill: ENGAGEMENT_COLORS.sleeping },
        { name: 'Disengaged', value: summary.disengagedEvents, fill: ENGAGEMENT_COLORS.disengaged },
    ] : [];

    return (
        <>
            <Card className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <Text size={200} weight="semibold">Select Session</Text>
                    {isLoadingSessions ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Spinner size="tiny" /><Text size={200}>Loading sessions...</Text>
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
            </Card>

            {!selectedSession ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold" size={400}>Select a session to view engagement</Text>
                    <Text size={200}>Choose a completed session from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Spinner size="small" /><Text>Loading engagement data...</Text>
                </div>
            ) : !summary || summary.totalEvents === 0 ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold">No engagement data for this session</Text>
                    <Text size={200}>Engagement events will appear once facial recognition captures hand raises, sleeping, etc.</Text>
                </div>
            ) : (
                <>
                    <div className={styles.summaryGrid}>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Total Events</Text>
                            <Badge appearance="filled" color="brand" size="large">{summary.totalEvents}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Hand Raises</Text>
                            <Badge appearance="filled" color="success" size="large">{summary.handRaises}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Sleeping</Text>
                            <Badge appearance="filled" color="danger" size="large">{summary.sleepingEvents}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Disengaged</Text>
                            <Badge appearance="filled" color="warning" size="large">{summary.disengagedEvents}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Avg Score</Text>
                            <Badge appearance="filled" color="informative" size="large">{summary.avgEngagementScore || '—'}</Badge>
                        </Card>
                    </div>

                    <Card className={styles.chartCard}>
                        <Text weight="semibold" size={400}>Event Distribution</Text>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#1976d2">
                                    {chartData.map((entry, index) => (
                                        <Bar key={index} dataKey="value" fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {summary.studentBreakdown.length > 0 && (
                        <Card className={styles.tableCard}>
                            <Text weight="semibold" size={400}>Per-Student Engagement</Text>
                            <div style={{ overflowX: 'auto' }}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.tableHeader}>Student ID</th>
                                            <th className={styles.tableHeader}>Hand Raised</th>
                                            <th className={styles.tableHeader}>Engaged</th>
                                            <th className={styles.tableHeader}>Speaking</th>
                                            <th className={styles.tableHeader}>Sleeping</th>
                                            <th className={styles.tableHeader}>Disengaged</th>
                                            <th className={styles.tableHeader}>Avg Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.studentBreakdown.map((s, i) => (
                                            <tr key={s.student_id || i}>
                                                <td className={styles.tableCell}>{s.student_id}</td>
                                                <td className={styles.tableCell}>{s.hand_raised}</td>
                                                <td className={styles.tableCell}>{s.engaged}</td>
                                                <td className={styles.tableCell}>{s.speaking}</td>
                                                <td className={styles.tableCell}>{s.sleeping}</td>
                                                <td className={styles.tableCell}>{s.disengaged}</td>
                                                <td className={styles.tableCell}>
                                                    {s.avg_score != null ? (
                                                        <Badge color={Number(s.avg_score) >= 70 ? 'success' : Number(s.avg_score) >= 40 ? 'warning' : 'danger'}>
                                                            {s.avg_score}
                                                        </Badge>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </>
    );
}

function PerCourseView({ styles }) {
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
        const result = await getCourseEngagementSummary(selectedCourse);
        if (result.success) setReportData(result.data);
        else setReportData(null);
        setIsLoading(false);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '-';
    const selectedCourseName = courses.find(c => c.id === selectedCourse);

    const trendChartData = reportData?.sessions?.map(s => ({
        date: formatDate(s.session_date),
        handRaises: s.handRaises,
        sleeping: s.sleepingEvents,
        disengaged: s.disengagedEvents,
        engaged: s.engagedEvents,
        avgScore: s.avgScore ? Number(s.avgScore) : 0,
    })) || [];

    return (
        <>
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
                    <Text weight="semibold" size={400}>Select a course to view engagement</Text>
                    <Text size={200}>Choose a course from the dropdown above.</Text>
                </div>
            ) : isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <Spinner size="small" /><Text>Loading course engagement...</Text>
                </div>
            ) : !reportData || !reportData.totals ? (
                <div className={styles.emptyState}>
                    <Text weight="semibold">No engagement data for this course</Text>
                    <Text size={200}>No sessions or engagement events have been recorded yet.</Text>
                </div>
            ) : (
                <>
                    <div className={styles.summaryGrid}>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Sessions</Text>
                            <Badge appearance="filled" color="brand" size="large">{reportData.totals.totalSessions}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Total Events</Text>
                            <Badge appearance="filled" color="informative" size="large">{reportData.totals.totalEvents}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Hand Raises</Text>
                            <Badge appearance="filled" color="success" size="large">{reportData.totals.handRaises}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Sleeping</Text>
                            <Badge appearance="filled" color="danger" size="large">{reportData.totals.sleepingEvents}</Badge>
                        </Card>
                        <Card className={styles.summaryCard}>
                            <Text size={200} style={{ color: '#666' }}>Avg Score</Text>
                            <Badge appearance="filled" color="informative" size="large">{reportData.totals.avgScore || '—'}</Badge>
                        </Card>
                    </div>

                    {trendChartData.length > 0 && (
                        <Card className={styles.chartCard}>
                            <Text weight="semibold" size={400}>Engagement Trend Across Sessions</Text>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={trendChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="handRaises" fill={ENGAGEMENT_COLORS.hand_raised} name="Hand Raised" />
                                    <Bar dataKey="engaged" fill={ENGAGEMENT_COLORS.engaged} name="Engaged" />
                                    <Bar dataKey="sleeping" fill={ENGAGEMENT_COLORS.sleeping} name="Sleeping" />
                                    <Bar dataKey="disengaged" fill={ENGAGEMENT_COLORS.disengaged} name="Disengaged" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    )}

                    {reportData.sessions.length > 0 && (
                        <Card className={styles.tableCard}>
                            <Text weight="semibold" size={400}>Per-Session Breakdown</Text>
                            <div style={{ overflowX: 'auto' }}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.tableHeader}>Date</th>
                                            <th className={styles.tableHeader}>Events</th>
                                            <th className={styles.tableHeader}>Hand Raised</th>
                                            <th className={styles.tableHeader}>Engaged</th>
                                            <th className={styles.tableHeader}>Sleeping</th>
                                            <th className={styles.tableHeader}>Disengaged</th>
                                            <th className={styles.tableHeader}>Avg Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.sessions.map((s, i) => (
                                            <tr key={s.session_id || i}>
                                                <td className={styles.tableCell}>{formatDate(s.session_date)}</td>
                                                <td className={styles.tableCell}>{s.totalEvents}</td>
                                                <td className={styles.tableCell}>{s.handRaises}</td>
                                                <td className={styles.tableCell}>{s.engagedEvents}</td>
                                                <td className={styles.tableCell}>{s.sleepingEvents}</td>
                                                <td className={styles.tableCell}>{s.disengagedEvents}</td>
                                                <td className={styles.tableCell}>
                                                    {s.avgScore != null ? (
                                                        <Badge color={Number(s.avgScore) >= 70 ? 'success' : Number(s.avgScore) >= 40 ? 'warning' : 'danger'}>
                                                            {s.avgScore}
                                                        </Badge>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </>
    );
}
