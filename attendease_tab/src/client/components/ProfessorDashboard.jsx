import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Badge,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider
} from '@fluentui/react-components';
import { Settings48Regular, ChevronDown20Regular, ChevronUp20Regular } from '@fluentui/react-icons';
import FacialRecognition from './FacialRecognition';
import ExportPanel from './ExportPanel';
import AdminLoginModal from './modals/AdminLoginModal';
import { setAdminSession } from '../utils/auth';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(to right,rgb(66, 59, 34), #FFCC00)',
    ...shorthands.padding('20px'),
  },
  container: {
    ...shorthands.padding('24px'),
    backgroundImage: 'linear-gradient(to right,rgb(66, 59, 34), #FFCC00)',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    ...shorthands.padding('0', '8px')
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    color: '#ffffff'
  },
  adminButton: {
    backgroundColor: '#d32f2f',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#b71c1c'
    }
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    ...shorthands.gap('24px'),
    alignItems: 'flex-start',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr'
    }
  },
  cameraCard: {
    ...shorthands.padding('24px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px')
  },
  cameraHeader: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    marginBottom: '8px'
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px')
  },
  statsCard: {
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px')
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px')
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px'),
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  participantDropdown: {
    ...shorthands.padding('16px'),
    ...shorthands.border('1px', 'solid', '#e6e6e6'),
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  participantHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  participantContent: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px')
  },
  participantSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px')
  },
  participantList: {
    maxHeight: '150px',
    overflowY: 'auto',
    ...shorthands.border('1px', 'solid', '#e6e6e6'),
    borderRadius: '6px',
    ...shorthands.padding('8px'),
    backgroundColor: '#fafafa'
  },
  participantItem: {
    ...shorthands.padding('6px', '8px'),
    backgroundColor: '#fff',
    borderRadius: '4px',
    marginBottom: '4px',
    fontSize: '13px'
  },
  messagesCard: {
    ...shorthands.padding('16px'),
    backgroundColor: '#f9f9f9',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    borderRadius: '8px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  exportCard: {
    ...shorthands.padding('20px'),
    marginTop: '24px'
  }
});

const DEFAULT_UNKNOWN = [];

function ProfessorDashboard({ userContext }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const [onsiteAttendance, setOnsiteAttendance] = useState([]);
  const [unknownFaces, setUnknownFaces] = useState(DEFAULT_UNKNOWN);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);

  useEffect(() => {
    if (userContext?.meeting?.id) {
      console.log('Meeting context detected:', userContext.meeting.id);
    }
  }, [userContext]);

  const handleMessagesUpdate = (messages) => {
    setSystemMessages(messages);
  };

  const handleExportReport = () => {
    const combinedData = [
      ...onsiteAttendance.map(s => ({ ...s, mode: 'Onsite' })),
      ...unknownFaces.map(s => ({ ...s, mode: 'Unknown' }))
    ];

    if (combinedData.length === 0) {
      return;
    }

    const headers = ['Name', 'Mode', 'Status', 'Time'];
    const csvContent = [
      headers.join(','),
      ...combinedData.map(student =>
        `"${student.name}","${student.mode}","${student.status || 'Present'}","${student.joinTime || student.detectedTime || '-'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPresent = onsiteAttendance.length;

  const handleAdminLoginSuccess = () => {
    setAdminSession(true);
    setIsAdminModalOpen(false);
    navigate('/admin');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text size={600} weight="bold">Professor Dashboard</Text>
        </div>
        <Button
          onClick={() => setIsAdminModalOpen(true)}
          appearance="primary"
          className={styles.adminButton}
          icon={<Settings48Regular />}
        >
          Admin
        </Button>
      </div>

      <div className={styles.layout}>
        {/* Left: Camera Feed */}
        <Card className={styles.cameraCard}>
          <div className={styles.cameraHeader}>
            <Text weight="semibold" size={500}>Onsite Camera Feed</Text>
          </div>
          <FacialRecognition
            onAttendanceUpdate={(records) => {
              const confirmed = records.filter(r => r.isConfirmed && r.name !== 'Unknown');
              const unknown = records.filter(r => r.name === 'Unknown' || !r.isConfirmed);
              setOnsiteAttendance(confirmed);
              setUnknownFaces(unknown);
            }}
            onMessagesUpdate={handleMessagesUpdate}
          />
        </Card>

        {/* Right: Stats, Participants, Messages */}
        <div className={styles.rightPanel}>
          {/* Stats Card */}
          <Card className={styles.statsCard}>
            <Text weight="semibold" size={400}>Live Statistics</Text>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <Text size={300} style={{ color: '#666' }}>Total Present</Text>
                <Badge appearance="filled" color="brand" size="extra-large">
                  {totalPresent}
                </Badge>
              </div>
              <div className={styles.statItem}>
                <Text size={300} style={{ color: '#666' }}>Onsite</Text>
                <Badge appearance="filled" color="informative" size="extra-large">
                  {onsiteAttendance.length}
                </Badge>
              </div>
              <div className={styles.statItem}>
                <Text size={300} style={{ color: '#666' }}>Unknown</Text>
                <Badge appearance="filled" color="important" size="extra-large">
                  {unknownFaces.length}
                </Badge>
              </div>
              <div className={styles.statItem}>
                <Text size={300} style={{ color: '#666' }}>Online</Text>
                <Badge appearance="tint" color="subtle" size="extra-large">
                  N/A
                </Badge>
              </div>
            </div>
          </Card>

          {/* Participant Dropdown */}
          <Card className={styles.participantDropdown}>
            <div 
              className={styles.participantHeader}
              onClick={() => setParticipantsExpanded(!participantsExpanded)}
            >
              <Text weight="semibold">View Participants</Text>
              {participantsExpanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
            </div>
            
            {participantsExpanded && (
              <div className={styles.participantContent}>
                <div className={styles.participantSection}>
                  <Text weight="semibold" size={300}>
                    Onsite ({onsiteAttendance.length})
                  </Text>
                  <div className={styles.participantList}>
                    {onsiteAttendance.length === 0 ? (
                      <Text size={200} style={{ color: '#999', textAlign: 'center' }}>
                        No onsite participants yet
                      </Text>
                    ) : (
                      onsiteAttendance.map((p, idx) => (
                        <div key={idx} className={styles.participantItem}>
                          <Text size={300} weight="semibold">{p.name}</Text>
                          {p.detectedTime && (
                            <Text size={200} style={{ color: '#666' }}>
                              {p.detectedTime}
                            </Text>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.participantSection}>
                  <Text weight="semibold" size={300}>
                    Unknown ({unknownFaces.length})
                  </Text>
                  <div className={styles.participantList}>
                    {unknownFaces.length === 0 ? (
                      <Text size={200} style={{ color: '#999', textAlign: 'center' }}>
                        No unknown faces detected
                      </Text>
                    ) : (
                      unknownFaces.map((p, idx) => (
                        <div key={idx} className={styles.participantItem}>
                          <Text size={300}>Unknown Face #{idx + 1}</Text>
                          {p.detectedTime && (
                            <Text size={200} style={{ color: '#666' }}>
                              {p.detectedTime}
                            </Text>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.participantSection}>
                  <Text weight="semibold" size={300} style={{ color: '#999' }}>
                    Online (0)
                  </Text>
                  <div className={styles.participantList}>
                    <Text size={200} style={{ color: '#999', textAlign: 'center' }}>
                      Online tracking paused
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* System Messages */}
          <div className={styles.messagesCard}>
            <Text weight="semibold" size={300} style={{ marginBottom: '8px', display: 'block' }}>
              System Messages
            </Text>
            {systemMessages.length === 0 ? (
              <Text size={200} style={{ color: '#999' }}>No messages yet</Text>
            ) : (
              systemMessages.slice(-5).map((msg, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    color: msg.type === 'error' ? '#d32f2f' : msg.type === 'success' ? '#2e7d32' : '#666',
                    fontSize: '12px',
                    marginBottom: '4px'
                  }}
                >
                  [{msg.timestamp}] {msg.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Export Options */}
      <Card className={styles.exportCard}>
        <ExportPanel
          onExport={handleExportReport}
          disabled={onsiteAttendance.length + unknownFaces.length === 0}
        />
      </Card>

      <AdminLoginModal
        open={isAdminModalOpen}
        onCancel={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}

export default ProfessorDashboard;
