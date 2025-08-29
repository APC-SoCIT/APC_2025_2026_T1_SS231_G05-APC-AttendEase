// Facial Recognition Interface for Professor Dashboard

let cameraActive = false;
let frameUpdateInterval = null;
let statusCheckInterval = null;

// DOM Elements
let startCameraBtn, stopCameraBtn, refreshStatusBtn;
let statusText, videoFrame, faceCount, facesList, messagesDiv;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    checkCameraStatus();
    setupEventListeners();
});

function initializeElements() {
    startCameraBtn = document.getElementById('startCameraBtn');
    stopCameraBtn = document.getElementById('stopCameraBtn');
    refreshStatusBtn = document.getElementById('refreshStatusBtn');
    statusText = document.getElementById('statusText');
    videoFrame = document.getElementById('videoFrame');
    faceCount = document.getElementById('faceCount');
    facesList = document.getElementById('facesList');
    messagesDiv = document.getElementById('messages');
}

function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    refreshStatusBtn.addEventListener('click', checkCameraStatus);
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
        addMessage('Starting camera...', 'info');
        startCameraBtn.disabled = true;
        
        const response = await fetch('/api/facial-recognition/camera/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'started' || data.status === 'already_running') {
            cameraActive = true;
            startCameraBtn.disabled = true;
            stopCameraBtn.disabled = false;
            statusText.textContent = 'Active';
            statusText.style.color = '#388e3c';
            addMessage('Camera started successfully!', 'success');
            
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
        startCameraBtn.disabled = false;
        stopCameraBtn.disabled = true;
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
