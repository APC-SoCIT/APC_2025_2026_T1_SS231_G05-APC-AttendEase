// Facial Recognition Interface for Professor Dashboard

let cameraActive = false;
let frameUpdateInterval = null;
let statusCheckInterval = null;

// DOM Elements
let startCameraBtn, stopCameraBtn, refreshStatusBtn, refreshCamerasBtn;
let statusText, videoFrame, faceCount, facesList, messagesDiv, cameraSelect;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
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
}

function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    refreshStatusBtn.addEventListener('click', checkCameraStatus);
    refreshCamerasBtn.addEventListener('click', loadAvailableCameras);
    
    // Enable/disable start button based on camera selection
    cameraSelect.addEventListener('change', function() {
        startCameraBtn.disabled = cameraSelect.value === '';
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

async function loadAvailableCameras() {
    try {
        statusText.textContent = 'Loading cameras...';
        addMessage('Scanning for available cameras...', 'info');
        
        const response = await fetch('/api/facial-recognition/camera/list');
        const data = await response.json();
        
        // Clear existing options
        cameraSelect.innerHTML = '';
        
        if (data.status === 'success' && data.cameras && data.cameras.length > 0) {
            // Add cameras to dropdown
            data.cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.index;
                option.textContent = `${camera.name} (Index ${camera.index})`;
                cameraSelect.appendChild(option);
            });
            
            // Select first camera by default
            cameraSelect.selectedIndex = 0;
            startCameraBtn.disabled = false;
            
            statusText.textContent = `${data.cameras.length} camera(s) found`;
            statusText.style.color = '#388e3c';
            addMessage(`Found ${data.cameras.length} camera(s): ${data.cameras.map(c => c.name).join(', ')}`, 'success');
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
        addMessage(`Error loading cameras: ${error.message}`, 'error');
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
        const selectedCameraIndex = parseInt(cameraSelect.value);
        if (isNaN(selectedCameraIndex)) {
            addMessage('Please select a camera first.', 'warning');
            return;
        }
        
        addMessage(`Starting camera ${selectedCameraIndex}...`, 'info');
        startCameraBtn.disabled = true;
        
        const response = await fetch('/api/facial-recognition/camera/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                camera_index: selectedCameraIndex
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'started' || data.status === 'already_running') {
            cameraActive = true;
            startCameraBtn.disabled = true;
            stopCameraBtn.disabled = false;
            cameraSelect.disabled = true; // Disable camera selection while active
            statusText.textContent = `Active (Camera ${selectedCameraIndex})`;
            statusText.style.color = '#388e3c';
            addMessage(`Camera ${selectedCameraIndex} started successfully!`, 'success');
            
            // Start frame updates
            startFrameUpdates();
        } else {
            startCameraBtn.disabled = false;
            addMessage(`Failed to start camera: ${data.message}`, 'error');
        }
    } catch (error) {
        startCameraBtn.disabled = false;
        addMessage(`Error starting camera: ${error.message}`, 'error');
    }
}

async function stopCamera() {
    try {
        addMessage('Stopping camera...', 'info');
        stopCameraBtn.disabled = true;
        
        // Stop frame updates
        stopFrameUpdates();
        
        const response = await fetch('/api/facial-recognition/camera/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        cameraActive = false;
        startCameraBtn.disabled = cameraSelect.value === ''; // Enable only if camera is selected
        stopCameraBtn.disabled = true;
        cameraSelect.disabled = false; // Re-enable camera selection
        statusText.textContent = 'Stopped';
        statusText.style.color = '#1976d2';
        
        // Clear video frame
        videoFrame.innerHTML = '<p>Camera not active</p>';
        faceCount.textContent = '0';
        facesList.innerHTML = '';
        
        addMessage('Camera stopped successfully.', 'success');
    } catch (error) {
        stopCameraBtn.disabled = false;
        addMessage(`Error stopping camera: ${error.message}`, 'error');
    }
}

function startFrameUpdates() {
    if (frameUpdateInterval) {
        clearInterval(frameUpdateInterval);
    }
    
    // Update frames every 500ms for smooth experience
    frameUpdateInterval = setInterval(updateFrame, 500);
}

function stopFrameUpdates() {
    if (frameUpdateInterval) {
        clearInterval(frameUpdateInterval);
        frameUpdateInterval = null;
    }
}

async function updateFrame() {
    if (!cameraActive) {
        return;
    }
    
    try {
        const response = await fetch('/api/facial-recognition/camera/frame');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Update video frame
            videoFrame.innerHTML = `<img src="data:image/jpeg;base64,${data.frame}" style="width: 100%; height: 100%; object-fit: contain;" />`;
            
            // Update face count
            faceCount.textContent = data.total_faces;
            
            // Update faces list
            updateFacesList(data.detected_faces);
            
        } else {
            addMessage(`Frame update error: ${data.message}`, 'error');
        }
    } catch (error) {
        addMessage(`Error updating frame: ${error.message}`, 'error');
    }
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
        stopCamera();
    }
});
