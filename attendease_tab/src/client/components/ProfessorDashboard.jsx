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
import { ChevronDown20Regular, ChevronUp20Regular, Add20Regular, Edit20Regular, Delete20Regular, EyeOff20Regular, Eye20Regular } from '@fluentui/react-icons';
import FacialRecognition from './FacialRecognition';
import ExportPanel from './ExportPanel';
import ScheduleModal from './modals/ScheduleModal';
import DeleteConfirmDialog from './modals/DeleteConfirmDialog';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getCurrentClass,
  getUpcomingClasses
} from '../../services/scheduleServices/scheduleService';
import '../../services/scheduleServices/testSchedule'; // Enable browser console testing

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(135deg, #294972 35%, #ffba08)',
    ...shorthands.padding('20px'),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(135deg, #294972 35%, #ffba08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    ...shorthands.padding('15px', '30px'),
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px', '20px'),
    }
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    color: '#244670'
  },
  contentWrapper: {
    display: 'flex',
    flex: 1,
    ...shorthands.padding('24px'),
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('24px'),
    alignItems: 'flex-start',
    width: '100%',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr'
    }
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px')
  },
  cameraCard: {
    ...shorthands.padding('24px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
    ...shorthands.gap('16px'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
  },
  participantDropdown: {
    ...shorthands.padding('16px'),
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  participantHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'auto',
  },
  participantToggleButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
    pointerEvents: 'auto',
    zIndex: 1,
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderRadius: '4px',
    }
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
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '12px',
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  scheduleCard: {
    ...shorthands.padding('20px'),
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    maxHeight: '300px',
    overflowY: 'auto'
  },
  scheduleItem: {
    ...shorthands.padding('12px'),
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    borderRadius: '6px',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    position: 'relative',
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  scheduleItemActive: {
    ...shorthands.border('2px', 'solid', '#107c10'),
    backgroundColor: '#e8f5e9'
  },
  scheduleColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    borderTopLeftRadius: '6px',
    borderBottomLeftRadius: '6px'
  },
  scheduleItemContent: {
    marginLeft: '12px'
  },
  scheduleItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  scheduleDays: {
    display: 'flex',
    ...shorthands.gap('4px'),
    flexWrap: 'wrap'
  },
  dayBadge: {
    fontSize: '11px',
    padding: '2px 6px'
  }
});

const DEFAULT_UNKNOWN = [];

function ProfessorDashboard({ userContext }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const [onsiteAttendance, setOnsiteAttendance] = useState([]);
  const [unknownFaces, setUnknownFaces] = useState(DEFAULT_UNKNOWN);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);
  const [debugMessages, setDebugMessages] = useState([]);
  
  // Engagement tracking state
  const [classEngagement, setClassEngagement] = useState({
    average_score: 0,
    engaged_count: 0,
    present_count: 0,
    disengaged_count: 0
  });
  
  // Debug status
  const [debugStatus, setDebugStatus] = useState({
    engagement_enabled: false,
    face_mesh_detector: 'unknown',
    hand_detector: 'unknown',
    tracked_faces: {}
  });

  // Track camera session start/stop times
  const [cameraStartTime, setCameraStartTime] = useState(null);
  const [cameraStopTime, setCameraStopTime] = useState(null);

  // Schedule state
  const [schedules, setSchedules] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  // Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState('create'); // 'create' or 'edit'
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [showInactiveSchedules, setShowInactiveSchedules] = useState(false);

  useEffect(() => {
    if (userContext?.meeting?.id) {
      console.log('Meeting context detected:', userContext.meeting.id);
    }
  }, [userContext]);

  // Load schedules and check for current class
  useEffect(() => {
    // Load all schedules
    const loadedSchedules = getAllSchedules();
    setSchedules(loadedSchedules);

    // Get current and upcoming classes
    const current = getCurrentClass();
    const upcoming = getUpcomingClasses();
    setCurrentClass(current);
    setUpcomingClasses(upcoming);

    // Update every minute
    const intervalId = setInterval(() => {
      const current = getCurrentClass();
      const upcoming = getUpcomingClasses();
      setCurrentClass(current);
      setUpcomingClasses(upcoming);
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  // CRUD handlers for schedules
  const handleCreateSchedule = (scheduleData) => {
    try {
      const newSchedule = createSchedule(scheduleData);
      setSchedules(getAllSchedules());
      setSystemMessages(prev => [...prev, {
        type: 'success',
        message: `Created class: ${newSchedule.name}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      return newSchedule;
    } catch (error) {
      setSystemMessages(prev => [...prev, {
        type: 'error',
        message: `Error creating class: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      throw error;
    }
  };

  const handleUpdateSchedule = (id, updates) => {
    try {
      const updated = updateSchedule(id, updates);
      setSchedules(getAllSchedules());
      setSystemMessages(prev => [...prev, {
        type: 'success',
        message: `Updated class: ${updated.name}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      return updated;
    } catch (error) {
      setSystemMessages(prev => [...prev, {
        type: 'error',
        message: `Error updating class: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      throw error;
    }
  };

  const handleDeleteSchedule = (id) => {
    try {
      const success = deleteSchedule(id);
      if (success) {
        setSchedules(getAllSchedules());
        setSystemMessages(prev => [...prev, {
          type: 'success',
          message: 'Class deleted successfully',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      return success;
    } catch (error) {
      setSystemMessages(prev => [...prev, {
        type: 'error',
        message: `Error deleting class: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      return false;
    }
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setScheduleModalMode('create');
    setEditingSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleOpenEditModal = (schedule) => {
    setScheduleModalMode('edit');
    setEditingSchedule(schedule);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (formData) => {
    if (scheduleModalMode === 'create') {
      return handleCreateSchedule(formData);
    } else {
      return handleUpdateSchedule(editingSchedule.id, formData);
    }
  };

  const handleOpenDeleteDialog = (schedule) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingSchedule) {
      handleDeleteSchedule(deletingSchedule.id);
      setDeleteDialogOpen(false);
      setDeletingSchedule(null);
    }
  };

  const handleMessagesUpdate = (messages) => {
    setSystemMessages(messages);
  };

  // Handle engagement updates from facial recognition
  const handleEngagementUpdate = (engagementData) => {
    setClassEngagement(engagementData);
  };

  // Fetch debug status periodically
  useEffect(() => {
    const fetchDebugStatus = async () => {
      try {
        const response = await fetch('/api/facial-recognition/debug/status');
        const data = await response.json();
        
        if (data.status === 'success') {
          setDebugStatus(data);
          
          // Extract debug messages from tracked faces
          const messages = [];
          messages.push(`Engagement Enabled: ${data.engagement_enabled}`);
          messages.push(`Face Mesh: ${data.face_mesh_detector}`);
          messages.push(`Hand Detector: ${data.hand_detector}`);
          messages.push(`Tracked Faces: ${data.total_faces_tracked}`);
          
          Object.entries(data.tracked_faces || {}).forEach(([id, tracker]) => {
            if (tracker?.ear_history?.length > 0) {
              const lastEAR = tracker.ear_history[tracker.ear_history.length - 1];
              messages.push(`${tracker.name} (ID:${id}): EAR=${lastEAR.toFixed(3)}, Sleeping=${tracker.is_sleeping}`);
            }
          });
          
          setDebugMessages(messages);
        }
      } catch (error) {
        setDebugMessages([`Debug Error: ${error.message}`]);
      }
    };

    const interval = setInterval(fetchDebugStatus, 1000); // Update every second
    fetchDebugStatus(); // Initial fetch
    return () => clearInterval(interval);
  }, []);

  const csvSafe = (value) => {
    const normalized = value === null || value === undefined || value === '' ? 'N/A' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const downloadCsv = (headers, rows, filePrefix) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(csvSafe).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCombinedExportData = () => ([
    ...onsiteAttendance.map((student) => ({ ...student, mode: 'Onsite' })),
    ...unknownFaces.map((student) => ({ ...student, mode: 'Unknown' }))
  ]);

  const notifyEmptyExport = () => {
    setSystemMessages((prev) => [...prev, {
      type: 'info',
      message: 'No data yet. Exported CSV with headers only.',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleExportAttendanceReport = () => {
    const combinedData = getCombinedExportData();
    if (combinedData.length === 0) {
      notifyEmptyExport();
    }

    const headers = [
      'Attendance_ID',
      'Student_ID',
      'Student Name',
      'Course_ID',
      'Course Name',
      'Date',
      'Time In',
      'Time Out',
      'SetUp',
      'Status',
      'Check-in Time',
      'Confidence Score'
    ];

    const sessionDate = new Date().toLocaleDateString();
    const courseId = currentClass?.id || 'N/A';
    const courseName = currentClass?.name || 'N/A';
    const timeIn = cameraStartTime || 'N/A';
    const timeOut = cameraStopTime || 'N/A';
    const scheduledTime = currentClass ? `${currentClass.startTime} - ${currentClass.endTime}` : 'N/A';

    const rows = combinedData.map((student, index) => {
      const attendanceId = student.id || index + 1;
      const studentId = student.studentId || student.id || 'N/A';
      const studentName = student.name || 'Unknown';
      const setUp = student.mode || 'Onsite';
      const status = student.status || 'Present';
      const confidenceScore = student.confidence || student.confidenceScore || 'N/A';

      return [
        attendanceId,
        studentId,
        studentName,
        courseId,
        courseName,
        sessionDate,
        timeIn,
        timeOut,
        setUp,
        status,
        scheduledTime,
        confidenceScore
      ];
    });

    downloadCsv(headers, rows, 'attendance_report');
  };

  const handleExportEngagementReport = () => {
    const combinedData = getCombinedExportData();
    if (combinedData.length === 0) {
      notifyEmptyExport();
    }

    const headers = [
      'Record_ID',
      'Student_ID',
      'Student Name',
      'Mode',
      'Course_ID',
      'Course Name',
      'Date',
      'Session Start',
      'Session End',
      'Engagement Score',
      'Engagement Level',
      'Is Sleeping',
      'Is Speaking',
      'Hand Raised',
      'Status'
    ];

    const sessionDate = new Date().toLocaleDateString();
    const courseId = currentClass?.id || 'N/A';
    const courseName = currentClass?.name || 'N/A';
    const sessionStart = cameraStartTime || 'N/A';
    const sessionEnd = cameraStopTime || 'N/A';

    const rows = combinedData.map((student, index) => {
      const numericScore = Number(student.engagementScore);
      const engagementScore = Number.isFinite(numericScore) ? numericScore.toFixed(1) : 'N/A';
      const isSleeping = typeof student.isSleeping === 'boolean' ? (student.isSleeping ? 'Yes' : 'No') : 'N/A';
      const isSpeaking = typeof student.isSpeaking === 'boolean' ? (student.isSpeaking ? 'Yes' : 'No') : 'N/A';
      const handRaised = typeof student.handRaised === 'boolean' ? (student.handRaised ? 'Yes' : 'No') : 'N/A';

      return [
        student.id || index + 1,
        student.studentId || student.id || 'N/A',
        student.name || 'Unknown',
        student.mode || 'Unknown',
        courseId,
        courseName,
        sessionDate,
        sessionStart,
        sessionEnd,
        engagementScore,
        student.engagementLevel || 'N/A',
        isSleeping,
        isSpeaking,
        handRaised,
        student.status || (student.mode === 'Unknown' ? 'Tentative' : 'Present')
      ];
    });

    downloadCsv(headers, rows, 'engagement_report');
  };

  const totalPresent = onsiteAttendance.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text size={600} weight="bold" style={{ color: '#244670' }}>Professor Dashboard</Text>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.layout}>
        {/* Left: Camera Feed and System Messages */}
        <div className={styles.leftPanel}>
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
              onEngagementUpdate={handleEngagementUpdate}
            />
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

          {/* Debug Information */}
          <Card className={styles.statsCard}>
            <Text weight="semibold" size={400}>Debug Information</Text>
            <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.8', maxHeight: '200px', overflowY: 'auto' }}>
              {debugMessages.length === 0 ? (
                <Text size={200} style={{ color: '#999' }}>Loading debug info...</Text>
              ) : (
                debugMessages.map((msg, idx) => (
                  <div key={idx} style={{ color: msg.includes('Error') ? '#d32f2f' : msg.includes('Sleeping=true') ? '#ff9800' : '#666' }}>
                    {msg}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Stats, Participants, Export, Schedule */}
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

          {/* Engagement Stats Card */}
          <Card className={styles.statsCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text weight="semibold" size={400}>Class Engagement</Text>
              <Badge 
                appearance="filled" 
                color={
                  classEngagement.average_score >= 70 ? 'success' : 
                  classEngagement.average_score >= 40 ? 'warning' : 
                  'danger'
                }
                size="large"
              >
                {classEngagement.average_score?.toFixed(0) || 0}% Average
              </Badge>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem} style={{ backgroundColor: '#dcfce7' }}>
                <Text size={300} style={{ color: '#166534' }}>Engaged</Text>
                <Badge appearance="filled" color="success" size="extra-large">
                  {classEngagement.engaged_count}
                </Badge>
              </div>
              <div className={styles.statItem} style={{ backgroundColor: '#fef3c7' }}>
                <Text size={300} style={{ color: '#92400e' }}>Present</Text>
                <Badge appearance="filled" color="warning" size="extra-large">
                  {classEngagement.present_count}
                </Badge>
              </div>
              <div className={styles.statItem} style={{ backgroundColor: '#fee2e2', gridColumn: 'span 2' }}>
                <Text size={300} style={{ color: '#991b1b' }}>Disengaged</Text>
                <Badge appearance="filled" color="danger" size="extra-large">
                  {classEngagement.disengaged_count}
                </Badge>
              </div>
            </div>
            {onsiteAttendance.length === 0 && (
              <Text size={200} style={{ color: '#999', textAlign: 'center' }}>
                Start the camera to track engagement
              </Text>
            )}
            <Divider style={{ margin: '12px 0 8px 0' }} />
            <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
              <div><strong style={{ color: '#166534' }}>Engaged:</strong> Speaking or raising hand</div>
              <div><strong style={{ color: '#92400e' }}>Present:</strong> Attentive (neutral state)</div>
              <div><strong style={{ color: '#991b1b' }}>Disengaged:</strong> Sleeping (eyes closed) or looking down</div>
            </div>
          </Card>

          {/* Participant Dropdown */}
          <Card className={styles.participantDropdown}>
            <div className={styles.participantHeader}>
              <button
                type="button"
                className={styles.participantToggleButton}
                onClick={() => setParticipantsExpanded((prev) => !prev)}
                aria-expanded={participantsExpanded}
                aria-label="Toggle participants list"
              >
                <Text weight="semibold">View Participants</Text>
                {participantsExpanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
              </button>
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
                        <div key={idx} className={styles.participantItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text size={300} weight="semibold">{p.name}</Text>
                            {p.detectedTime && (
                              <Text size={200} style={{ color: '#666', display: 'block' }}>
                                {p.detectedTime}
                              </Text>
                            )}
                            {p.dominantEmotion && (
                              <Text size={100} style={{ color: '#888', fontStyle: 'italic' }}>
                                {p.dominantEmotion}
                              </Text>
                            )}
                          </div>
                          {p.engagementLevel && (
                            <Badge 
                              appearance="filled"
                              color={
                                p.engagementLevel === 'engaged' ? 'success' : 
                                p.engagementLevel === 'present' ? 'warning' : 
                                'danger'
                              }
                              size="small"
                            >
                              {Number.isFinite(Number(p.engagementScore))
                                ? `${Number(p.engagementScore).toFixed(0)}%`
                                : 'N/A'}
                            </Badge>
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

          {/* Export Panel */}
          <ExportPanel
            onExportAttendance={handleExportAttendanceReport}
            onExportEngagement={handleExportEngagementReport}
          />

          {/* Class Schedule Accordion */}
          <Card className={styles.scheduleCard}>
            <div
              className={styles.scheduleHeader}
              onClick={() => setScheduleExpanded(!scheduleExpanded)}
              style={{ cursor: 'pointer' }}
            >
              <Text weight="semibold" size={400}>Class Schedule</Text>
              {scheduleExpanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
            </div>

            {scheduleExpanded && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  {currentClass && (
                    <Badge appearance="filled" color="success">
                      In Session
                    </Badge>
                  )}
                  <Button
                    appearance="subtle"
                    icon={showInactiveSchedules ? <Eye20Regular /> : <EyeOff20Regular />}
                    onClick={() => setShowInactiveSchedules(!showInactiveSchedules)}
                    size="small"
                    title={showInactiveSchedules ? "Hide inactive classes" : "Show inactive classes"}
                  >
                    {showInactiveSchedules ? "Hide Inactive" : "Show Inactive"}
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<Add20Regular />}
                    onClick={handleOpenCreateModal}
                    size="small"
                  >
                    Add Class
                  </Button>
                </div>

                {currentClass && (
                  <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', marginBottom: '8px' }}>
                    <Text size={200} weight="semibold" style={{ color: '#107c10', display: 'block', marginBottom: '4px' }}>
                      🎓 Currently Teaching:
                    </Text>
                    <Text size={400} weight="bold" style={{ display: 'block' }}>
                      {currentClass.name}
                    </Text>
                    <Text size={200} style={{ color: '#666' }}>
                      {currentClass.room} • {currentClass.startTime} - {currentClass.endTime}
                    </Text>
                  </div>
                )}

                <div className={styles.scheduleList}>
                  {schedules.length === 0 ? (
                    <Text size={200} style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                      No classes scheduled. Use the schedule service to add classes!
                    </Text>
                  ) : (
                    schedules
                      .filter(schedule => showInactiveSchedules ? true : schedule.isActive) // Toggle: show all or active only
                      .map((schedule) => {
                        const isActive = currentClass?.id === schedule.id;
                        const isInactive = !schedule.isActive;
                        return (
                          <div
                            key={schedule.id}
                            className={`${styles.scheduleItem} ${isActive ? styles.scheduleItemActive : ''}`}
                            style={isInactive ? { opacity: 0.5, backgroundColor: '#f5f5f5' } : {}}
                          >
                            <div
                              className={styles.scheduleColorBar}
                              style={{ backgroundColor: schedule.color }}
                            />
                            <div className={styles.scheduleItemContent}>
                              <div className={styles.scheduleItemRow}>
                                <Text weight="semibold" size={300}>
                                  {schedule.name}
                                </Text>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  {isActive && (
                                    <Badge appearance="filled" color="success" size="small">
                                      Active
                                    </Badge>
                                  )}
                                  {isInactive && (
                                    <Badge appearance="tint" color="warning" size="small">
                                      Inactive
                                    </Badge>
                                  )}
                                  <Button
                                    appearance="subtle"
                                    icon={<Edit20Regular />}
                                    size="small"
                                    onClick={() => handleOpenEditModal(schedule)}
                                    title="Edit class"
                                  />
                                  <Button
                                    appearance="subtle"
                                    icon={<Delete20Regular />}
                                    size="small"
                                    onClick={() => handleOpenDeleteDialog(schedule)}
                                    title="Delete class"
                                    style={{ color: '#d32f2f' }}
                                  />
                                </div>
                              </div>

                              <div className={styles.scheduleDays}>
                                {schedule.days.map((day, idx) => (
                                  <Badge
                                    key={idx}
                                    appearance="tint"
                                    color="informative"
                                    className={styles.dayBadge}
                                  >
                                    {day}
                                  </Badge>
                                ))}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <Text size={200} style={{ color: '#666' }}>
                                  📍 {schedule.room}
                                </Text>
                                <Text size={200} style={{ color: '#666' }}>
                                  🕐 {schedule.startTime} - {schedule.endTime}
                                </Text>
                              </div>

                              {schedule.description && (
                                <Text size={200} style={{ color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                                  {schedule.description}
                                </Text>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {upcomingClasses.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    <Text size={200} weight="semibold" style={{ color: '#856404' }}>
                      ⏰ Next: {upcomingClasses[0].name} at {upcomingClasses[0].startTime}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      </div>

      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        initialData={editingSchedule}
        mode={scheduleModalMode}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        scheduleName={deletingSchedule?.name || ''}
      />
    </div>
  );
}

export default ProfessorDashboard;
