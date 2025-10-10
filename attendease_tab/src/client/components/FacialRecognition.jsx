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
  }
});

function FacialRecognition({ onAttendanceUpdate }) {
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
    setMessages(prev => [...prev.slice(-9), { timestamp, message, type }]);
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
      
      // Set camera active AFTER video is ready (both state and ref)
      cameraActiveRef.current = true; // Set ref immediately for interval callback
      setCameraActive(true); // Set state for UI
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
    
    // Clear detected faces state first
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
        
        // Update parent component with attendance data
        const attendanceData = faces
          .filter(face => face.name !== 'Unknown' && face.is_confirmed)
          .map(face => ({
            name: face.name,
            confidence: face.confidence,
            detectedTime: new Date().toLocaleTimeString(),
            status: 'Present'
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

  const drawBoundingBoxes = (faces) => {
    if (!overlayRef.current || !cameraActiveRef.current) return;
    
    const ctx = overlayRef.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);
    
    faces.forEach(face => {
      if (face.location) {
        const { top, right, bottom, left } = face.location;
        
        let color = face.name !== 'Unknown' ? 
          (face.is_confirmed ? '#00ff00' : '#ffff00') : '#ff0000';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = face.is_confirmed ? 3 : 2;
        ctx.strokeRect(left, top, right - left, bottom - top);
        
        const label = `${face.name}${face.confidence ? ` (${face.confidence.toFixed(2)})` : ''}`;
        ctx.font = '16px Arial';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = color;
        ctx.fillRect(left, top - 20, textWidth + 10, 20);
        
        ctx.fillStyle = '#000';
        ctx.fillText(label, left + 5, top - 5);
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
        <Text weight="semibold">Detected Faces: </Text>
        <Badge appearance="filled" color="brand">{detectedFaces.length}</Badge>
        
        <div className={styles.facesList}>
          {detectedFaces.length === 0 ? (
            <Text>No faces detected</Text>
          ) : (
            detectedFaces.map((face, index) => (
              <div key={index} className={styles.faceItem}>
                <div>
                  <Text weight="semibold">{face.name}</Text>
                  <Text size={200}> (Confidence: {face.confidence?.toFixed(3)})</Text>
                </div>
                <Badge color={face.is_confirmed ? 'success' : 'warning'}>
                  {face.is_confirmed ? 'Confirmed' : 'Tentative'}
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

export default FacialRecognition;
