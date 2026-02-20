import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  Add20Regular,
  Add24Regular,
  Edit20Regular,
  Delete20Regular,
  Edit24Regular,
  Delete24Regular,
  EyeOff20Regular,
  Eye20Regular
} from '@fluentui/react-icons';
import FacialRecognition from './FacialRecognition';
import ExportPanel from './ExportPanel';
import ScheduleModal from './modals/ScheduleModal';
import DeleteConfirmDialog from './modals/DeleteConfirmDialog';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../../services/scheduleServices/scheduleService';
import '../../services/scheduleServices/testSchedule'; // Enable browser console testing
import { supabase } from '../../config/supabase.config.js';

const useStyles = makeStyles({
  /* ---- Layout shell ---- */
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(135deg, #294972 35%, #ffba08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  /* Shared card baseline (to keep sizes cohesive like Student Portal) */
  baseCard: {
    ...shorthands.padding('24px'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minHeight: '200px',
  },

  /* ---- Top bar ---- */
  topBar: {
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
    },
  },
  logo: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#244670',
    cursor: 'default',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '@media (max-width: 768px)': { fontSize: '24px' },
  },
  logoHighlight: { color: '#FFB900' },
  hamburgerButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    fontSize: '24px',
    color: '#244670',
    '&:hover': { backgroundColor: '#f3f2f1', borderRadius: '4px' },
  },

  /* ---- Date / Session header ---- */
  sessionHeader: {
    ...shorthands.padding('16px', '30px'),
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '@media (max-width: 768px)': {
      fontSize: '16px',
      ...shorthands.padding('12px', '20px'),
    },
  },

  /* ---- Slide-in sidebar overlay (matches Student Portal) ---- */
  menuBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
    animation: 'fadeIn 300ms ease-in-out',
  },
  menuPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '280px',
    backgroundColor: '#ffffff',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 300ms ease-in-out',
    '@media (max-width: 768px)': { width: '260px' },
  },
  menuHeader: {
    ...shorthands.padding('20px'),
    ...shorthands.borderBottom('1px', 'solid', '#e1e4e8'),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#244670',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    borderRadius: '4px',
    '&:hover': { backgroundColor: '#f3f2f1' },
  },
  menuItems: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('10px'),
    flex: 1,
  },
  menuItem: {
    ...shorthands.padding('14px', '16px'),
    cursor: 'pointer',
    fontSize: '15px',
    color: '#323130',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    borderRadius: '4px',
    textAlign: 'left',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '&:hover': { backgroundColor: '#f3f2f1' },
  },
  menuItemActive: {
    backgroundColor: '#e8f4f8',
    color: '#244670',
    fontWeight: '600',
  },
  menuDivider: {
    ...shorthands.margin('10px', '0'),
    borderTop: '1px solid #e1e4e8',
  },

  /* ---- Content area ---- */
  contentWrapper: {
    display: 'flex',
    flex: 1,
    ...shorthands.padding('24px'),
    '@media (max-width: 768px)': {
      ...shorthands.padding('16px'),
    },
  },

  /* ---- Dashboard view: two-column grid ---- */
  layout: {
    display: 'grid',
    gridTemplateColumns: '55% 1fr',
    ...shorthands.gap('20px'),
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
    ...shorthands.gap('16px')
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  statsCard: {
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('14px'),
    ...shorthands.border('none'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('12px')
  },
  statTile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('14px', '12px'),
    borderRadius: '10px',
    borderLeft: '5px solid transparent',
    minHeight: '80px',
  },
  statTileNumber: {
    fontSize: '28px',
    fontWeight: '800',
    lineHeight: '1',
    marginBottom: '4px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  statTileLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  participantCard: {
    ...shorthands.padding('20px'),
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  participantContent: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('0px')
  },
  participantRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('10px', '14px'),
    backgroundColor: '#e8f4f8',
    borderRadius: '6px',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e3a5f',
    borderLeft: '4px solid #1e3a5f',
  },
  presentBadge: {
    ...shorthands.padding('4px', '14px'),
    backgroundColor: '#1e3a5f',
    color: '#ffffff',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.3px',
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

  /* ---- Schedule view ---- */
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
    maxHeight: '600px',
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
    flexDirection: 'row',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    flexWrap: 'nowrap',
    overflowX: 'auto'
  },
  dayBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    display: 'inline-flex',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },

  /* ---- Export / Schedule view wrapper ---- */
  viewWrapper: {
    width: '100%',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  viewTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  scheduleTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#244670',
    margin: 0,
    textAlign: 'left',
    lineHeight: '1.2',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '@media (max-width: 768px)': {
      fontSize: '18px',
      marginBottom: '8px',
      lineHeight: '1.2',
      ...shorthands.padding('0', '10px')
    }
  },
});

const DEFAULT_UNKNOWN = [];

function ProfessorDashboard({ userContext }) {
  const styles = useStyles();
  const [onsiteAttendance, setOnsiteAttendance] = useState([]);
  const [unknownFaces, setUnknownFaces] = useState(DEFAULT_UNKNOWN);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);
  const [debugMessages, setDebugMessages] = useState([]);

  // Sidebar & view state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'schedule' | 'export'

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
  const [profFirstName, setProfFirstName] = useState(null);

  // Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState('create'); // 'create' or 'edit'
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [showInactiveSchedules, setShowInactiveSchedules] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfileFirstName = async () => {
      if (!supabase) return;
      try {
        // Prefer email from userContext when available
        if (userContext?.email) {
          const { data, error } = await supabase.from('user_profiles').select('first_name').eq('email', userContext.email).limit(1).maybeSingle();
          if (!mounted) return;
          if (!error && data) {
            setProfFirstName(data.first_name || null);
            return;
          }
        }

        // Fallback: try auth user id if available
        if (supabase.auth && supabase.auth.getUser) {
          const { data: authData } = await supabase.auth.getUser();
          const user = authData?.user;
          if (user) {
            const { data, error } = await supabase.from('user_profiles').select('first_name').eq('user_id', user.id).limit(1).maybeSingle();
            if (!mounted) return;
            if (!error && data) setProfFirstName(data.first_name || null);
          }
        }
      } catch (err) {
        console.debug('Could not load profile first name from Supabase:', err?.message || err);
      }
    };

    loadProfileFirstName();
    return () => { mounted = false; };
  }, [userContext]);

  // Load schedules and compute current/upcoming classes
  useEffect(() => {
    let mounted = true;

    const computeCurrentAndUpcoming = (schedulesList) => {
      const now = new Date();
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const todaySchedules = (schedulesList || []).filter(sch => sch.isActive && (sch.days || []).includes(currentDay));

      const current = todaySchedules.find(schedule => schedule.startTime <= currentTime && schedule.endTime >= currentTime) || null;
      const upcoming = todaySchedules.filter(schedule => schedule.startTime > currentTime);
      return { current, upcoming };
    };

    const load = async () => {
      try {
        const loadedSchedules = await getAllSchedules();
        if (!mounted) return;
        setSchedules(loadedSchedules);
        const { current, upcoming } = computeCurrentAndUpcoming(loadedSchedules);
        setCurrentClass(current);
        setUpcomingClasses(upcoming);
      } catch (err) {
        console.error('Error loading schedules:', err);
      }
    };

    load();

    const intervalId = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, []);

  // CRUD handlers for schedules
  const handleCreateSchedule = async (scheduleData) => {
    try {
      const newSchedule = await createSchedule(scheduleData);
      const refreshed = await getAllSchedules();
      setSchedules(refreshed);
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

  const handleUpdateSchedule = async (id, updates) => {
    try {
      const updated = await updateSchedule(id, updates);
      const refreshed = await getAllSchedules();
      setSchedules(refreshed);
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

  const handleDeleteSchedule = async (id) => {
    try {
      const success = await deleteSchedule(id);
      if (success) {
        const refreshed = await getAllSchedules();
        setSchedules(refreshed);
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

  // Helper: get authoritative first name from userContext or profile storage
  const getFirstName = () => {
    // Prefer Supabase profile first name when available
    if (profFirstName) return String(profFirstName).split(' ')[0];
    // Then prefer explicit first name fields from userContext (no email fallback)
    const first = userContext?.firstName || userContext?.givenName || userContext?.profile?.first_name || userContext?.name || '';
    if (first) return String(first).split(' ')[0];
    try {
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      if (stored?.firstName) return String(stored.firstName).split(' ')[0];
      if (stored?.givenName) return String(stored.givenName).split(' ')[0];
    } catch (e) { }
    return 'Professor';
  };

  const totalStudentsOnsite = onsiteAttendance.length + unknownFaces.length;
  const totalClasses = schedules.length;

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);

  const handleMenuItemClick = (view) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  };

  /* ---- Top Bar ---- */
  const renderTopBar = () => (
    <div className={styles.topBar}>
      <div className={styles.logo}>
        Attend<span className={styles.logoHighlight}>Ease</span>
      </div>
      <button
        className={styles.hamburgerButton}
        onClick={handleMenuToggle}
        aria-label="Menu"
      >
        ☰
      </button>
    </div>
  );

  /* ---- Slide-in Sidebar Menu ---- */
  const renderMenu = () => {
    if (!isMenuOpen) return null;
    return (
      <>
        <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
        <div className={styles.menuPanel}>
          <div className={styles.menuHeader}>
            <Text className={styles.menuTitle}>Menu</Text>
            <button className={styles.closeButton} onClick={() => setIsMenuOpen(false)} aria-label="Close">
              <Dismiss24Regular />
            </button>
          </div>
          <div className={styles.menuItems}>
            <button
              className={`${styles.menuItem} ${currentView === 'dashboard' ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`${styles.menuItem} ${currentView === 'schedule' ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick('schedule')}
            >
              Schedule
            </button>
            <button
              className={`${styles.menuItem} ${currentView === 'export' ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick('export')}
            >
              Generate Reports
            </button>
            <div className={styles.menuDivider} />
            <button className={styles.menuItem} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  /* ---- Dashboard View (Camera + Stats + Engagement + Participants) ---- */
  const renderDashboardView = () => (
    <div className={styles.layout}>
      {/* Left: Camera Feed */}
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
      </div>

      {/* Right: Stats, Engagement, Participants */}
      <div className={styles.rightPanel}>
        {/* Stats + Engagement side by side */}
        <div className={styles.statsRow}>
          {/* Live Statistics Card */}
          <Card className={styles.statsCard}>
            <Text weight="semibold" size={400} style={{ color: '#1e3a5f' }}>Live Statistics</Text>
            <div className={styles.statsGrid}>
              <div className={styles.statTile} style={{ backgroundColor: '#03346E' }}>
                <span className={styles.statTileNumber} style={{ color: '#ffffff' }}>{totalClasses}</span>
                <span className={styles.statTileLabel} style={{ color: '#ffffff' }}>Total Student</span>
              </div>
              <div className={styles.statTile} style={{ backgroundColor: '#021526' }}>
                <span className={styles.statTileNumber} style={{ color: '#ffffff' }}>{totalPresent}</span>
                <span className={styles.statTileLabel} style={{ color: '#ffffff' }}>Total Present</span>
              </div>
              <div className={styles.statTile} style={{ backgroundColor: '#EEF7FF' }}>
                <span className={styles.statTileNumber} style={{ color: '#1e3a5f' }}>{onsiteAttendance.length}</span>
                <span className={styles.statTileLabel} style={{ color: '#555' }}>Onsite Students</span>
              </div>
              <div className={styles.statTile} style={{ backgroundColor: '#CDE8E5' }}>
                <span className={styles.statTileNumber} style={{ color: '#1e3a5f' }}>{totalStudentsOnsite}</span>
                <span className={styles.statTileLabel} style={{ color: '#555' }}>Online Students</span>
              </div>
            </div>
          </Card>

          {/* Class Engagement Card */}
          <Card className={styles.statsCard}>
            <Text weight="semibold" size={400} style={{ color: '#1e3a5f' }}>Class Engagement</Text>
            <div className={styles.statsGrid}>
              <div className={styles.statTile} style={{ backgroundColor: '#FEEE91' }}>
                <span className={styles.statTileNumber} style={{ color: '#333' }}>{classEngagement.present_count}</span>
                <span className={styles.statTileLabel} style={{ color: '#555' }}>Neutral</span>
              </div>
              <div className={styles.statTile} style={{ backgroundColor: '#FCB53B' }}>
                <span className={styles.statTileNumber} style={{ color: '#ffffff' }}>{classEngagement.average_score?.toFixed(0) || 0}</span>
                <span className={styles.statTileLabel} style={{ color: '#ffffff' }}>Engagement Rate</span>
              </div>
              <div className={styles.statTile} style={{ backgroundColor: '#F1511B' }}>
                <span className={styles.statTileNumber} style={{ color: '#ffffff' }}>{classEngagement.disengaged_count}</span>
                <span className={styles.statTileLabel} style={{ color: '#ffffff' }}>Disengaged</span>
              </div>
              <div className={styles.statTile} style={{ backgroundColor: '#36C752' }}>
                <span className={styles.statTileNumber} style={{ color: '#ffffff' }}>{classEngagement.engaged_count}</span>
                <span className={styles.statTileLabel} style={{ color: '#ffffff' }}>Engaged</span>
              </div>
            </div>
          </Card>
        </div>

        {/* View Participants (always visible) */}
        <div className={styles.participantCard}>
          <Text weight="semibold" size={400} style={{ color: '#1e3a5f' }}>View Participants</Text>
          <div className={styles.participantContent}>
            {onsiteAttendance.length === 0 && unknownFaces.length === 0 ? (
              <Text size={200} style={{ color: '#999', textAlign: 'center', padding: '12px 0' }}>
                No participants yet — start the camera
              </Text>
            ) : (
              <>
                {onsiteAttendance.map((p, idx) => (
                  <div key={`onsite-${idx}`} className={styles.participantRow}>
                    <span>{p.name}</span>
                    <span className={styles.presentBadge}>Present</span>
                  </div>
                ))}
                {unknownFaces.map((p, idx) => (
                  <div key={`unknown-${idx}`} className={styles.participantRow} style={{ borderLeftColor: '#ffba08' }}>
                    <span>Unknown Face #{idx + 1}</span>
                    <span className={styles.presentBadge} style={{ backgroundColor: '#b8860b' }}>Tentative</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );


  /* ---- Schedule View ---- */
  const renderScheduleView = () => (
    <div className={styles.viewWrapper}>
      <Card className={styles.scheduleCard}>
        <div className={styles.scheduleHeader} style={{ marginBottom: '12px' }}>
          <Text className={styles.scheduleTitle}>Class Schedule</Text>
        </div>
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
            icon={<Add24Regular />}
            onClick={handleOpenCreateModal}
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
              .filter(schedule => showInactiveSchedules ? true : schedule.isActive)
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
                            icon={<Edit24Regular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => handleOpenEditModal(schedule)}
                            title="Edit class"
                            aria-label={`Edit ${schedule.name}`}
                          />
                          <Button
                            icon={<Delete24Regular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(schedule)}
                            title="Delete class"
                            aria-label={`Delete ${schedule.name}`}
                            style={{ color: '#d32f2f' }}
                          />
                        </div>
                      </div>

                      <div className={styles.scheduleDays}>
                        {schedule.days.map((day, idx) => {
                          const label = String(day).replace(/\*/g, '').trim();
                          return (
                            <Badge
                              key={idx}
                              appearance="tint"
                              color="informative"
                              className={styles.dayBadge}
                            >
                              {label}
                            </Badge>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        <Text size={200} style={{ color: '#666' }}>
                          <strong>Room:</strong> {schedule.room}
                        </Text>
                        <Text size={200} style={{ color: '#666' }}>
                          <strong>Time:</strong> {schedule.startTime} - {schedule.endTime}
                        </Text>
                      </div>

                      {/* description intentionally hidden per UX request */}
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
    </div>
  );

  /* ---- Export View ---- */
  const renderExportView = () => (
    <div className={styles.viewWrapper}>
      <div className={styles.viewTitle}>Export Reports</div>
      <ExportPanel
        onExportAttendance={handleExportAttendanceReport}
        onExportEngagement={handleExportEngagementReport}
      />
    </div>
  );

  /* ---- Render selected view ---- */
  const renderCurrentView = () => {
    switch (currentView) {
      case 'schedule':
        return renderScheduleView();
      case 'export':
        return renderExportView();
      case 'dashboard':
      default:
        return renderDashboardView();
    }
  };

  return (
    <div className={styles.container}>
      {renderTopBar()}
      {renderMenu()}

      {/* Date / Session header */}
      {currentView === 'dashboard' && (
        <div className={styles.sessionHeader}>
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Live Session Feed
        </div>
      )}

      <div className={styles.contentWrapper}>
        {renderCurrentView()}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default ProfessorDashboard;
