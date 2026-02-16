import React, { useState } from 'react';
import {
    makeStyles,
    shorthands,
    Card,
    Text,
    TabList,
    Tab,
} from '@fluentui/react-components';
import AdminShell from './AdminShell';
import ReportOverview from './ReportOverview';
import ReportAttendanceRecords from './ReportAttendanceRecords';
import ReportCourses from './ReportCourses';
import ReportStudents from './ReportStudents';
import ReportEngagement from './ReportEngagement';
import ReportGenerate from './ReportGenerate';

const useStyles = makeStyles({
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('4px'),
    },
    tabsContainer: {
        backgroundColor: 'white',
        ...shorthands.borderRadius('8px'),
        ...shorthands.padding('20px'),
    },
    tabContent: {
        ...shorthands.padding('20px', '0'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
});

function AdminReports() {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState('overview');

    return (
        <AdminShell>
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <Text size={600} weight="bold">View Reports</Text>
                    <Text size={200} style={{ color: '#64748b' }}>
                        Monitor attendance records, course analytics, student performance, and engagement metrics.
                    </Text>
                </div>
            </div>

            <Card className={styles.tabsContainer}>
                <TabList
                    selectedValue={selectedTab}
                    onTabSelect={(e, data) => setSelectedTab(data.value)}
                >
                    <Tab value="overview">Overview</Tab>
                    <Tab value="attendance-records">Attendance Records</Tab>
                    <Tab value="course-reports">Course Reports</Tab>
                    <Tab value="student-reports">Student Reports</Tab>
                    <Tab value="engagement">Engagement</Tab>
                    <Tab value="generate-report">Generate Report</Tab>
                </TabList>

                <div className={styles.tabContent}>
                    {selectedTab === 'overview' && <ReportOverview />}
                    {selectedTab === 'attendance-records' && <ReportAttendanceRecords />}
                    {selectedTab === 'course-reports' && <ReportCourses />}
                    {selectedTab === 'student-reports' && <ReportStudents />}
                    {selectedTab === 'engagement' && <ReportEngagement />}
                    {selectedTab === 'generate-report' && <ReportGenerate />}
                </div>
            </Card>
        </AdminShell>
    );
}

export default AdminReports;
