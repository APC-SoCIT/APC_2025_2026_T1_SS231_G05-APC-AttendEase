import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Select,
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
  videoContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '640px',
    height: '480px',
    ...shorthands.border('2px', 'solid', '#ccc'),
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  overlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '640px',
    height: '480px',
    pointerEvents: 'none',
    zIndex: '10'
  },
  controls: {
    display: 'flex',
    ...shorthands.gap('10px'),
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  messages: {
    ...shorthands.padding('10px'),
    ...shorthands.border('1px', 'solid', '#ddd'),
    backgroundColor: '#f9f9f9',
    maxHeight: '150px',
    overflowY: 'auto',
    fontSize: '12px',
    borderRadius: '4px'
  },
  facesList: {
    ...shorthands.padding('10px'),
    ...shorthands.border('1px', 'solid', '#ddd'),
    borderRadius: '4px',
    marginTop: '10px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  faceItem: {
    ...shorthands.padding('8px'),
    ...shorthands.margin('5px', '0'),
    ...shorthands.border('1px', 'solid', '#eee'),
    borderRadius: '4px',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  faceItemContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px')
  },
  badgeGroup: {
    display: 'flex',
    ...shorthands.gap('6px'),
    alignItems: 'center'
  },
  engagementBadge: {
    fontSize: '11px'
  },
  emotionText: {
    fontSize: '11px',
    color: '#666',
    fontStyle: 'italic'
  }
});

function FacialRecognition({ onAttendanceUpdate, onMessagesUpdate, onEngagementUpdate }) {
  const styles = useStyles();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const cameraActiveRef = useRef(false); // Use ref instead of state to avoid closure issues
  const processingRef = useRef(false);

  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraActive, setCameraActive] = useState(false); // Keep for UI display
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [messages, setMessages] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [serviceStatus, setServiceStatus] = useState('Checking...');
  const [classEngagement, setClassEngagement] = useState({
    average_score: 0,
    engaged_count: 0,
    partial_count: 0,
    disengaged_count: 0
  });
  
  const frameIntervalRef = useRef(null);

  useEffect(() => {
    checkPythonService();
    loadCameras();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, []);

  const addMessage = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => {
      const newMessages = [...prev.slice(-9), { timestamp, message, type }];
      if (onMessagesUpdate) {
        onMessagesUpdate(newMessages);
      }
      return newMessages;
    });
  };

  const checkPythonService = async () => {
    try {
      addMessage('Checking Python facial recognition service...', 'info');
      const response = await fetch('/api/facial-recognition/camera/status');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'available' || data.status === 'unavailable') {
        setServiceStatus('Running ✓');
        addMessage('✅ Python service is running!', 'success');
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      setServiceStatus('Not Running ✗');
      addMessage('❌ Python service error. Start with: python facial_recognition_service.py', 'error');
    }
  };

  const loadCameras = async () => {
    try {
      addMessage('Scanning for cameras...', 'info');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
        addMessage(`Found ${videoDevices.length} camera(s)`, 'success');
      } else {
        addMessage('No cameras found', 'error');
      }
    } catch (error) {
      addMessage(`Error loading cameras: ${error.message}`, 'error');
    }
  };

  const startCamera = async () => {
    try {
      addMessage('Starting camera...', 'info');

      const constraints = {
        video: {
          deviceId: { exact: selectedCamera },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready before setting cameraActive
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve);
          };
        });
      }

      cameraActiveRef.current = true; // Set ref immediately for interval callback
      setCameraActive(true); // Set state for UI

      // Notify parent that camera started
      if (onStatusChange) {
        onStatusChange({
          isActive: true,
          startTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        });
      }

      console.log('Camera active state set to TRUE');
      addMessage('Camera started successfully!', 'success');

      // Start processing frames (approx. 10 FPS) without overlapping requests
      frameIntervalRef.current = setInterval(processFrame, 100);

    } catch (error) {
      addMessage(`Error starting camera: ${error.message}`, 'error');
      console.error('Camera start error:', error);
    }
  };

  const stopCamera = async () => {
    // Record checkout time for all currently detected faces before clearing
    if (detectedFaces.length > 0) {
      const checkoutTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const finalAttendance = detectedFaces.map(face => ({
        name: face.name,
        confidence: face.confidence,
        detectedTime: face.detectedTime,
        checkOutTime: checkoutTime,
        status: face.is_confirmed ? 'Present' : 'Tentative',
        isConfirmed: face.is_confirmed
      }));

      onAttendanceUpdate(finalAttendance);
      addMessage(`Recorded checkout time: ${checkoutTime}`, 'info');
    }

    // Stop camera IMMEDIATELY (set ref first to stop processFrame)
    cameraActiveRef.current = false;

    // Stop interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Stop media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear detected faces state
    setDetectedFaces([]);

    // Clear the overlay canvas (wait a tiny bit for any in-flight draws to finish)
    setTimeout(() => {
      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext('2d');
        ctx.clearRect(0, 0, 640, 480);
        console.log('Canvas cleared');
      }
    }, 50);

    // Clear face trackers on the Python service
    try {
      await fetch('/api/facial-recognition/clear-trackers', { method: 'POST' });
      addMessage('Face trackers cleared', 'info');
    } catch (error) {
      console.error('Error clearing trackers:', error);
    }

    setCameraActive(false); // Set state for UI

    // Notify parent that camera stopped
    if (onStatusChange) {
      onStatusChange({
        isActive: false,
        stopTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      });
    }

    addMessage('Camera stopped', 'info');
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActiveRef.current || processingRef.current) {
      console.log('Frame processing skipped:', {
        hasVideo: !!videoRef.current,
        hasCanvas: !!canvasRef.current,
        cameraActive: cameraActiveRef.current
      });
      return;
    }

    try {
      processingRef.current = true;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log('Video not ready yet');
        return;
      }

      // Process every frame (backend handles detection/tracking logic)
      ctx.drawImage(video, 0, 0, 640, 480);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];

      console.log('Sending frame to Python service...');

      const response = await fetch('/api/facial-recognition/process-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: base64Data })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Python service response:', data);

      if (data.status === 'success') {
        const faces = data.detected_faces || [];
        setDetectedFaces(faces);
        
        // Update class engagement stats
        if (data.class_engagement) {
          setClassEngagement(data.class_engagement);
          // Notify parent component of engagement changes
          if (onEngagementUpdate) {
            onEngagementUpdate(data.class_engagement);
          }
        }
        
        // Update parent component with attendance data (including engagement)
        const now = new Date().toLocaleTimeString();
        const attendanceData = faces.map(face => ({
          name: face.name,
          confidence: face.confidence,
          detectedTime: now,
          checkOutTime: null,
          status: face.is_confirmed ? 'Present' : 'Tentative',
          isConfirmed: face.is_confirmed,
          // Engagement data
          engagementScore: face.engagement_score,
          engagementLevel: face.engagement_level,
          isSleeping: face.is_sleeping,
          isSpeaking: face.is_speaking,
          handRaised: face.hand_raised
        }));

        onAttendanceUpdate(attendanceData);
        drawBoundingBoxes(faces);
      }
    } catch (error) {
      console.error('Frame processing error:', error);
      addMessage(`Frame error: ${error.message}`, 'error');
    }
    finally {
      processingRef.current = false;
    }
  };

  // Helper function to get engagement color
  const getEngagementColor = (level) => {
    switch (level) {
      case 'engaged': return '#22c55e'; // Green
      case 'present': return '#f59e0b'; // Amber/Orange (attentive)
      case 'disengaged': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const drawBoundingBoxes = (faces) => {
    if (!overlayRef.current || !cameraActiveRef.current) return;

    const ctx = overlayRef.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);

    faces.forEach(face => {
      if (face.location) {
        const { top, right, bottom, left } = face.location;
        
        // Use engagement color for the bounding box
        const engagementColor = getEngagementColor(face.engagement_level);
        let borderColor = face.name !== 'Unknown' ? 
          (face.is_confirmed ? engagementColor : '#ffff00') : '#ff0000';
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = face.is_confirmed ? 3 : 2;
        ctx.strokeRect(left, top, right - left, bottom - top);
        
        // Draw name label at top
        const nameLabel = `${face.name}${face.confidence ? ` (${face.confidence.toFixed(2)})` : ''}`;
        ctx.font = '14px Arial';
        const nameLabelWidth = ctx.measureText(nameLabel).width;
        
        ctx.fillStyle = borderColor;
        ctx.fillRect(left, top - 20, nameLabelWidth + 10, 20);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(nameLabel, left + 5, top - 5);
        
        // Draw engagement indicator at bottom (only for confirmed faces)
        if (face.is_confirmed) {
          let engagementLabel;
          if (face.is_sleeping) {
            engagementLabel = 'Disengaged (Sleeping)';
          } else if (face.is_speaking && face.hand_raised) {
            engagementLabel = 'Engaged (Speaking + Hand)';
          } else if (face.is_speaking) {
            engagementLabel = 'Engaged (Speaking)';
          } else if (face.hand_raised) {
            engagementLabel = 'Engaged (Hand Raised)';
          } else {
            engagementLabel = 'Present';
          }
          
          ctx.font = '12px Arial';
          const engagementLabelWidth = ctx.measureText(engagementLabel).width;
          
          ctx.fillStyle = engagementColor;
          ctx.fillRect(left, bottom, engagementLabelWidth + 10, 18);
          
          ctx.fillStyle = '#fff';
          ctx.fillText(engagementLabel, left + 5, bottom + 13);
        }
      }
    });
  };

  return (
    <div className={styles.container}>
      <div>
        <Text weight="semibold">Python Service: </Text>
        <Badge color={serviceStatus.includes('✓') ? 'success' : 'danger'}>
          {serviceStatus}
        </Badge>
      </div>

      <div className={styles.controls}>
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          disabled={cameraActive}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
        >
          {cameras.length === 0 ? (
            <option value="">No cameras available</option>
          ) : (
            cameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
              </option>
            ))
          )}
        </select>

        <Button
          appearance="primary"
          onClick={startCamera}
          disabled={cameraActive || !selectedCamera}
        >
          Start Camera
        </Button>

        <Button
          onClick={stopCamera}
          disabled={!cameraActive}
        >
          Stop Camera
        </Button>

        <Button onClick={loadCameras} disabled={cameraActive}>
          Refresh Cameras
        </Button>
      </div>

      <div className={styles.videoContainer}>
        <video ref={videoRef} className={styles.video} style={{ display: cameraActive ? 'block' : 'none' }} />
        <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        <canvas ref={overlayRef} width="640" height="480" className={styles.overlay} />
        {!cameraActive && <Text>Camera not active</Text>}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div>
            <Text weight="semibold">Detected Faces: </Text>
            <Badge appearance="filled" color="brand">{detectedFaces.length}</Badge>
          </div>
          {detectedFaces.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text weight="semibold" size={200}>Class Engagement: </Text>
              <Badge 
                appearance="filled" 
                color={classEngagement.average_score >= 70 ? 'success' : classEngagement.average_score >= 40 ? 'warning' : 'danger'}
              >
                {classEngagement.average_score?.toFixed(0) || 0}%
              </Badge>
              <Text size={100} style={{ color: '#666' }}>
                ({classEngagement.engaged_count} engaged, {classEngagement.present_count} present, {classEngagement.disengaged_count} disengaged)
              </Text>
            </div>
          )}
        </div>
        
        <div className={styles.facesList}>
          {detectedFaces.length === 0 ? (
            <Text>No faces detected</Text>
          ) : (
            detectedFaces.map((face, index) => (
              <div key={index} className={styles.faceItem}>
                <div className={styles.faceItemContent}>
                  <div>
                    <Text weight="semibold">{face.name}</Text>
                    <Text size={200}> (Confidence: {face.confidence?.toFixed(3)})</Text>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                    {face.is_sleeping && <span>Disengaged (Sleeping)</span>}
                    {!face.is_sleeping && face.is_speaking && <span>Engaged (Speaking)</span>}
                    {!face.is_sleeping && face.hand_raised && <span>Engaged (Hand Raised)</span>}
                    {!face.is_sleeping && !face.is_speaking && !face.hand_raised && <span>Present</span>}
                  </div>
                </div>
                <div className={styles.badgeGroup}>
                  {/* Engagement Badge */}
                  <Badge 
                    appearance="filled"
                    color={
                      face.engagement_level === 'engaged' ? 'success' : 
                      face.engagement_level === 'present' ? 'warning' : 
                      'danger'
                    }
                    className={styles.engagementBadge}
                  >
                    {face.engagement_score?.toFixed(0) || 0}%
                  </Badge>
                  {/* Confirmation Badge */}
                  <Badge color={face.is_confirmed ? 'success' : 'warning'}>
                    {face.is_confirmed ? 'Confirmed' : 'Tentative'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FacialRecognition;
