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
import { Settings48Regular, ChevronDown20Regular, ChevronUp20Regular, Add20Regular, Edit20Regular, Delete20Regular, EyeOff20Regular, Eye20Regular } from '@fluentui/react-icons';
import FacialRecognition from './FacialRecognition';
import ExportPanel from './ExportPanel';
import AdminLoginModal from './modals/AdminLoginModal';
import ScheduleModal from './modals/ScheduleModal';
import DeleteConfirmDialog from './modals/DeleteConfirmDialog';
import { setAdminSession } from '../utils/auth';
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
  scheduleCard: {
    ...shorthands.padding('20px'),
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px')
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
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);

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

  const handleExportReport = () => {
    const combinedData = [
      ...onsiteAttendance.map(s => ({ ...s, mode: 'Onsite' })),
      ...unknownFaces.map(s => ({ ...s, mode: 'Unknown' }))
    ];

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

          {/* Class Schedule */}
          <Card className={styles.scheduleCard}>
            <div className={styles.scheduleHeader}>
              <Text weight="semibold" size={400}>Class Schedule</Text>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

          {/* Export Panel */}
          <ExportPanel onExport={handleExportReport} />
        </div>
      </div>

      <AdminLoginModal
        open={isAdminModalOpen}
        onCancel={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

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
