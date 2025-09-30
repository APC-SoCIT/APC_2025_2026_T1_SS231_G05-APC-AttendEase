import React, { useState, useEffect } from 'react';
import { 
  Button,
  Spinner,
  makeStyles,
  shorthands,
  Text,
  Badge
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
    marginTop: '15px'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px')
  },
  controls: {
    display: 'flex',
    ...shorthands.gap('10px'),
    alignItems: 'center'
  },
  studentList: {
    ...shorthands.padding('10px'),
    ...shorthands.border('1px', 'solid', '#ddd'),
    borderRadius: '4px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  studentItem: {
    ...shorthands.padding('8px'),
    ...shorthands.margin('5px', '0'),
    ...shorthands.border('1px', 'solid', '#eee'),
    borderRadius: '4px',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  messages: {
    ...shorthands.padding('10px'),
    ...shorthands.border('1px', 'solid', '#ddd'),
    backgroundColor: '#f9f9f9',
    maxHeight: '150px',
    overflowY: 'auto',
    fontSize: '12px',
    borderRadius: '4px'
  }
});

function OnlineAttendance({ meetingId, onAttendanceUpdate }) {
  const styles = useStyles();
  const [students, setStudents] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [graphApiStatus, setGraphApiStatus] = useState('Not Connected');

  useEffect(() => {
    checkGraphApiStatus();
  }, []);

  useEffect(() => {
    if (isTracking && meetingId) {
      fetchOnlineAttendance();
      const interval = setInterval(fetchOnlineAttendance, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isTracking, meetingId]);

  const addMessage = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev.slice(-9), { timestamp, message, type }]);
  };

  const checkGraphApiStatus = async () => {
    try {
      const response = await fetch('/api/attendance/graph-status');
      const data = await response.json();
      
      if (data.status === 'configured') {
        setGraphApiStatus('Connected ✓');
        addMessage('✅ Graph API configured and ready', 'success');
      } else {
        setGraphApiStatus('Not Configured');
        addMessage('⚠️ Graph API not configured', 'warning');
      }
    } catch (error) {
      setGraphApiStatus('Error');
      addMessage('❌ Error checking Graph API status', 'error');
    }
  };

  const fetchOnlineAttendance = async () => {
    if (!meetingId) {
      addMessage('⚠️ No meeting ID available. Make sure you\'re in a Teams meeting.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      addMessage('Fetching online attendance from Graph API...', 'info');
      
      const response = await fetch(`/api/attendance/online/${encodeURIComponent(meetingId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.students) {
        setStudents(data.students);
        onAttendanceUpdate(data.students);
        addMessage(`✅ Found ${data.students.length} online student(s)`, 'success');
      } else if (data.status === 'no_data') {
        setStudents([]);
        addMessage('ℹ️ No attendance data available yet. Meeting may not have started.', 'info');
      } else {
        addMessage(`⚠️ ${data.message || 'Unknown response'}`, 'warning');
      }
    } catch (error) {
      addMessage(`❌ Error: ${error.message}`, 'error');
      console.error('Error fetching online attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTracking = () => {
    if (!meetingId) {
      addMessage('❌ Cannot start tracking: No meeting ID found. Please ensure you\'re in a Teams meeting.', 'error');
      return;
    }
    setIsTracking(true);
    addMessage('🟢 Started tracking online attendance', 'success');
  };

  const stopTracking = () => {
    setIsTracking(false);
    addMessage('🔴 Stopped tracking online attendance', 'info');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <Text weight="semibold">Graph API Status: </Text>
        <Badge color={graphApiStatus.includes('✓') ? 'success' : 'warning'}>
          {graphApiStatus}
        </Badge>
        {isLoading && <Spinner size="tiny" />}
      </div>

      {meetingId ? (
        <div className={styles.status}>
          <Text size={200}>Meeting ID: {meetingId.substring(0, 20)}...</Text>
        </div>
      ) : (
        <div className={styles.status}>
          <Text size={200} style={{ color: '#d32f2f' }}>
            ⚠️ No meeting detected. Please open this tab during a Teams meeting.
          </Text>
        </div>
      )}

      <div className={styles.controls}>
        <Button 
          appearance="primary" 
          onClick={startTracking}
          disabled={isTracking || !meetingId}
        >
          Start Tracking
        </Button>
        
        <Button 
          onClick={stopTracking}
          disabled={!isTracking}
        >
          Stop Tracking
        </Button>

        <Button 
          onClick={fetchOnlineAttendance}
          disabled={!meetingId || isLoading}
        >
          Refresh Now
        </Button>
      </div>

      <div>
        <Text weight="semibold">Online Students: </Text>
        <Badge appearance="filled" color="success">{students.length}</Badge>
        
        <div className={styles.studentList}>
          {students.length === 0 ? (
            <Text>No online students detected yet</Text>
          ) : (
            students.map((student, index) => (
              <div key={index} className={styles.studentItem}>
                <div>
                  <Text weight="semibold">{student.name || student.email}</Text>
                  <br />
                  <Text size={200}>
                    Joined: {student.joinTime ? new Date(student.joinTime).toLocaleTimeString() : '-'}
                  </Text>
                  {student.duration && (
                    <>
                      <Text size={200}> | Duration: {formatDuration(student.duration)}</Text>
                    </>
                  )}
                </div>
                <Badge color={student.status === 'left' ? 'warning' : 'success'}>
                  {student.status === 'left' ? 'Left' : 'Present'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.messages}>
        <Text weight="semibold">System Messages:</Text>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{ 
              color: msg.type === 'error' ? '#d32f2f' : 
                     msg.type === 'success' ? '#388e3c' : 
                     msg.type === 'warning' ? '#f57c00' : '#1976d2',
              fontSize: '11px'
            }}
          >
            [{msg.timestamp}] {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnlineAttendance;
