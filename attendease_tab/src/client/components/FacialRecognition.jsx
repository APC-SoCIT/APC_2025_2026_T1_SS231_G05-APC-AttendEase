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
    marginTop: '0px'
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '1000px',
    height: '525px',
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
    width: '100%',
    height: '100%',
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

function FacialRecognition({ onAttendanceUpdate, onMessagesUpdate, onEngagementUpdate, onStatusChange }) {
  const styles = useStyles();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const cameraActiveRef = useRef(false); // Use ref instead of state to avoid closure issues
  const processingCanvasRef = useRef(null); // Separate canvas for downscaling high-res frames
  const cameraResolutionRef = useRef({ width: 1280, height: 720 }); // Actual camera resolution
  const processingDimsRef = useRef({ width: 1280, height: 720 }); // Dims used for processing canvas
  const isHighResRef = useRef(false); // Whether camera is providing high-res frames
  const jpegQualityRef = useRef(0.70); // Adaptive JPEG quality based on resolution
  const frameTraceCounterRef = useRef(0); // Lightweight live-feed trace counter

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
  const [handCount, setHandCount] = useState(0);

  const frameIntervalRef = useRef(null);

  useEffect(() => {
    checkPythonService();
    loadCameras();

    return () => {
      cameraActiveRef.current = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
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

      // Create fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/facial-recognition/camera/status', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Handle all possible status responses
      if (data.status === 'available' || data.status === 'unavailable') {
        setServiceStatus('Running ✓');
        addMessage('✅ Python service is running!', 'success');
      } else if (data.status === 'error') {
        setServiceStatus('Error ⚠');
        addMessage(`⚠️ Python service error: ${data.message || 'Unknown error'}`, 'error');
      } else {
        // Unknown status, but service responded
        setServiceStatus('Running ✓');
        addMessage('✅ Python service is running!', 'success');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setServiceStatus('Timeout ⏱');
        addMessage('Python service check timed out (may still be starting)', 'error');
        // Retry after 5 seconds
        setTimeout(() => checkPythonService(), 5000);
      } else {
        setServiceStatus('Not Running ✗');
        addMessage('❌ Python service error. Start with: python facial_recognition_service.py', 'error');
        // Retry after 10 seconds
        setTimeout(() => checkPythonService(), 10000);
      }
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

      // Request native 16:9 widescreen from the camera (e.g. Logitech MeetUp)
      const constraints = {
        video: {
          deviceId: { exact: selectedCamera },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 }
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

        // Detect actual camera resolution after video starts
        const actualWidth = videoRef.current.videoWidth;
        const actualHeight = videoRef.current.videoHeight;
        cameraResolutionRef.current = { width: actualWidth, height: actualHeight };
        // High-res = anything above the 1280x720 processing cap
        isHighResRef.current = actualWidth > 1280 || actualHeight > 720;

        // Compute processing dimensions: use camera native res capped at 1280x720
        const MAX_PROC_W = 1280;
        const MAX_PROC_H = 720;
        let procW = actualWidth;
        let procH = actualHeight;
        if (procW > MAX_PROC_W || procH > MAX_PROC_H) {
          const scale = Math.min(MAX_PROC_W / procW, MAX_PROC_H / procH);
          procW = Math.round(procW * scale);
          procH = Math.round(procH * scale);
        }
        processingDimsRef.current = { width: procW, height: procH };

        console.log(`Camera actual resolution: ${actualWidth}x${actualHeight} → processing: ${procW}x${procH}`);
        addMessage(`Camera resolution: ${actualWidth}x${actualHeight} → processing: ${procW}x${procH}`, 'info');

        // Set adaptive JPEG quality based on processing resolution
        if (procW > 960) {
          jpegQualityRef.current = 0.65;   // 1280x720 class
        } else {
          jpegQualityRef.current = 0.75;   // smaller frames
        }

        // Create processing canvas at the computed dimensions
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = procW;
        offscreenCanvas.height = procH;
        processingCanvasRef.current = offscreenCanvas;

        // Resize overlay + hidden canvas to match processing dims
        if (canvasRef.current) {
          canvasRef.current.width = procW;
          canvasRef.current.height = procH;
        }
        if (overlayRef.current) {
          overlayRef.current.width = procW;
          overlayRef.current.height = procH;
        }
      }

      frameTraceCounterRef.current = 0;

      cameraActiveRef.current = true;
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

      // Start sequential frame processing loop
      // Send a frame, wait for response, then immediately send the next.
      // This naturally adapts to Python's speed -- no timers or watchdogs needed.
      const loop = async () => {
        if (!cameraActiveRef.current) return;
        await processFrame();
        if (cameraActiveRef.current) {
          requestAnimationFrame(loop);
        }
      };
      requestAnimationFrame(loop);

    } catch (error) {
      addMessage(`Error starting camera: ${error.message}`, 'error');
      console.error('Camera start error:', error);
    }
  };

  const stopCamera = async () => {
    // Stop the sequential loop by flipping the ref immediately
    cameraActiveRef.current = false;

    // Reset processing state
    processingCanvasRef.current = null;
    isHighResRef.current = false;
    jpegQualityRef.current = 0.70;
    cameraResolutionRef.current = { width: 1280, height: 720 };
    processingDimsRef.current = { width: 1280, height: 720 };

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
    setHandCount(0);

    // Clear the overlay canvas (wait a tiny bit for any in-flight draws to finish)
    setTimeout(() => {
      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext('2d');
        ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
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
    if (!videoRef.current || !canvasRef.current || !cameraActiveRef.current) {
      return; // Skip silently if not ready
    }

    try {
      processingRef.current = true;
      processingStartTimeRef.current = Date.now();

      // Set watchdog timer to reset if processing takes too long
      watchdogTimerRef.current = setTimeout(() => {
        if (processingRef.current) {
          console.warn('Processing timeout: forcing reset after 5 seconds');
          processingRef.current = false;
          processingStartTimeRef.current = 0;
        }
      }, 5000);

      const video = videoRef.current;
      const ctx = canvasRef.current.getContext('2d');

      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Draw to processing canvas (dynamic resolution, capped at 1280x720)
      let encodeCanvas;
      if (processingCanvasRef.current) {
        const procCanvas = processingCanvasRef.current;
        const procCtx = procCanvas.getContext('2d');
        procCtx.imageSmoothingEnabled = true;
        procCtx.imageSmoothingQuality = 'high';
        procCtx.drawImage(video, 0, 0, procCanvas.width, procCanvas.height);
        encodeCanvas = procCanvas;
      } else {
        // Fallback: draw to the hidden canvas
        ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
        encodeCanvas = canvasRef.current;
      }

      // Encode with JPEG quality
      const imageData = encodeCanvas.toDataURL('image/jpeg', jpegQualityRef.current);
      const base64Data = imageData.split(',')[1];
      frameTraceCounterRef.current += 1;
      const frameTraceId = frameTraceCounterRef.current;
      const shouldTraceFrame = frameTraceId <= 5 || frameTraceId % 30 === 0;
      if (shouldTraceFrame) {
        console.log(
          `[FrameTrace][Frontend] send #${frameTraceId} payload=${base64Data.length}`
        );
      }

      // Create fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const startTime = Date.now();
      const response = await fetch('/api/facial-recognition/process-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: base64Data }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const processingTime = Date.now() - startTime;
      if (shouldTraceFrame) {
        console.log(`[FrameTrace][Frontend] round-trip ${processingTime}ms`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (shouldTraceFrame) {
        const faces = Array.isArray(data?.detected_faces) ? data.detected_faces.length : (data?.total_faces || 0);
        console.log(
          `[FrameTrace][Frontend] recv #${frameTraceId} status=${data?.status} faces=${faces} hand_count=${data?.hand_count ?? 'n/a'}`
        );
      }

      if (data.status === 'success') {
        const faces = data.detected_faces || [];
        const currentHandCount = Number.isFinite(data.hand_count) ? data.hand_count : 0;
        setDetectedFaces(faces);
        setHandCount(currentHandCount);

        // Update class engagement stats
        if (data.class_engagement) {
          setClassEngagement(data.class_engagement);
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
      if (error.name === 'AbortError') {
        console.error('Frame processing timeout');
        addMessage('Frame processing timeout - backend may be overloaded', 'error');
      } else {
        console.error('Frame processing error:', error);
        addMessage(`Frame error: ${error.message}`, 'error');
      }
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

  // Pick black or white text based on background luminance
  const getTextColorForBg = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    // Perceived luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  };

  const drawBoundingBoxes = (faces) => {
    if (!overlayRef.current || !cameraActiveRef.current) return;

    const ctx = overlayRef.current.getContext('2d');
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

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

        // Draw engagement indicator at bottom (for all detected faces)
        let engagementLabel;
        if (face.is_sleeping) {
          engagementLabel = 'Disengaged (Sleeping)';
        } else if (face.is_speaking && face.hand_raised) {
          engagementLabel = 'Engaged (Speaking + Hand)';
        } else if (face.is_speaking) {
          engagementLabel = 'Engaged (Speaking)';
        } else if (face.hand_raised) {
          engagementLabel = 'Engaged (Hand Raised)';
        } else if (face.raw_hand_detected) {
          engagementLabel = 'Present (Hand Candidate)';
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
        <canvas ref={canvasRef} width="1280" height="720" style={{ display: 'none' }} />
        <canvas ref={overlayRef} width="1280" height="720" className={styles.overlay} />
        {!cameraActive && <Text>Camera not active</Text>}
      </div>
    </div>
  );
}

export default FacialRecognition;
