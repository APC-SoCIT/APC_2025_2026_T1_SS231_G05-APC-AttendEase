import React, { useState, useEffect } from 'react';
import { 
  Card,
  Badge,
  Button,
  makeStyles,
  shorthands,
  Text
} from '@fluentui/react-components';
import FacialRecognition from './FacialRecognition';
import OnlineAttendance from './OnlineAttendance';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('20px'),
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr'
    }
  },
  card: {
    ...shorthands.padding('20px')
  },
  summaryCard: {
    ...shorthands.padding('20px'),
    marginTop: '20px'
  },
  summaryStats: {
    display: 'flex',
    ...shorthands.gap('30px'),
    marginTop: '15px',
    flexWrap: 'wrap'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('5px')
  }
});

function ProfessorDashboard({ userContext }) {
  const styles = useStyles();
  const [onlineAttendance, setOnlineAttendance] = useState([]);
  const [onsiteAttendance, setOnsiteAttendance] = useState([]);
  const [meetingId, setMeetingId] = useState(null);

  useEffect(() => {
    // Extract meeting ID from Teams context
    if (userContext?.meeting?.id) {
      setMeetingId(userContext.meeting.id);
      console.log('Meeting ID:', userContext.meeting.id);
    }
  }, [userContext]);

  const handleExportReport = () => {
    const combinedData = [
      ...onlineAttendance.map(s => ({ ...s, mode: 'Online' })),
      ...onsiteAttendance.map(s => ({ ...s, mode: 'Onsite' }))
    ];

    // Create CSV
    const headers = ['Name', 'Mode', 'Status', 'Time'];
    const csvContent = [
      headers.join(','),
      ...combinedData.map(student => 
        `"${student.name}","${student.mode}","${student.status || 'Present'}","${student.joinTime || student.detectedTime || '-'}"`
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <h2>Professor Dashboard</h2>
      
      <div className={styles.container}>
        {/* Onsite Attendance Card */}
        <Card className={styles.card}>
          <h3>🔵 Onsite Attendance</h3>
          <Text>Facial Recognition System</Text>
          <FacialRecognition onAttendanceUpdate={setOnsiteAttendance} />
        </Card>

        {/* Online Attendance Card */}
        <Card className={styles.card}>
          <h3>🟢 Online Attendance</h3>
          <Text>Microsoft Teams Meeting Participants (via Graph API)</Text>
          <OnlineAttendance 
            meetingId={meetingId} 
            onAttendanceUpdate={setOnlineAttendance} 
          />
        </Card>
      </div>

      {/* Combined Attendance Summary */}
      <Card className={styles.summaryCard}>
        <h3>📊 Attendance Summary</h3>
        <div className={styles.summaryStats}>
          <div className={styles.statItem}>
            <Text weight="semibold" size={500}>Total Present</Text>
            <Badge appearance="filled" color="brand" size="extra-large">
              {onlineAttendance.length + onsiteAttendance.length}
            </Badge>
          </div>
          <div className={styles.statItem}>
            <Text weight="semibold" size={500}>Online</Text>
            <Badge appearance="filled" color="success" size="extra-large">
              {onlineAttendance.length}
            </Badge>
          </div>
          <div className={styles.statItem}>
            <Text weight="semibold" size={500}>Onsite</Text>
            <Badge appearance="filled" color="informative" size="extra-large">
              {onsiteAttendance.length}
            </Badge>
          </div>
        </div>
        <Button 
          appearance="primary" 
          onClick={handleExportReport}
          style={{ marginTop: '20px' }}
          disabled={onlineAttendance.length + onsiteAttendance.length === 0}
        >
          Export Attendance Report (CSV)
        </Button>
      </Card>
    </div>
  );
}

export default ProfessorDashboard;
