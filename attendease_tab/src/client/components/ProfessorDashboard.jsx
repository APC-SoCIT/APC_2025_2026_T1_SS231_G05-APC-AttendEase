import React, { useState, useEffect, useRef } from 'react';
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
  Eye20Regular,
  ArrowDownload20Regular,
  Checkmark20Regular
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
    ...shorthands.padding('40px', '30px'),
    color: '#ffffff',
    fontSize: '35px',
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
    marginBottom: '5px'
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

  /* ---- Schedule view ---- */
  scheduleCard: {
    ...shorthands.padding('24px', '32px'),
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  scheduleMainTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2b2e63',
    ...shorthands.margin(0),
  },
  scheduleTableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 120px', 
    alignItems: 'center',
    paddingBottom: '8px',
    ...shorthands.borderBottom('1px', 'solid', '#f0f0f0'),
    marginBottom: '16px',
  },
  tableHeaderText: {
    color: '#ffb900', 
    fontSize: '18px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableHeaderCenter: {
    color: '#ffb900', 
    fontSize: '18px',
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  scheduleItem: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 120px',
    alignItems: 'center',
    ...shorthands.padding('12px', '0'),
    ...shorthands.borderBottom('1px', 'solid', '#f9f9f9'),
    '&:hover': {
      backgroundColor: '#fcfcfc',
    },
  },
  classIdentityWrapper: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  classColorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  scheduleItemText: {
    color: '#2b2e63', 
    fontSize: '14px',
    fontWeight: 'bold',
  },
  scheduleItemTextCenter: {
    color: '#2b2e63', 
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scheduleActions: {
    display: 'flex',
    ...shorthands.gap('16px'),
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  enterActionText: {
    color: '#ffb900',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
  },
  actionIcon: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },

  /* ---- View wrappers ---- */
  viewWrapper: {
    width: '100%',
    maxWidth: '900px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },

  /* ---- EXPORT / CLASS RECORDS VIEW (NEW STYLES) ---- */
  exportMainCard: {
    ...shorthands.padding('40px'),
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  exportMainTitle: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#2b2e63',
    ...shorthands.margin(0),
    lineHeight: '1.2',
    letterSpacing: '-1px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  exportSubtitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#000000',
    marginTop: '16px',
    marginBottom: '4px',
  },
  exportDescText: {
    fontSize: '14px',
    color: '#333333',
  },
  exportGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('24px'),
    marginTop: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  classExportCard: {
    ...shorthands.padding('24px'),
    ...shorthands.border('1px', 'solid', '#d1d5db'),
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  classExportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classExportTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2b2e63',
    textTransform: 'uppercase',
  },
  classExportActions: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
  downloadIconBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdfbfa',
    ...shorthands.border('1px', 'solid', '#f3f2f1'),
    borderRadius: '4px',
    color: '#ffb900',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f3f2f1',
    }
  },
  meetingList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  meetingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('16px', '20px'),
    ...shorthands.border('1px', 'solid', '#ffb900'),
    borderRadius: '12px',
    backgroundColor: '#ffffff',
  },
  meetingInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('24px'),
    '@media (max-width: 600px)': {
      ...shorthands.gap('12px'),
      flexDirection: 'column',
      alignItems: 'flex-start',
    }
  },
  meetingName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#2b2e63',
    minWidth: '90px',
  },
  meetingDate: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '500',
  },
  meetingTime: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '500',
  },
  checkboxOutline: {
    width: '20px',
    height: '20px',
    ...shorthands.border('2px', 'solid', '#e5e7eb'),
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  }
});

const DEFAULT_UNKNOWN = [];

// Helper to generate the meetings (Can be replaced with a real DB fetch later)
const getMeetingsForClass = (schedule) => {
  if (!schedule) return [];
  return [
    { id: 1, name: 'Current Session', date: new Date().toLocaleDateString(), time: `${schedule.startTime || 'TBD'} - ${schedule.endTime || 'TBD'}` },
    { id: 2, name: 'Previous Session 1', date: '02-17-2026', time: `${schedule.startTime || 'TBD'} - ${schedule.endTime || 'TBD'}` },
    { id: 3, name: 'Previous Session 2', date: '02-12-2026', time: `${schedule.startTime || 'TBD'} - ${schedule.endTime || 'TBD'}` },
  ];
};

function ProfessorDashboard({ userContext }) {
  const styles = useStyles();
  const [onsiteAttendance, setOnsiteAttendance] = useState([]);
  const [unknownFaces, setUnknownFaces] = useState(DEFAULT_UNKNOWN);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);
  const [debugMessages, setDebugMessages] = useState([]);

  // Sidebar & view state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('schedule');

  // Engagement tracking state
  const [classEngagement, setClassEngagement] = useState({
    average_score: 0,
    engaged_count: 0,
    present_count: 0,
    disengaged_count: 0
  });

  // Track camera session start/stop times
  const [cameraStartTime, setCameraStartTime] = useState(null);
  const [cameraStopTime, setCameraStopTime] = useState(null);

  // Schedule state
  const [schedules, setSchedules] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [profFirstName, setProfFirstName] = useState(null);

  // State to track selected checkboxes for export: { [classId]: [meetingId1, meetingId2] }
  const [selectedMeetings, setSelectedMeetings] = useState({});

  // Ref to track if the user manually selected a class
  const isManualOverrideRef = useRef(false);

  // Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState('create');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [showInactiveSchedules, setShowInactiveSchedules] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfileFirstName = async () => {
      if (!supabase) return;
      try {
        if (userContext?.email) {
          const { data, error } = await supabase.from('user_profiles').select('first_name').eq('email', userContext.email).limit(1).maybeSingle();
          if (!mounted) return;
          if (!error && data) {
            setProfFirstName(data.first_name || null);
            return;
          }
        }
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
        setUpcomingClasses(upcoming);
        
        if (!isManualOverrideRef.current) {
          setCurrentClass(current);
        }

      } catch (err) {
        console.error('Error loading schedules:', err);
      }
    };

    load();
    const intervalId = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, []);

  const handleEnterClass = (schedule) => {
    setCurrentClass(schedule);
    isManualOverrideRef.current = true;
    setCurrentView('dashboard');
  };

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

  const handleEngagementUpdate = (engagementData) => {
    setClassEngagement(engagementData);
  };

  // Toggle checkbox state for meetings
  const handleToggleMeeting = (classId, meetingId) => {
    setSelectedMeetings((prev) => {
      const classSelections = prev[classId] || [];
      if (classSelections.includes(meetingId)) {
        return { ...prev, [classId]: classSelections.filter(id => id !== meetingId) };
      } else {
        return { ...prev, [classId]: [...classSelections, meetingId] };
      }
    });
  };

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

  // Updated Attendance Export targeting Checked Meetings
  const handleExportAttendanceReport = (targetClass) => {
    if (!targetClass) return;
    
    const selectedIds = selectedMeetings[targetClass.id] || [];
    if (selectedIds.length === 0) {
      alert("Please check at least one meeting to export its data.");
      return;
    }

    // Retrieve full meeting objects based on selected IDs
    const allMeetings = getMeetingsForClass(targetClass);
    const selectedMeetingObjects = allMeetings.filter(m => selectedIds.includes(m.id));

    // Get live data if available, otherwise generate dummy data to show structure
    const baseData = getCombinedExportData();
    const dataToExport = baseData.length > 0 ? baseData : [{ id: 'N/A', name: 'No Live Data (Demo)', mode: 'Unknown', status: 'N/A', confidenceScore: 'N/A' }];

    const headers = [
      'Attendance_ID',
      'Student_ID',
      'Student Name',
      'Course_ID',
      'Course Name',
      'Session Name',
      'Date',
      'Time In',
      'Time Out',
      'SetUp',
      'Status',
      'Confidence Score'
    ];

    const courseId = targetClass?.id || 'N/A';
    const courseName = targetClass?.name || 'N/A';

    const rows = [];
    selectedMeetingObjects.forEach((meeting) => {
      dataToExport.forEach((student, index) => {
        rows.push([
          student.id || index + 1,
          student.studentId || student.id || 'N/A',
          student.name || 'Unknown',
          courseId,
          courseName,
          meeting.name,     // Inject selected meeting info
          meeting.date,     // Inject selected meeting date
          cameraStartTime || 'N/A',
          cameraStopTime || 'N/A',
          student.mode || 'Onsite',
          student.status || 'Present',
          student.confidence || student.confidenceScore || 'N/A'
        ]);
      });
    });

    downloadCsv(headers, rows, `${courseName.replace(/\s+/g, '_')}_attendance_report`);
  };

  // Updated Engagement Export targeting Checked Meetings
  const handleExportEngagementReport = (targetClass) => {
    if (!targetClass) return;

    const selectedIds = selectedMeetings[targetClass.id] || [];
    if (selectedIds.length === 0) {
      alert("Please check at least one meeting to export its data.");
      return;
    }

    const allMeetings = getMeetingsForClass(targetClass);
    const selectedMeetingObjects = allMeetings.filter(m => selectedIds.includes(m.id));

    const baseData = getCombinedExportData();
    const dataToExport = baseData.length > 0 ? baseData : [{ id: 'N/A', name: 'No Live Data (Demo)', mode: 'Unknown', status: 'N/A', engagementScore: 'N/A', engagementLevel: 'N/A', isSleeping: 'N/A', isSpeaking: 'N/A', handRaised: 'N/A' }];

    const headers = [
      'Record_ID',
      'Student_ID',
      'Student Name',
      'Mode',
      'Course_ID',
      'Course Name',
      'Session Name',
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

    const courseId = targetClass?.id || 'N/A';
    const courseName = targetClass?.name || 'N/A';

    const rows = [];
    selectedMeetingObjects.forEach((meeting) => {
      dataToExport.forEach((student, index) => {
        const numericScore = Number(student.engagementScore);
        const engagementScore = Number.isFinite(numericScore) ? numericScore.toFixed(1) : 'N/A';
        const isSleeping = typeof student.isSleeping === 'boolean' ? (student.isSleeping ? 'Yes' : 'No') : 'N/A';
        const isSpeaking = typeof student.isSpeaking === 'boolean' ? (student.isSpeaking ? 'Yes' : 'No') : 'N/A';
        const handRaised = typeof student.handRaised === 'boolean' ? (student.handRaised ? 'Yes' : 'No') : 'N/A';

        rows.push([
          student.id || index + 1,
          student.studentId || student.id || 'N/A',
          student.name || 'Unknown',
          student.mode || 'Unknown',
          courseId,
          courseName,
          meeting.name,   // Inject selected meeting info
          meeting.date,   // Inject selected meeting date
          cameraStartTime || 'N/A',
          cameraStopTime || 'N/A',
          engagementScore,
          student.engagementLevel || 'N/A',
          isSleeping,
          isSpeaking,
          handRaised,
          student.status || (student.mode === 'Unknown' ? 'Tentative' : 'Present')
        ]);
      });
    });

    downloadCsv(headers, rows, `${courseName.replace(/\s+/g, '_')}_engagement_report`);
  };

  const totalPresent = onsiteAttendance.length;
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

  // Extract the professor's first name, returning empty string if not found
  const getFirstName = () => {
    if (profFirstName) return String(profFirstName).split(' ')[0];
    const first = userContext?.firstName || userContext?.givenName || userContext?.profile?.first_name || userContext?.name || '';
    if (first) return String(first).split(' ')[0];
    try {
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      if (stored?.firstName) return String(stored.firstName).split(' ')[0];
      if (stored?.givenName) return String(stored.givenName).split(' ')[0];
    } catch (e) { }
    return '';
  };

  const firstName = getFirstName();
  const displayGreeting = firstName ? `Welcome, Professor ${firstName}!` : 'Welcome, Professor!';

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
              className={`${styles.menuItem} ${currentView === 'schedule' ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick('schedule')}
            >
              Class Schedule
            </button>
            <button
              className={`${styles.menuItem} ${currentView === 'dashboard' ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`${styles.menuItem} ${currentView === 'export' ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick('export')}
            >
              Class Records
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

  const renderDashboardView = () => (
    <div className={styles.layout}>
      <div className={styles.leftPanel}>
        <Card className={styles.cameraCard}>
          <div className={styles.cameraHeader}>
            <Text weight="semibold" size={700} style={{ color: '#1e3a5f' }}>Onsite Camera Feed</Text>
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

      <div className={styles.rightPanel}>
        <div className={styles.statsRow}>
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
        <div className={styles.scheduleHeader}>
          <Text className={styles.scheduleMainTitle}>Class Schedule</Text>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              style={{ backgroundColor: '#2b2e63', color: '#fff' }}
            >
              Add Class
            </Button>
          </div>
        </div>

        {/* Table Header Section */}
        <div className={styles.scheduleTableHeader}>
          <Text className={styles.tableHeaderText}>CLASSES</Text>
          <Text className={styles.tableHeaderCenter}>DATE</Text>
          <Text className={styles.tableHeaderCenter}>ROOM</Text>
          <Text className={styles.tableHeaderCenter}>TIME</Text>
          <div></div> 
        </div>

        <div className={styles.scheduleList}>
          {schedules.length === 0 ? (
            <Text size={200} style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No classes scheduled. Use the schedule service to add classes!
            </Text>
          ) : (
            schedules
              .filter(schedule => showInactiveSchedules ? true : schedule.isActive)
              .map((schedule) => {
                const isInactive = !schedule.isActive;
                const daysLabel = schedule.days?.map(day => String(day).replace(/\*/g, '').trim()).join(', ') || 'N/A';
                
                return (
                  <div
                    key={schedule.id}
                    className={styles.scheduleItem}
                    style={isInactive ? { opacity: 0.5, backgroundColor: '#f5f5f5' } : {}}
                  >
                    <div className={styles.classIdentityWrapper}>
                      <div 
                        className={styles.classColorDot} 
                        style={{ backgroundColor: schedule.color || '#cccccc' }} 
                      />
                      <Text className={styles.scheduleItemText}>
                        {schedule.name}
                      </Text>
                    </div>
                    <Text className={styles.scheduleItemTextCenter}>
                      {daysLabel}
                    </Text>
                    <Text className={styles.scheduleItemTextCenter}>
                      {schedule.room}
                    </Text>
                    <Text className={styles.scheduleItemTextCenter}>
                      {schedule.startTime} - {schedule.endTime}
                    </Text>
                    <div className={styles.scheduleActions}>
                      <span 
                        className={styles.enterActionText} 
                        onClick={() => handleEnterClass(schedule)}
                      >
                        ENTER
                      </span>
                      <div className={styles.actionIcon} onClick={() => handleOpenEditModal(schedule)} title="Edit class">
                        <Edit24Regular style={{ color: '#9e9e9e' }} />
                      </div>
                      <div className={styles.actionIcon} onClick={() => handleOpenDeleteDialog(schedule)} title="Delete class">
                        <Delete24Regular style={{ color: '#e57373' }} />
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </Card>
    </div>
  );

  /* ---- Export / Class Records View ---- */
  const renderExportView = () => {
    return (
      <div className={styles.viewWrapper} style={{ maxWidth: '1100px' }}>
        <Card className={styles.exportMainCard}>
          <div>
            <Text className={styles.exportMainTitle}>Class Records</Text>
            <div>
              <Text className={styles.exportSubtitle} block>Export Options</Text>
              <Text className={styles.exportDescText} block>
                Download attendance and engagement reports as separate CSV files.
              </Text>
              <Text className={styles.exportDescText} block>
                Attendance CSV focuses on participation records, while Engagement CSV captures engagement state metrics for each session.
              </Text>
            </div>
          </div>

          <div className={styles.exportGrid}>
            {schedules.length === 0 ? (
              <Text size={200} style={{ color: '#999', padding: '20px' }}>
                No active classes available to export. Create a class first!
              </Text>
            ) : (
              schedules.map((cls) => {
                const classMeetings = getMeetingsForClass(cls);
                const classSelections = selectedMeetings[cls.id] || [];

                return (
                  <div key={cls.id} className={styles.classExportCard}>
                    <div className={styles.classExportHeader}>
                      <Text className={styles.classExportTitle}>{cls.name}</Text>
                      <div className={styles.classExportActions}>
                        <div 
                          className={styles.downloadIconBtn} 
                          onClick={() => handleExportAttendanceReport(cls)} 
                          title="Download Attendance CSV"
                        >
                          <ArrowDownload20Regular />
                        </div>
                        <div 
                          className={styles.downloadIconBtn} 
                          onClick={() => handleExportEngagementReport(cls)} 
                          title="Download Engagement CSV"
                        >
                          <ArrowDownload20Regular />
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.meetingList}>
                      {classMeetings.map((meeting) => {
                        const isSelected = classSelections.includes(meeting.id);

                        return (
                          <div key={meeting.id} className={styles.meetingItem}>
                            <div className={styles.meetingInfo}>
                              <Text className={styles.meetingName}>{meeting.name}</Text>
                              <Text className={styles.meetingDate}>{meeting.date}</Text>
                              <Text className={styles.meetingTime}>{meeting.time}</Text>
                            </div>
                            
                            {/* Functional Checkbox */}
                            <div 
                              className={styles.checkboxOutline} 
                              onClick={() => handleToggleMeeting(cls.id, meeting.id)}
                              style={{
                                backgroundColor: isSelected ? '#ffb900' : 'transparent',
                                borderColor: isSelected ? '#ffb900' : '#e5e7eb',
                              }}
                            >
                              {isSelected && <Checkmark20Regular style={{ color: '#fff', width: '16px', height: '16px' }} />}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    );
  };

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

      {/* Conditionally rendered session header depending on view */}
      {currentView === 'dashboard' && (
        <div className={styles.sessionHeader}>
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | {currentClass ? `${currentClass.name} - Live Session` : 'Live Session Feed'}
        </div>
      )}

      {currentView === 'schedule' && (
        <div className={styles.sessionHeader} style={{ paddingBottom: '0', textAlign: 'center', width: '100%' }}>
          {displayGreeting}
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