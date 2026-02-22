import React, { useState, useEffect } from 'react';
import {
  Card,
  makeStyles,
  Button,
  Text,
  Badge,
  Spinner,
  Divider,
  Input,
  shorthands
} from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

// Default M365 email for demo — pre-filled so the panelist demo "just works".
// In production the professor's real M365 UPN would come from Teams SSO or an admin mapping.
const DEFAULT_M365_EMAIL = 'ciesguerra2@student.apc.edu.ph';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px')
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('10px')
  },
  button: {
    backgroundColor: '#244670',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#1a3350',
    }
  },
  teamsSection: {
    ...shorthands.padding('16px'),
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  teamsSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
  },
  meetingsList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    maxHeight: '260px',
    overflowY: 'auto',
  },
  meetingItem: {
    ...shorthands.padding('10px', '12px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#ddd'),
    borderRadius: '6px',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '150ms',
    '&:hover': {
      backgroundColor: '#e8f0fe',
      borderColor: '#244670',
    },
  },
  meetingItemSelected: {
    ...shorthands.padding('10px', '12px'),
    backgroundColor: '#e8f0fe',
    ...shorthands.border('2px', 'solid', '#244670'),
    borderRadius: '6px',
    cursor: 'pointer',
  },
  noData: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    ...shorthands.padding('16px'),
  },
});

function ExportPanel({ onExportAttendance, onExportEngagement }) {
  const styles = useStyles();

  // M365 email — drives which user's meetings we query via Graph API
  const [m365Email, setM365Email] = useState(() => {
    // Try localStorage first (professor may have edited this before)
    const saved = localStorage.getItem('m365Email');
    if (saved) return saved;
    // Fallback to configured default for the demo
    return DEFAULT_M365_EMAIL;
  });

  // Teams state
  const [graphConnected, setGraphConnected] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingsError, setMeetingsError] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [teamsExpanded, setTeamsExpanded] = useState(false);

  useEffect(() => {
    checkGraphStatus();
  }, []);

  // Persist M365 email to localStorage so the professor doesn't have to re-enter it
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setM365Email(val);
    localStorage.setItem('m365Email', val);
  };

  const checkGraphStatus = async () => {
    try {
      const res = await fetch('/api/attendance/graph-status');
      if (res.ok) {
        const data = await res.json();
        setGraphConnected(data.status === 'configured');
      }
    } catch {
      setGraphConnected(false);
    }
  };

  const loadMeetings = async () => {
    const email = m365Email.trim();
    if (!email) {
      setMeetingsError('Please enter your Microsoft 365 email first.');
      return;
    }
    setLoadingMeetings(true);
    setMeetingsError('');
    setSelectedMeeting(null);
    setAttendanceData([]);
    setAttendanceMessage('');
    try {
      const res = await fetch(`/api/graph/app/meetings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setMeetings(data.meetings || []);
        if ((data.meetings || []).length === 0) {
          setMeetingsError('No meetings found for this email. Meetings appear after they are created in Teams.');
        }
      } else {
        setMeetingsError(data.message || 'Failed to load meetings.');
      }
    } catch (err) {
      setMeetingsError('Could not connect to server. Is it running?');
    }
    setLoadingMeetings(false);
  };

  const handleToggleTeams = () => {
    const next = !teamsExpanded;
    setTeamsExpanded(next);
    if (next && meetings.length === 0 && graphConnected && m365Email.trim()) {
      loadMeetings();
    }
  };

  const handleMeetingSelect = async (meeting) => {
    const email = m365Email.trim();
    if (!email) {
      setAttendanceMessage('Please enter your Microsoft 365 email first.');
      return;
    }
    setSelectedMeeting(meeting);
    setLoadingAttendance(true);
    setAttendanceData([]);
    setAttendanceMessage('');
    try {
      const res = await fetch(`/api/graph/app/attendance/${encodeURIComponent(meeting.id)}?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setAttendanceData(data.students || []);
        if ((data.students || []).length === 0) {
          setAttendanceMessage('Meeting found but no attendees recorded yet.');
        }
      } else if (data.status === 'no_data') {
        setAttendanceData([]);
        setAttendanceMessage(data.message || 'No attendance data available yet.');
      } else {
        setAttendanceMessage(data.message || 'Failed to fetch attendance.');
      }
    } catch (err) {
      setAttendanceMessage(`Error: ${err.message}`);
    }
    setLoadingAttendance(false);
  };

  const exportTeamsCSV = () => {
    if (attendanceData.length === 0) return;
    const headers = ['Student Name', 'Email', 'Status', 'Join Time', 'Leave Time', 'Duration (min)', 'Role'];
    const rows = attendanceData.map(s => [
      s.name || 'Unknown',
      s.email || 'N/A',
      s.status || 'N/A',
      s.joinTime ? new Date(s.joinTime).toLocaleString() : 'N/A',
      s.leaveTime ? new Date(s.leaveTime).toLocaleString() : 'N/A',
      s.duration != null ? Math.round(s.duration / 60) : 'N/A',
      s.role || 'N/A',
    ]);
    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <div className={styles.container}>
        {/* Existing Export Options */}
        <div className={styles.header}>
          <Text weight="semibold" size={400}>Export Options</Text>
          <Text size={200}>Download attendance and engagement reports as separate CSV files.</Text>
        </div>
        <Text size={200} style={{ color: '#666' }}>
          Attendance CSV focuses on participation records, while Engagement CSV captures engagement state metrics for this session.
        </Text>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            onClick={onExportAttendance}
            icon={<ArrowDownload24Regular />}
            className={styles.button}
          >
            Generate Attendance Report
          </Button>
          <Button
            appearance="primary"
            onClick={onExportEngagement}
            icon={<ArrowDownload24Regular />}
            className={styles.button}
          >
            Generate Engagement Report
          </Button>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Teams Attendance Section */}
        <div className={styles.teamsSection}>
          <div className={styles.teamsSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text weight="semibold" size={400}>Teams Attendance (Post-Meeting)</Text>
              <Badge
                appearance="filled"
                color={graphConnected ? 'success' : 'danger'}
                size="small"
              >
                {graphConnected ? 'API Connected' : 'Not Configured'}
              </Badge>
            </div>
            <Button
              appearance="subtle"
              size="small"
              onClick={handleToggleTeams}
            >
              {teamsExpanded ? '▲ Collapse' : '▼ Expand'}
            </Button>
          </div>
          <Text size={200} style={{ color: '#666' }}>
            Fetch attendance data from completed Teams meetings. Data is available after the meeting ends.
          </Text>

          {teamsExpanded && (
            <>
              {!graphConnected ? (
                <Text size={200} style={{ color: '#d13438', textAlign: 'center', padding: '12px' }}>
                  Graph API not configured. Add AAD_APP_CLIENT_ID, AAD_APP_CLIENT_SECRET, and AAD_APP_TENANT_ID to your .localConfigs and restart the server.
                </Text>
              ) : (
                <>
                  {/* M365 Email Input */}
                  <div className={styles.emailRow}>
                    <Text weight="semibold" size={200} style={{ whiteSpace: 'nowrap' }}>
                      Microsoft 365 Email:
                    </Text>
                    <Input
                      size="small"
                      type="email"
                      placeholder="professor@apc.edu.ph"
                      value={m365Email}
                      onChange={handleEmailChange}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <Button
                      appearance="primary"
                      size="small"
                      className={styles.button}
                      onClick={loadMeetings}
                      disabled={loadingMeetings || !m365Email.trim()}
                    >
                      {loadingMeetings ? 'Loading...' : 'Load Meetings'}
                    </Button>
                  </div>
                  <Text size={100} style={{ color: '#888', marginTop: '-8px' }}>
                    Enter the email used to sign in to Microsoft Teams. This is used to fetch your meetings via Graph API.
                  </Text>

                  {/* Meetings Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text weight="semibold" size={300}>
                      Your Meetings ({meetings.length})
                    </Text>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={loadMeetings}
                      disabled={loadingMeetings}
                    >
                      {loadingMeetings ? 'Loading...' : '↻ Refresh'}
                    </Button>
                  </div>

                  {/* Meetings List */}
                  {loadingMeetings && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                      <Spinner size="small" label="Loading meetings..." />
                    </div>
                  )}

                  {meetingsError && (
                    <Text size={200} style={{ color: '#d13438', textAlign: 'center', padding: '8px' }}>
                      {meetingsError}
                    </Text>
                  )}

                  {!loadingMeetings && !meetingsError && meetings.length === 0 && (
                    <Text className={styles.noData}>
                      No completed meetings found. Meetings appear here after they end.
                    </Text>
                  )}

                  {!loadingMeetings && meetings.length > 0 && (
                    <div className={styles.meetingsList}>
                      {meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className={selectedMeeting?.id === meeting.id ? styles.meetingItemSelected : styles.meetingItem}
                          onClick={() => handleMeetingSelect(meeting)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text weight="semibold" size={300}>{meeting.subject || 'Untitled Meeting'}</Text>
                              <br />
                              <Text size={200} style={{ color: '#666' }}>
                                {meeting.startDateTime
                                  ? new Date(meeting.startDateTime).toLocaleString()
                                  : meeting.createdDateTime
                                    ? new Date(meeting.createdDateTime).toLocaleString()
                                    : 'Unknown date'}
                              </Text>
                            </div>
                            {selectedMeeting?.id === meeting.id && (
                              <Badge appearance="filled" color="brand" size="small">Selected</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attendance Results */}
                  {loadingAttendance && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                      <Spinner size="small" label="Fetching attendance..." />
                    </div>
                  )}

                  {!loadingAttendance && attendanceMessage && attendanceData.length === 0 && (
                    <Text className={styles.noData}>{attendanceMessage}</Text>
                  )}

                  {!loadingAttendance && attendanceData.length > 0 && (
                    <>
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text weight="semibold" size={300}>
                          Attendance — {attendanceData.length} attendee(s)
                        </Text>
                        <Button
                          appearance="primary"
                          size="small"
                          icon={<ArrowDownload24Regular />}
                          className={styles.button}
                          onClick={exportTeamsCSV}
                        >
                          Export Teams CSV
                        </Button>
                      </div>
                      <div style={{ maxHeight: '250px', overflowY: 'auto', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#244670', color: '#fff' }}>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Name</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Email</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.map((s, idx) => (
                              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px 10px' }}>{s.name}</td>
                                <td style={{ padding: '8px 10px' }}>{s.email || 'N/A'}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  <Badge
                                    appearance="filled"
                                    color={s.status === 'present' ? 'success' : 'subtle'}
                                    size="small"
                                  >
                                    {s.status === 'present' ? 'Present' : s.status === 'left' ? 'Attended' : s.status}
                                  </Badge>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
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
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ExportPanel;
