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
import ReportStudents from './ReportStudents';
import ReportEngagement from './ReportEngagement';

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
        ...shorthands.borderRadius('12px'),
        ...shorthands.padding('24px'),
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    tabContent: {
        ...shorthands.padding('24px', '0'),
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
                    <Text size={600} weight="bold" style={{ color: '#1e293b' }}>View Reports</Text>
                    <Text size={200} style={{ color: '#64748b' }}>
                        Monitor attendance records, student performance, and engagement metrics.
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
                    <Tab value="student-reports">Student Reports</Tab>
                    <Tab value="engagement">Engagement</Tab>
                </TabList>

                <div className={styles.tabContent}>
                    {selectedTab === 'overview' && <ReportOverview />}
                    {selectedTab === 'attendance-records' && <ReportAttendanceRecords />}
                    {selectedTab === 'student-reports' && <ReportStudents />}
                    {selectedTab === 'engagement' && <ReportEngagement />}
                </div>
            </Card>
        </AdminShell>
    );
}

export default AdminReports;
