import React, { useState, useEffect } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    Button,
    Dropdown,
    Option,
    Spinner,
    Badge,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    Divider,
} from '@fluentui/react-components';
import {
    ArrowDownload24Regular,
    DocumentBulletList24Regular,
    PeopleTeam24Regular,
    Video24Regular,
} from '@fluentui/react-icons';
import { getAttendanceForExport } from '../../services/supabase/attendanceService.js';
import { getEngagementForExport } from '../../services/supabase/engagementService.js';
import { fetchCourses } from '../../services/supabase/referenceData.js';
import { exportAttendanceCSV, exportAttendancePDF, exportEngagementCSV, exportEngagementPDF } from '../utils/reportExports.js';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
    reportTypeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        ...shorthands.gap('20px'),
    },
    reportCard: {
        ...shorthands.padding('24px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
        ...shorthands.border('2px', 'solid', '#e2e8f0'),
        borderRadius: '12px',
        cursor: 'pointer',
        transitionProperty: 'border-color, box-shadow',
        transitionDuration: '150ms',
        '&:hover': {
            borderColor: '#3b82f6',
            boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
        },
    },
    reportCardSelected: {
        ...shorthands.padding('24px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
        ...shorthands.border('2px', 'solid', '#3b82f6'),
        borderRadius: '12px',
        backgroundColor: '#f0f7ff',
    },
    reportIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    reportHeader: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('12px'),
    },
    filterSection: {
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    filterRow: {
        display: 'flex',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
        alignItems: 'flex-end',
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        minWidth: '200px',
    },
    exportActions: {
        display: 'flex',
        ...shorthands.gap('12px'),
        justifyContent: 'flex-end',
        ...shorthands.padding('16px', '0'),
    },
    meetingsList: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('8px'),
        maxHeight: '300px',
        overflowY: 'auto',
    },
    meetingItem: {
        ...shorthands.padding('12px', '14px'),
        ...shorthands.border('1px', 'solid', '#e0e0e0'),
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#fafafa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transitionProperty: 'background-color, border-color',
        transitionDuration: '150ms',
        '&:hover': {
            backgroundColor: '#e8f0fe',
            borderColor: '#0078d4',
        },
    },
    meetingItemSelected: {
        ...shorthands.padding('12px', '14px'),
        ...shorthands.border('2px', 'solid', '#0078d4'),
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#e8f0fe',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    attendanceTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        textAlign: 'left',
        ...shorthands.padding('8px', '10px'),
        fontWeight: 600,
        fontSize: '12px',
        color: '#444',
        ...shorthands.borderBottom('2px', 'solid', '#ddd'),
    },
    tableCell: {
        ...shorthands.padding('8px', '10px'),
        ...shorthands.borderBottom('1px', 'solid', '#eee'),
        verticalAlign: 'middle',
    },
});

export default function ReportGenerate() {
    const styles = useStyles();

    const [reportType, setReportType] = useState(null); // 'attendance', 'engagement', or 'teams'
    const [dateRange, setDateRange] = useState('30');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [courses, setCourses] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);

    // Teams state
    const [graphStatus, setGraphStatus] = useState('checking'); // checking | configured | not_configured
    const [meetings, setMeetings] = useState([]);
    const [meetingsLoading, setMeetingsLoading] = useState(false);
    const [meetingsError, setMeetingsError] = useState('');
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [teamsAttendance, setTeamsAttendance] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    useEffect(() => {
        loadCourses();
        checkGraphStatus();
    }, []);

    // Auto-load meetings when Teams report type is selected
    useEffect(() => {
        if (reportType === 'teams' && graphStatus === 'configured' && meetings.length === 0) {
            loadMeetings();
        }
    }, [reportType, graphStatus]);

    const checkGraphStatus = async () => {
        try {
            const res = await fetch('/api/attendance/graph-status');
            const data = await res.json();
            setGraphStatus(data.status);
        } catch {
            setGraphStatus('not_configured');
        }
    };

    const loadMeetings = async () => {
        setMeetingsLoading(true);
        setMeetingsError('');
        try {
            const res = await fetch('/api/graph/app/meetings');
            const data = await res.json();
            if (data.status === 'success') {
                setMeetings(data.meetings || []);
            } else {
                setMeetingsError(data.message || 'Failed to load meetings.');
            }
        } catch (err) {
            setMeetingsError('Could not connect to Graph API. Is the server running?');
        }
        setMeetingsLoading(false);
    };

    const handleMeetingSelect = async (meeting) => {
        setSelectedMeeting(meeting);
        setAttendanceLoading(true);
        setTeamsAttendance([]);
        setExportMessage(null);
        try {
            const res = await fetch(`/api/graph/app/attendance/${meeting.id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setTeamsAttendance(data.students || []);
            } else if (data.status === 'no_data') {
                setTeamsAttendance([]);
                setExportMessage({ type: 'warning', text: data.message || 'No attendance data available yet.' });
            } else {
                setExportMessage({ type: 'error', text: data.message || 'Failed to fetch attendance.' });
            }
        } catch (err) {
            setExportMessage({ type: 'error', text: `Error fetching attendance: ${err.message}` });
        }
        setAttendanceLoading(false);
    };

    const exportTeamsCSV = () => {
        if (!teamsAttendance.length) return;
        const headers = ['Student Name', 'Email', 'Status', 'Join Time', 'Leave Time', 'Duration (min)', 'Role'];
        const rows = teamsAttendance.map(s => [
            s.name || 'Unknown',
            s.email || 'N/A',
            s.status || 'N/A',
            s.joinTime ? new Date(s.joinTime).toLocaleString() : 'N/A',
            s.leaveTime ? new Date(s.leaveTime).toLocaleString() : 'N/A',
            s.duration != null ? Math.round(s.duration / 60) : 'N/A',
            s.role || 'N/A',
        ]);
        const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teams_attendance_${selectedMeeting?.subject || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setExportMessage({ type: 'success', text: 'Teams attendance exported as CSV successfully!' });
    };

    const loadCourses = async () => {
        setIsLoadingCourses(true);
        const result = await fetchCourses();
        if (result.success) setCourses(result.data);
        setIsLoadingCourses(false);
    };

    const getFilters = () => {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return {
            startDate: startDate.toISOString(),
            courseId: selectedCourse !== 'all' ? selectedCourse : undefined,
        };
    };

    const handleExport = async (format) => {
        if (!reportType) return;

        setIsExporting(true);
        setExportMessage(null);

        try {
            const filters = getFilters();

            if (reportType === 'attendance') {
                const result = await getAttendanceForExport(filters);
                if (!result.success || !result.data?.length) {
                    setExportMessage({ type: 'warning', text: 'No attendance data found for the selected filters.' });
                    setIsExporting(false);
                    return;
                }
                if (format === 'csv') exportAttendanceCSV(result.data);
                else exportAttendancePDF(result.data);
            } else {
                const result = await getEngagementForExport(filters);
                if (!result.success || !result.data?.length) {
                    setExportMessage({ type: 'warning', text: 'No engagement data found for the selected filters.' });
                    setIsExporting(false);
                    return;
                }
                if (format === 'csv') exportEngagementCSV(result.data);
                else exportEngagementPDF(result.data);
            }

            setExportMessage({ type: 'success', text: `${reportType === 'attendance' ? 'Attendance' : 'Engagement'} report exported as ${format.toUpperCase()} successfully!` });
        } catch (err) {
            setExportMessage({ type: 'error', text: `Export failed: ${err.message}` });
        }

        setIsExporting(false);
    };

    return (
        <div className={styles.container}>
            <Text size={300} style={{ color: '#64748b' }}>
                Select a report type, configure filters, then export as CSV or PDF.
            </Text>

            {/* Report Type Selection */}
            <div className={styles.reportTypeGrid}>
                <Card
                    className={reportType === 'attendance' ? styles.reportCardSelected : styles.reportCard}
                    onClick={() => setReportType('attendance')}
                >
                    <div className={styles.reportHeader}>
                        <div className={styles.reportIcon} style={{ backgroundColor: '#eef2ff' }}>
                            <DocumentBulletList24Regular style={{ color: '#4f46e5', width: 24, height: 24 }} />
                        </div>
                        <div>
                            <Text weight="semibold" size={400}>Attendance Report</Text>
                            <Text size={200} style={{ color: '#64748b', display: 'block' }}>
                                Export attendance records with student details, check-in times, status, and mode.
                            </Text>
                        </div>
                    </div>
                    {reportType === 'attendance' && <Badge appearance="filled" color="brand">Selected</Badge>}
                </Card>

                <Card
                    className={reportType === 'engagement' ? styles.reportCardSelected : styles.reportCard}
                    onClick={() => setReportType('engagement')}
                >
                    <div className={styles.reportHeader}>
                        <div className={styles.reportIcon} style={{ backgroundColor: '#fef3c7' }}>
                            <PeopleTeam24Regular style={{ color: '#d97706', width: 24, height: 24 }} />
                        </div>
                        <div>
                            <Text weight="semibold" size={400}>Engagement Report</Text>
                            <Text size={200} style={{ color: '#64748b', display: 'block' }}>
                                Export engagement events: hand raises, sleeping, disengagement scores per session.
                            </Text>
                        </div>
                    </div>
                    {reportType === 'engagement' && <Badge appearance="filled" color="brand">Selected</Badge>}
                </Card>

                <Card
                    className={reportType === 'teams' ? styles.reportCardSelected : styles.reportCard}
                    onClick={() => setReportType('teams')}
                >
                    <div className={styles.reportHeader}>
                        <div className={styles.reportIcon} style={{ backgroundColor: '#ede9fe' }}>
                            <Video24Regular style={{ color: '#7c3aed', width: 24, height: 24 }} />
                        </div>
                        <div>
                            <Text weight="semibold" size={400}>Teams Attendance</Text>
                            <Text size={200} style={{ color: '#64748b', display: 'block' }}>
                                Fetch post-meeting attendance from Microsoft Teams. Select a completed meeting to download data.
                            </Text>
                        </div>
                    </div>
                    {graphStatus === 'configured' && (
                        <Badge appearance="tint" color="success" size="small">Graph API Connected</Badge>
                    )}
                    {graphStatus === 'not_configured' && (
                        <Badge appearance="tint" color="danger" size="small">Graph API Not Configured</Badge>
                    )}
                    {reportType === 'teams' && <Badge appearance="filled" color="brand">Selected</Badge>}
                </Card>
            </div>

            {/* Filters & Export (Attendance / Engagement) */}
            {reportType && reportType !== 'teams' && (
                <Card className={styles.filterSection}>
                    <Text weight="semibold" size={400}>Configure Filters</Text>
                    <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                            <Text size={200} weight="semibold">Date Range</Text>
                            <Dropdown
                                value={dateRange === '7' ? 'Last 7 Days' : dateRange === '30' ? 'Last 30 Days' : dateRange === '90' ? 'Last 90 Days' : 'All Time'}
                                onOptionSelect={(e, d) => setDateRange(d.optionValue)}
                            >
                                <Option value="7">Last 7 Days</Option>
                                <Option value="30">Last 30 Days</Option>
                                <Option value="90">Last 90 Days</Option>
                                <Option value="365">All Time</Option>
                            </Dropdown>
                        </div>

                        <div className={styles.filterGroup}>
                            <Text size={200} weight="semibold">Course</Text>
                            {isLoadingCourses ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Spinner size="tiny" /><Text size={200}>Loading...</Text>
                                </div>
                            ) : (
                                <Dropdown
                                    value={selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.course_code || 'All Courses'}
                                    onOptionSelect={(e, d) => setSelectedCourse(d.optionValue)}
                                >
                                    <Option value="all">All Courses</Option>
                                    {courses.map(c => (
                                        <Option key={c.id} value={c.id}>{c.course_code} — {c.description}</Option>
                                    ))}
                                </Dropdown>
                            )}
                        </div>
                    </div>

                    <div className={styles.exportActions}>
                        <Button
                            icon={<ArrowDownload24Regular />}
                            appearance="outline"
                            onClick={() => handleExport('csv')}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </Button>
                        <Button
                            icon={<ArrowDownload24Regular />}
                            appearance="primary"
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Teams Attendance Section */}
            {reportType === 'teams' && (
                <Card className={styles.filterSection}>
                    {graphStatus === 'not_configured' ? (
                        <MessageBar intent="error">
                            <MessageBarBody>
                                <MessageBarTitle>Graph API Not Configured</MessageBarTitle>
                                Add AAD_APP_CLIENT_ID, AAD_APP_CLIENT_SECRET, and AAD_APP_TENANT_ID to your environment variables and restart the server.
                            </MessageBarBody>
                        </MessageBar>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text weight="semibold" size={400}>Select a Completed Meeting</Text>
                                <Button
                                    appearance="subtle"
                                    size="small"
                                    onClick={loadMeetings}
                                    disabled={meetingsLoading}
                                >
                                    {meetingsLoading ? 'Loading...' : 'Refresh'}
                                </Button>
                            </div>
                            <Text size={200} style={{ color: '#64748b' }}>
                                Teams attendance data is only available after a meeting ends. Select a meeting below to fetch its attendance report.
                            </Text>

                            {meetingsLoading && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                    <Spinner size="small" label="Loading meetings..." />
                                </div>
                            )}

                            {meetingsError && (
                                <MessageBar intent="warning">
                                    <MessageBarBody>{meetingsError}</MessageBarBody>
                                </MessageBar>
                            )}

                            {!meetingsLoading && meetings.length > 0 && (
                                <div className={styles.meetingsList}>
                                    {meetings.map((meeting) => (
                                        <div
                                            key={meeting.id}
                                            className={selectedMeeting?.id === meeting.id ? styles.meetingItemSelected : styles.meetingItem}
                                            onClick={() => handleMeetingSelect(meeting)}
                                        >
                                            <div>
                                                <Text weight="semibold" size={300}>{meeting.subject}</Text>
                                                <Text size={200} style={{ color: '#666', display: 'block' }}>
                                                    {meeting.startDateTime
                                                        ? new Date(meeting.startDateTime).toLocaleString()
                                                        : meeting.createdDateTime
                                                            ? new Date(meeting.createdDateTime).toLocaleString()
                                                            : 'No date'}
                                                </Text>
                                            </div>
                                            {selectedMeeting?.id === meeting.id && (
                                                <Badge appearance="filled" color="brand" size="small">Selected</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!meetingsLoading && !meetingsError && meetings.length === 0 && (
                                <Text size={200} style={{ color: '#999', textAlign: 'center', padding: '16px' }}>
                                    No online meetings found. Create a Teams meeting and try again.
                                </Text>
                            )}

                            {/* Attendance Results */}
                            {attendanceLoading && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                                    <Spinner size="small" label="Fetching attendance data..." />
                                </div>
                            )}

                            {!attendanceLoading && selectedMeeting && teamsAttendance.length > 0 && (
                                <>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text weight="semibold" size={400}>
                                            Attendance ({teamsAttendance.length} attendees)
                                        </Text>
                                        <Button
                                            icon={<ArrowDownload24Regular />}
                                            appearance="primary"
                                            size="small"
                                            onClick={exportTeamsCSV}
                                        >
                                            Export CSV
                                        </Button>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                        <table className={styles.attendanceTable}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.tableHeader}>Name</th>
                                                    <th className={styles.tableHeader}>Email</th>
                                                    <th className={styles.tableHeader}>Status</th>
                                                    <th className={styles.tableHeader}>Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamsAttendance.map((s, idx) => (
                                                    <tr key={idx}>
                                                        <td className={styles.tableCell}>{s.name}</td>
                                                        <td className={styles.tableCell}>{s.email || 'N/A'}</td>
                                                        <td className={styles.tableCell}>
                                                            <Badge
                                                                appearance="filled"
                                                                color={s.status === 'present' ? 'success' : 'subtle'}
                                                                size="small"
                                                            >
                                                                {s.status}
                                                            </Badge>
                                                        </td>
                                                        <td className={styles.tableCell}>
                                                            {s.duration != null ? `${Math.round(s.duration / 60)} min` : 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </Card>
            )}

            {/* Status Message */}
            {exportMessage && (
                <MessageBar
                    intent={exportMessage.type === 'success' ? 'success' : exportMessage.type === 'warning' ? 'warning' : 'error'}
                >
                    <MessageBarBody>
                        <MessageBarTitle>{exportMessage.type === 'success' ? 'Success' : exportMessage.type === 'warning' ? 'Warning' : 'Error'}</MessageBarTitle>
                        {exportMessage.text}
                    </MessageBarBody>
                </MessageBar>
            )}
        </div>
    );
}
