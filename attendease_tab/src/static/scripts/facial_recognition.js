// Facial Recognition Interface for Professor Dashboard

let cameraActive = false;
let frameUpdateInterval = null;
let statusCheckInterval = null;
let mediaStream = null;

// DOM Elements
let startCameraBtn, stopCameraBtn, refreshStatusBtn, refreshCamerasBtn;
let statusText, videoFrame, faceCount, facesList, messagesDiv, cameraSelect;
let cameraVideo, processedCanvas, videoPlaceholder;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    checkPythonService();
    loadAvailableCameras();
});

function initializeElements() {
    startCameraBtn = document.getElementById('startCameraBtn');
    stopCameraBtn = document.getElementById('stopCameraBtn');
    refreshStatusBtn = document.getElementById('refreshStatusBtn');
    refreshCamerasBtn = document.getElementById('refreshCamerasBtn');
    statusText = document.getElementById('statusText');
    videoFrame = document.getElementById('videoFrame');
    faceCount = document.getElementById('faceCount');
    facesList = document.getElementById('facesList');
    messagesDiv = document.getElementById('messages');
    cameraSelect = document.getElementById('cameraSelect');
    cameraVideo = document.getElementById('cameraVideo');
    processedCanvas = document.getElementById('processedCanvas');
    videoPlaceholder = document.getElementById('videoPlaceholder');
}

function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    refreshStatusBtn.addEventListener('click', checkCameraStatus);
    refreshCamerasBtn.addEventListener('click', loadAvailableCameras);
    
    // Enable/disable start button based on camera selection
    cameraSelect.addEventListener('change', function() {
        const hasValidSelection = cameraSelect.value && cameraSelect.value !== '';
        startCameraBtn.disabled = !hasValidSelection;
        
        // Debug logging
        console.log('Camera selection changed:', cameraSelect.value);
        console.log('Start button disabled:', startCameraBtn.disabled);
    });
}

function addMessage(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    
    // Color coding for different message types
    switch(type) {
        case 'error':
            messageElement.style.color = '#d32f2f';
            break;
        case 'success':
            messageElement.style.color = '#388e3c';
            break;
        case 'warning':
            messageElement.style.color = '#f57c00';
            break;
        default:
            messageElement.style.color = '#1976d2';
    }
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Keep only last 10 messages
    while (messagesDiv.children.length > 10) {
        messagesDiv.removeChild(messagesDiv.firstChild);
    }
}

async function checkPythonService() {
    try {
        addMessage('Checking Python facial recognition service...', 'info');
        
        const response = await fetch('/api/facial-recognition/camera/status');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        addMessage('✅ Python facial recognition service is running!', 'success');
        console.log('Python service status:', data);
        
    } catch (error) {
        addMessage(`❌ Python service error: ${error.message}`, 'error');
        addMessage('Make sure to start the Python service with: python facial_recognition_service.py', 'warning');
        console.error('Python service check failed:', error);
    }
}

async function loadAvailableCameras() {
    try {
        statusText.textContent = 'Loading cameras...';
        addMessage('Scanning for available cameras...', 'info');
        
        // Check if browser supports camera access
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported in this browser');
        }
        
        // Clear existing options
        cameraSelect.innerHTML = '';
        
        // First, request camera permission to get device labels
        let permissionGranted = false;
        try {
            addMessage('Requesting camera permissions to detect camera names...', 'info');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
            permissionGranted = true;
            addMessage('Camera permissions granted!', 'success');
        } catch (permError) {
            addMessage('Camera permission denied - will show generic camera names.', 'warning');
            // Continue anyway, but labels won't be available
        }
        
        // Now get list of available media devices (with labels if permission granted)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
            // Add cameras to dropdown with proper names
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                
                // Use actual device label if available, otherwise create descriptive name
                let displayName;
                if (device.label && device.label.trim() !== '') {
                    displayName = device.label;
                } else {
                    displayName = `Camera ${index + 1} (ID: ${device.deviceId.substring(0, 8)}...)`;
                }
                
                option.textContent = displayName;
                cameraSelect.appendChild(option);
            });
            
            // Select first camera by default
            if (cameraSelect.options.length > 0) {
                cameraSelect.selectedIndex = 0;
                startCameraBtn.disabled = false;
                
                // Debug logging
                console.log('First camera selected:', cameraSelect.value);
                console.log('Start button enabled:', !startCameraBtn.disabled);
            }
            
            statusText.textContent = `${videoDevices.length} camera(s) found`;
            statusText.style.color = '#388e3c';
            
            const cameraNames = videoDevices.map((device, index) => 
                device.label && device.label.trim() !== '' ? device.label : `Camera ${index + 1}`
            );
            addMessage(`Found ${videoDevices.length} camera(s): ${cameraNames.join(', ')}`, 'success');
            
        } else {
            // No cameras found
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No cameras available';
            cameraSelect.appendChild(option);
            
            startCameraBtn.disabled = true;
            statusText.textContent = 'No cameras detected';
            statusText.style.color = '#d32f2f';
            addMessage('No cameras detected. Please check your camera connections and permissions.', 'error');
        }
    } catch (error) {
        statusText.textContent = 'Error loading cameras';
        statusText.style.color = '#d32f2f';
        startCameraBtn.disabled = true;
        
        if (error.name === 'NotAllowedError') {
            addMessage('Camera access denied. Please allow camera permissions and refresh the page.', 'error');
        } else if (error.name === 'NotFoundError') {
            addMessage('No cameras found. Please check your camera connections.', 'error');
        } else {
            addMessage(`Error loading cameras: ${error.message}`, 'error');
        }
    }
}

async function checkCameraStatus() {
    try {
        statusText.textContent = 'Checking...';
        const response = await fetch('/api/facial-recognition/camera/status');
        const data = await response.json();
        
        if (data.status === 'available') {
            statusText.textContent = 'Available';
            statusText.style.color = '#388e3c';
            startCameraBtn.disabled = false;
            addMessage('Camera is available and ready to use.', 'success');
        } else {
            statusText.textContent = 'Not Available';
            statusText.style.color = '#d32f2f';
            startCameraBtn.disabled = true;
            addMessage(`Camera not available: ${data.message}`, 'error');
        }
    } catch (error) {
        statusText.textContent = 'Error';
        statusText.style.color = '#d32f2f';
        startCameraBtn.disabled = true;
        addMessage(`Error checking camera status: ${error.message}`, 'error');
    }
}

async function startCamera() {
    try {
        const selectedDeviceId = cameraSelect.value;
        
        // Debug logging
        console.log('Selected device ID:', selectedDeviceId);
        console.log('Camera select value:', cameraSelect.value);
        console.log('Camera select options:', cameraSelect.options);
        
        if (!selectedDeviceId || selectedDeviceId === '') {
            addMessage('Please select a camera first.', 'warning');
            addMessage(`Debug: Selected value is "${selectedDeviceId}"`, 'warning');
            return;
        }
        
        const selectedOption = cameraSelect.options[cameraSelect.selectedIndex];
        const cameraName = selectedOption ? selectedOption.textContent : 'Unknown Camera';
        
        addMessage(`Starting ${cameraName}...`, 'info');
        startCameraBtn.disabled = true;
        
        // Request camera access from browser
        const constraints = {
            video: {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30 }
            }
        };
        
        addMessage(`Requesting access to camera with device ID: ${selectedDeviceId.substring(0, 20)}...`, 'info');
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraVideo.srcObject = mediaStream;
        
        // Wait for video to load
        await new Promise((resolve) => {
            cameraVideo.onloadedmetadata = resolve;
        });
        
        await cameraVideo.play();
        
        // Hide placeholder and show video
        videoPlaceholder.style.display = 'none';
        cameraVideo.style.display = 'block';
        
        cameraActive = true;
        startCameraBtn.disabled = true;
        stopCameraBtn.disabled = false;
        cameraSelect.disabled = true;
        statusText.textContent = `Active (${cameraName})`;
        statusText.style.color = '#388e3c';
        addMessage(`${cameraName} started successfully!`, 'success');
        
        // Start processing frames
        startFrameProcessing();
        
    } catch (error) {
        startCameraBtn.disabled = false;
        
        if (error.name === 'NotAllowedError') {
            addMessage('Camera access denied. Please allow camera permissions and try again.', 'error');
        } else if (error.name === 'NotFoundError') {
            addMessage('Selected camera not found. Please refresh and try a different camera.', 'error');
        } else if (error.name === 'NotReadableError') {
            addMessage('Camera is being used by another application. Please close other apps and try again.', 'error');
        } else {
            addMessage(`Error starting camera: ${error.message}`, 'error');
        }
    }
}

async function stopCamera() {
    try {
        addMessage('Stopping camera...', 'info');
        stopCameraBtn.disabled = true;
        
        // Stop frame processing
        stopFrameProcessing();
        
        // Stop media stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        // Hide video and show placeholder
        cameraVideo.style.display = 'none';
        videoPlaceholder.style.display = 'block';
        videoPlaceholder.textContent = 'Camera not active';
        
        // Clear face overlay
        const overlayCanvas = document.getElementById('faceOverlay');
        if (overlayCanvas) {
            overlayCanvas.remove();
        }
        
        cameraActive = false;
        startCameraBtn.disabled = cameraSelect.value === '';
        stopCameraBtn.disabled = true;
        cameraSelect.disabled = false;
        statusText.textContent = 'Stopped';
        statusText.style.color = '#1976d2';
        
        // Clear face detection data
        faceCount.textContent = '0';
        facesList.innerHTML = '';
        
        addMessage('Camera stopped successfully.', 'success');
    } catch (error) {
        stopCameraBtn.disabled = false;
        addMessage(`Error stopping camera: ${error.message}`, 'error');
    }
}

function startFrameProcessing() {
    if (frameUpdateInterval) {
        clearInterval(frameUpdateInterval);
    }
    
    // Process frames every 1000ms (1 second) for face recognition
    frameUpdateInterval = setInterval(processCurrentFrame, 1000);
}

function stopFrameProcessing() {
    if (frameUpdateInterval) {
        clearInterval(frameUpdateInterval);
        frameUpdateInterval = null;
    }
}

async function processCurrentFrame() {
    if (!cameraActive || !cameraVideo || cameraVideo.paused) {
        return;
    }
    
    try {
        // Capture current frame from video
        const canvas = processedCanvas;
        const ctx = canvas.getContext('2d');
        
        // Draw current video frame to canvas
        ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = imageData.split(',')[1];
        
        // Debug: Log that we're processing a frame
        console.log('Processing frame...');
        
        // Send frame to Python service for face recognition
        const response = await fetch('/api/facial-recognition/process-frame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frame: base64Data
            })
        });
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Face recognition response:', data);
        
        if (data.status === 'success') {
            // Update face count
            faceCount.textContent = data.total_faces || 0;
            
            // Update faces list
            updateFacesList(data.detected_faces || []);
            
            // Draw bounding boxes on the video
            drawFaceBoundingBoxes(data.detected_faces || []);
            
            // Add feedback message if faces detected
            if (data.total_faces > 0) {
                addMessage(`Detected ${data.total_faces} face(s)`, 'info');
            }
        } else {
            console.warn('Frame processing failed:', data.message);
            addMessage(`Face processing: ${data.message}`, 'warning');
        }
    } catch (error) {
        console.error('Error processing frame:', error.message);
        addMessage(`Frame processing error: ${error.message}`, 'error');
    }
}

function drawFaceBoundingBoxes(faces) {
    // Create or get overlay canvas for drawing bounding boxes
    let overlayCanvas = document.getElementById('faceOverlay');
    if (!overlayCanvas) {
        overlayCanvas = document.createElement('canvas');
        overlayCanvas.id = 'faceOverlay';
        overlayCanvas.width = 640;
        overlayCanvas.height = 480;
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.style.top = '0';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.pointerEvents = 'none';
        overlayCanvas.style.zIndex = '10';
        
        // Add overlay to video container
        const videoFrame = document.getElementById('videoFrame');
        videoFrame.style.position = 'relative';
        videoFrame.appendChild(overlayCanvas);
    }
    
    const ctx = overlayCanvas.getContext('2d');
    
    // Clear previous drawings
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Draw bounding boxes for each detected face
    faces.forEach(face => {
        if (face.location) {
            const { top, right, bottom, left } = face.location;
            
            // Choose color based on recognition status
            let color = '#ff0000'; // Red for unknown
            let thickness = 2;
            
            if (face.name !== 'Unknown') {
                if (face.is_confirmed) {
                    color = '#00ff00'; // Green for confirmed
                    thickness = 3;
                } else {
                    color = '#ffff00'; // Yellow for tentative
                    thickness = 2;
                }
            }
            
            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.strokeRect(left, top, right - left, bottom - top);
            
            // Draw label background
            const label = face.name + (face.confidence ? ` (${face.confidence.toFixed(2)})` : '');
            ctx.font = '16px Arial';
            const textWidth = ctx.measureText(label).width;
            const textHeight = 20;
            
            ctx.fillStyle = color;
            ctx.fillRect(left, top - textHeight, textWidth + 10, textHeight);
            
            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.fillText(label, left + 5, top - 5);
        }
    });
}

function updateFacesList(faces) {
    facesList.innerHTML = '';
    
    if (faces.length === 0) {
        facesList.innerHTML = '<p>No faces detected</p>';
        return;
    }
    
    faces.forEach(face => {
        const faceDiv = document.createElement('div');
        faceDiv.style.marginBottom = '10px';
        faceDiv.style.padding = '5px';
        faceDiv.style.border = '1px solid #ddd';
        faceDiv.style.borderRadius = '3px';
        
        let statusColor = '#666';
        let statusText = 'Unknown';
        
        if (face.name !== 'Unknown') {
            if (face.is_confirmed) {
                statusColor = '#388e3c';
                statusText = 'Confirmed';
            } else {
                statusColor = '#f57c00';
                statusText = 'Tentative';
            }
        } else {
            statusColor = '#d32f2f';
            statusText = 'Unknown';
        }
        
        faceDiv.innerHTML = `
            <strong>Face ID:</strong> ${face.id}<br>
            <strong>Name:</strong> ${face.name}<br>
            <strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span><br>
            <strong>Confidence:</strong> ${face.confidence.toFixed(3)}
        `;
        
        facesList.appendChild(faceDiv);
    });
}

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (cameraActive) {
        stopFrameProcessing();
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
    }
});
