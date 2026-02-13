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
} from '@fluentui/react-components';
import {
    ArrowDownload24Regular,
    DocumentBulletList24Regular,
    PeopleTeam24Regular,
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
});

export default function ReportGenerate() {
    const styles = useStyles();

    const [reportType, setReportType] = useState(null); // 'attendance' or 'engagement'
    const [dateRange, setDateRange] = useState('30');
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [courses, setCourses] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

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
            </div>

            {/* Filters & Export */}
            {reportType && (
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
