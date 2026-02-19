import React, { useState, useCallback, useRef } from 'react';
import {
  Card,
  makeStyles,
  shorthands,
  Text,
  Badge,
  Button,
  Input,
  Divider,
  Spinner,
  Tooltip
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronUp20Regular,
  Checkmark20Regular,
  Dismiss20Regular,
  ArrowUpload20Regular,
  ArrowDownload20Regular,
  Search20Regular,
  People20Regular
} from '@fluentui/react-icons';
import { parseTeamsCSV, formatDuration } from '../utils/teamsCSVParser';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  section: {
    ...shorthands.padding('16px'),
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenRow: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'flex-end',
  },
  tokenInput: {
    flex: 1,
    minWidth: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  meetingList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    maxHeight: '260px',
    overflowY: 'auto',
  },
  meetingItem: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: '#e8f0fe',
    },
  },
  meetingItemSelected: {
    ...shorthands.border('2px', 'solid', '#0078d4'),
    backgroundColor: '#e8f0fe',
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
  tableWrapper: {
    maxHeight: '300px',
    overflowY: 'auto',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    borderRadius: '8px',
  },
  dropZone: {
    ...shorthands.padding('24px'),
    ...shorthands.border('2px', 'dashed', '#ccc'),
    borderRadius: '10px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    transition: 'border-color 0.2s, background-color 0.2s',
    '&:hover': {
      borderColor: '#0078d4',
      backgroundColor: '#f0f6ff',
    },
  },
  dropZoneActive: {
    borderColor: '#0078d4',
    backgroundColor: '#e8f0fe',
  },
  actionRow: {
    display: 'flex',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
  },
  engagementHigh: { color: '#107c10' },
  engagementMedium: { color: '#ca5010' },
  engagementLow: { color: '#d13438' },
  infoBox: {
    ...shorthands.padding('10px', '12px'),
    backgroundColor: '#fff4ce',
    borderRadius: '6px',
    ...shorthands.border('1px', 'solid', '#ffd335'),
  },
});

function EngagementBadge({ score }) {
  if (score == null) return <Badge appearance="tint" color="subtle">N/A</Badge>;
  const color = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
  return (
    <Badge appearance="filled" color={color} size="small">
      {score}%
    </Badge>
  );
}

function OnlineAttendance({ onOnlineStudentsUpdate }) {
  const styles = useStyles();

  // ---- Token State ----
  const [token, setToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState('disconnected'); // disconnected | verifying | connected | error
  const [connectedUser, setConnectedUser] = useState(null);

  // ---- Meetings State ----
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingsNotice, setMeetingsNotice] = useState('');
  const [meetingsError, setMeetingsError] = useState('');
  const [manualMeetingId, setManualMeetingId] = useState('');
  const [manualJoinWebUrl, setManualJoinWebUrl] = useState('');
  const [resolvingMeeting, setResolvingMeeting] = useState(false);

  // ---- Attendance State ----
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMeta, setAttendanceMeta] = useState(null);
  const [attendanceError, setAttendanceError] = useState('');

  // ---- CSV State ----
  const [csvStudents, setCsvStudents] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ---- Save State ----
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // ---- Section expand state ----
  const [sectionsExpanded, setSectionsExpanded] = useState({
    token: true,
    meetings: true,
    attendance: true,
    csv: false,
  });

  const toggleSection = (key) => {
    setSectionsExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to get auth header
  const authHeader = useCallback(() => {
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  // ========== Token Verification ==========
  const handleVerifyToken = async () => {
    if (!token.trim()) return;
    setTokenStatus('verifying');
    setConnectedUser(null);
    try {
      const res = await fetch('/api/graph/delegated/verify-token', {
        headers: authHeader()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setTokenStatus('connected');
        setConnectedUser(data.user);
        // Auto-fetch meetings on successful verification
        fetchMeetings();
      } else {
        setTokenStatus('error');
      }
    } catch {
      setTokenStatus('error');
    }
  };

  const handleDisconnect = () => {
    setToken('');
    setTokenStatus('disconnected');
    setConnectedUser(null);
    setMeetings([]);
    setMeetingsNotice('');
    setMeetingsError('');
    setSelectedMeeting(null);
    setManualMeetingId('');
    setManualJoinWebUrl('');
    setAttendanceStudents([]);
    setAttendanceMeta(null);
    setAttendanceError('');
    setSaveResult(null);
    if (onOnlineStudentsUpdate) onOnlineStudentsUpdate([]);
  };

  // ========== Meetings List ==========
  const fetchMeetings = async () => {
    setMeetingsLoading(true);
    setMeetings([]);
    setMeetingsNotice('');
    setMeetingsError('');
    try {
      const res = await fetch('/api/graph/delegated/meetings', {
        headers: authHeader()
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setMeetings(data.meetings || []);
        if (data.message) {
          setMeetingsNotice(data.message);
        }
      } else {
        setMeetingsError(data.message || 'Failed to fetch meetings.');
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setMeetingsError(err.message || 'Network error while fetching meetings.');
    } finally {
      setMeetingsLoading(false);
    }
  };

  // ========== Attendance Fetch ==========
  const fetchAttendance = async (meetingId) => {
    if (!meetingId) return;
    setAttendanceLoading(true);
    setAttendanceStudents([]);
    setAttendanceMeta(null);
    setAttendanceError('');
    setSaveResult(null);
    try {
      const res = await fetch(`/api/graph/delegated/online/${encodeURIComponent(meetingId)}`, {
        headers: authHeader()
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAttendanceStudents(data.students || []);
        setAttendanceMeta({
          meetingStartTime: data.meetingStartTime,
          meetingEndTime: data.meetingEndTime,
          meetingDurationSeconds: data.meetingDurationSeconds,
        });
        if (onOnlineStudentsUpdate) onOnlineStudentsUpdate(data.students || []);
      } else if (data.status === 'no_data') {
        setAttendanceError(data.message || 'No attendance data yet.');
      } else {
        setAttendanceError(data.message || 'Failed to fetch attendance.');
      }
    } catch (err) {
      setAttendanceError(err.message || 'Network error');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSelectMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    fetchAttendance(meeting.id);
  };

  const handleUseMeetingId = () => {
    const trimmedId = manualMeetingId.trim();
    if (!trimmedId) return;
    const syntheticMeeting = {
      id: trimmedId,
      subject: 'Manual Meeting ID',
      startDateTime: null,
      endDateTime: null
    };
    setSelectedMeeting(syntheticMeeting);
    fetchAttendance(trimmedId);
  };

  const handleResolveMeetingByJoinUrl = async () => {
    const trimmedJoinUrl = manualJoinWebUrl.trim();
    if (!trimmedJoinUrl) return;
    setResolvingMeeting(true);
    setMeetingsError('');
    try {
      const query = new URLSearchParams({ joinWebUrl: trimmedJoinUrl }).toString();
      const res = await fetch(`/api/graph/delegated/resolve-meeting?${query}`, {
        headers: authHeader()
      });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.meeting) {
        setSelectedMeeting(data.meeting);
        fetchAttendance(data.meeting.id);
      } else if (data.status === 'no_data') {
        setMeetingsError(data.message || 'No meeting found for that Join URL.');
      } else {
        setMeetingsError(data.message || 'Failed to resolve meeting from Join URL.');
      }
    } catch (err) {
      setMeetingsError(err.message || 'Network error while resolving meeting.');
    } finally {
      setResolvingMeeting(false);
    }
  };

  // ========== CSV Upload ==========
  const processCSVFile = (file) => {
    if (!file) return;
    setCsvFileName(file.name);
    setCsvStudents([]);
    setCsvErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const result = parseTeamsCSV(text);
      setCsvStudents(result.students);
      setCsvErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processCSVFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      processCSVFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // ========== Save to Supabase ==========
  const handleSaveAttendance = async (source) => {
    setSaving(true);
    setSaveResult(null);
    try {
      const endpoint = source === 'csv'
        ? '/api/attendance/online/upload-csv'
        : '/api/attendance/online/save';

      const studentsToSave = source === 'csv' ? csvStudents : attendanceStudents;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: studentsToSave,
          meetingSubject: selectedMeeting?.subject,
          meetingStartTime: attendanceMeta?.meetingStartTime,
          meetingEndTime: attendanceMeta?.meetingEndTime,
        })
      });
      const data = await res.json();
      setSaveResult(data);
    } catch (err) {
      setSaveResult({ status: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ========== Render Helpers ==========
  const formatDateTime = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const formatShortDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  // Determine which dataset to display (prefer CSV if available, else Graph API)
  const displayStudents = csvStudents.length > 0 ? csvStudents : attendanceStudents;
  const dataSource = csvStudents.length > 0 ? 'csv' : 'graph';

  return (
    <div className={styles.container}>
      {/* ============ Section 1: Token Input ============ */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => toggleSection('token')} style={{ cursor: 'pointer' }}>
          <div className={styles.statusBadge}>
            <Text weight="semibold" size={400}>Graph API Connection</Text>
            {tokenStatus === 'connected' && (
              <Badge appearance="filled" color="success" size="small">Connected</Badge>
            )}
            {tokenStatus === 'error' && (
              <Badge appearance="filled" color="danger" size="small">Error</Badge>
            )}
            {tokenStatus === 'disconnected' && (
              <Badge appearance="tint" color="subtle" size="small">Disconnected</Badge>
            )}
          </div>
          {sectionsExpanded.token ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
        </div>

        {sectionsExpanded.token && (
          <>
            <Text size={200} style={{ color: '#666' }}>
              Paste your access token from{' '}
              <a href="https://developer.microsoft.com/en-us/graph/graph-explorer" target="_blank" rel="noopener noreferrer">
                Graph Explorer
              </a>
              {' '}to connect.
            </Text>

            <div className={styles.tokenRow}>
              <Input
                className={styles.tokenInput}
                type="password"
                placeholder="Paste Graph Explorer access token..."
                value={token}
                onChange={(e, data) => setToken(data.value)}
                disabled={tokenStatus === 'connected'}
              />
              {tokenStatus === 'connected' ? (
                <Button
                  appearance="subtle"
                  icon={<Dismiss20Regular />}
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  icon={tokenStatus === 'verifying' ? <Spinner size="tiny" /> : <Checkmark20Regular />}
                  onClick={handleVerifyToken}
                  disabled={!token.trim() || tokenStatus === 'verifying'}
                >
                  {tokenStatus === 'verifying' ? 'Verifying...' : 'Verify'}
                </Button>
              )}
            </div>

            {tokenStatus === 'connected' && connectedUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Checkmark20Regular style={{ color: '#107c10' }} />
                <Text size={200}>
                  Signed in as <strong>{connectedUser.displayName}</strong> ({connectedUser.mail})
                </Text>
              </div>
            )}

            {tokenStatus === 'error' && (
              <Text size={200} style={{ color: '#d13438' }}>
                Token verification failed. Make sure you copied the full token from Graph Explorer.
              </Text>
            )}
          </>
        )}
      </div>

      {/* ============ Section 2: Meeting Picker ============ */}
      {tokenStatus === 'connected' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('meetings')} style={{ cursor: 'pointer' }}>
            <div className={styles.statusBadge}>
              <Text weight="semibold" size={400}>Your Meetings</Text>
              <Badge appearance="tint" color="informative" size="small">
                {meetings.length}
              </Badge>
            </div>
            {sectionsExpanded.meetings ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
          </div>

          {sectionsExpanded.meetings && (
            <>
              <div className={styles.actionRow}>
                <Button
                  appearance="subtle"
                  icon={meetingsLoading ? <Spinner size="tiny" /> : <Search20Regular />}
                  onClick={fetchMeetings}
                  disabled={meetingsLoading}
                  size="small"
                >
                  Refresh Meetings
                </Button>
              </div>

              {meetingsNotice && (
                <div className={styles.infoBox}>
                  <Text size={200}>{meetingsNotice}</Text>
                </div>
              )}

              {meetingsError && (
                <Text size={200} style={{ color: '#d13438' }}>
                  {meetingsError}
                </Text>
              )}

              {meetingsLoading && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Spinner size="small" label="Loading meetings..." />
                </div>
              )}

              {!meetingsLoading && meetings.length === 0 && (
                <Text size={200} style={{ color: '#999', textAlign: 'center', padding: '12px' }}>
                  No online meetings found. Create a Teams meeting and try again.
                </Text>
              )}

              {!meetingsLoading && meetings.length > 0 && (
                <div className={styles.meetingList}>
                  {meetings.map((m) => (
                    <div
                      key={m.id}
                      className={`${styles.meetingItem} ${selectedMeeting?.id === m.id ? styles.meetingItemSelected : ''}`}
                      onClick={() => handleSelectMeeting(m)}
                    >
                      <div>
                        <Text weight="semibold" size={300}>{m.subject}</Text>
                        <br />
                        <Text size={200} style={{ color: '#666' }}>
                          {formatShortDate(m.startDateTime)}
                          {m.endDateTime && ` — ${formatShortDate(m.endDateTime)}`}
                        </Text>
                      </div>
                      {selectedMeeting?.id === m.id && (
                        <Badge appearance="filled" color="brand" size="small">Selected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Divider />
              <Text size={200} style={{ color: '#666' }}>
                Manual fallback (for strict tenant permissions)
              </Text>
              <div className={styles.tokenRow}>
                <Input
                  className={styles.tokenInput}
                  placeholder="Paste meeting ID directly (optional)"
                  value={manualMeetingId}
                  onChange={(e, data) => setManualMeetingId(data.value)}
                />
                <Button
                  appearance="primary"
                  onClick={handleUseMeetingId}
                  disabled={!manualMeetingId.trim()}
                  size="small"
                >
                  Use ID
                </Button>
              </div>
              <div className={styles.tokenRow}>
                <Input
                  className={styles.tokenInput}
                  placeholder="Paste Teams Join URL (optional)"
                  value={manualJoinWebUrl}
                  onChange={(e, data) => setManualJoinWebUrl(data.value)}
                />
                <Button
                  appearance="subtle"
                  onClick={handleResolveMeetingByJoinUrl}
                  disabled={!manualJoinWebUrl.trim() || resolvingMeeting}
                  icon={resolvingMeeting ? <Spinner size="tiny" /> : undefined}
                  size="small"
                >
                  {resolvingMeeting ? 'Resolving...' : 'Resolve URL'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ Section 3: Attendance Results ============ */}
      {tokenStatus === 'connected' && selectedMeeting && (
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('attendance')} style={{ cursor: 'pointer' }}>
            <div className={styles.statusBadge}>
              <Text weight="semibold" size={400}>Attendance Report</Text>
              {attendanceStudents.length > 0 && (
                <Badge appearance="filled" color="brand" size="small">
                  {attendanceStudents.length} attendee{attendanceStudents.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {sectionsExpanded.attendance ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
          </div>

          {sectionsExpanded.attendance && (
            <>
              <Text size={200} style={{ color: '#666' }}>
                Meeting: <strong>{selectedMeeting.subject}</strong>
              </Text>

              {attendanceLoading && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Spinner size="small" label="Fetching attendance data..." />
                </div>
              )}

              {attendanceError && (
                <div className={styles.infoBox}>
                  <Text size={200}>{attendanceError}</Text>
                </div>
              )}

              {!attendanceLoading && attendanceStudents.length > 0 && (
                <>
                  {attendanceMeta && (
                    <Text size={200} style={{ color: '#555' }}>
                      Meeting duration: {formatDuration(attendanceMeta.meetingDurationSeconds)}
                      {' | '}{formatDateTime(attendanceMeta.meetingStartTime)} — {formatDateTime(attendanceMeta.meetingEndTime)}
                    </Text>
                  )}

                  <div className={styles.tableWrapper}>
                    <table className={styles.attendanceTable}>
                      <thead>
                        <tr>
                          <th className={styles.tableHeader}>Name</th>
                          <th className={styles.tableHeader}>Email</th>
                          <th className={styles.tableHeader}>Join Time</th>
                          <th className={styles.tableHeader}>Leave Time</th>
                          <th className={styles.tableHeader}>Duration</th>
                          <th className={styles.tableHeader}>Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceStudents.map((s, idx) => (
                          <tr key={idx}>
                            <td className={styles.tableCell}>
                              <Text size={200} weight="semibold">{s.name}</Text>
                            </td>
                            <td className={styles.tableCell}>
                              <Text size={200}>{s.email || '—'}</Text>
                            </td>
                            <td className={styles.tableCell}>
                              <Text size={200}>{formatDateTime(s.joinTime)}</Text>
                            </td>
                            <td className={styles.tableCell}>
                              <Text size={200}>{formatDateTime(s.leaveTime)}</Text>
                            </td>
                            <td className={styles.tableCell}>
                              <Text size={200}>{formatDuration(s.duration)}</Text>
                            </td>
                            <td className={styles.tableCell}>
                              <EngagementBadge score={s.engagementScore} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.actionRow}>
                    <Button
                      appearance="primary"
                      icon={saving ? <Spinner size="tiny" /> : <ArrowDownload20Regular />}
                      onClick={() => handleSaveAttendance('graph')}
                      disabled={saving}
                      size="small"
                    >
                      Save to Database
                    </Button>
                  </div>
                </>
              )}

              {saveResult && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: saveResult.status === 'success' ? '#e8f5e9' : '#fde8e8',
                  borderRadius: '6px'
                }}>
                  <Text size={200} style={{ color: saveResult.status === 'success' ? '#107c10' : '#d13438' }}>
                    {saveResult.status === 'success'
                      ? `Saved ${saveResult.savedCount} record(s) successfully.`
                      : `Error: ${saveResult.message}`
                    }
                  </Text>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ Section 4: CSV Upload ============ */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => toggleSection('csv')} style={{ cursor: 'pointer' }}>
          <div className={styles.statusBadge}>
            <Text weight="semibold" size={400}>Upload Teams CSV (Rich Engagement)</Text>
            {csvStudents.length > 0 && (
              <Badge appearance="filled" color="success" size="small">
                {csvStudents.length} parsed
              </Badge>
            )}
          </div>
          {sectionsExpanded.csv ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
        </div>

        {sectionsExpanded.csv && (
          <>
            <Text size={200} style={{ color: '#666' }}>
              Download the attendance report from Teams meeting UI, then upload the CSV here
              for rich engagement data (camera, hand raises, reactions).
            </Text>

            <div
              className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowUpload20Regular style={{ fontSize: '24px', color: '#0078d4' }} />
              <br />
              <Text size={300} weight="semibold" style={{ color: '#333' }}>
                {csvFileName || 'Drop CSV file here or click to browse'}
              </Text>
              <br />
              <Text size={200} style={{ color: '#888' }}>
                Accepts .csv files from Teams attendance download
              </Text>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {csvErrors.length > 0 && (
              <div style={{ color: '#d13438' }}>
                {csvErrors.map((err, i) => (
                  <Text key={i} size={200} block>{err}</Text>
                ))}
              </div>
            )}

            {csvStudents.length > 0 && (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.attendanceTable}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeader}>Name</th>
                        <th className={styles.tableHeader}>Email</th>
                        <th className={styles.tableHeader}>Role</th>
                        <th className={styles.tableHeader}>Duration</th>
                        <th className={styles.tableHeader}>Camera</th>
                        <th className={styles.tableHeader}>Hands</th>
                        <th className={styles.tableHeader}>Reactions</th>
                        <th className={styles.tableHeader}>Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvStudents.map((s, idx) => (
                        <tr key={idx}>
                          <td className={styles.tableCell}>
                            <Text size={200} weight="semibold">{s.fullName}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <Text size={200}>{s.email || '—'}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <Text size={200}>{s.role}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <Text size={200}>{s._raw?.duration || formatDuration(s.durationSeconds)}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <Text size={200}>{s._raw?.cameraDuration || formatDuration(s.cameraDurationSeconds)}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <Text size={200}>{s.handRaiseCount}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <Text size={200}>{s.reactionCount}</Text>
                          </td>
                          <td className={styles.tableCell}>
                            <EngagementBadge score={s.engagementScore} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.actionRow}>
                  <Button
                    appearance="primary"
                    icon={saving ? <Spinner size="tiny" /> : <ArrowDownload20Regular />}
                    onClick={() => handleSaveAttendance('csv')}
                    disabled={saving}
                    size="small"
                  >
                    Save Enriched Data to Database
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss20Regular />}
                    onClick={() => { setCsvStudents([]); setCsvFileName(''); setCsvErrors([]); }}
                    size="small"
                  >
                    Clear CSV
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OnlineAttendance;
