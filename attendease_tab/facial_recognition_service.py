import face_recognition
import cv2
import numpy as np
import base64
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import os
import sys

app = Flask(__name__)
CORS(app)

# Global variables
video_capture = None
camera_on = False
known_face_encodings = []
known_face_names = []
face_tracker = {}
next_face_id = 0

# Configuration
TRACKING_THRESHOLD = 0.5
TRACKING_FRAMES = 100
FACE_DISTANCE_THRESHOLD = 100
frame_count = 0

class FaceTracker:
    def __init__(self, face_id, name, location, encoding=None):
        self.id = face_id
        self.name = name
        self.location = location
        self.encoding = encoding
        self.last_seen = time.time()
        self.confidence_history = []
        self.missed_frames = 0
        self.is_confirmed = False
        
    def update_location(self, new_location, confidence=None):
        self.location = new_location
        self.last_seen = time.time()
        self.missed_frames = 0
        if confidence is not None:
            self.confidence_history.append(confidence)
            if len(self.confidence_history) > 5:
                self.confidence_history.pop(0)
            if len(self.confidence_history) >= 3 and all(c > 0.4 for c in self.confidence_history):
                self.is_confirmed = True
    
    def increment_missed_frames(self):
        self.missed_frames += 1
        
    def is_expired(self):
        return self.missed_frames > TRACKING_FRAMES

def load_reference_data():
    """Load reference images and extract face encodings."""
    global known_face_encodings, known_face_names
    
    known_face_encodings = []
    known_face_names = []
    
    # Get the path to the photos directory (now local to this folder)
    photos_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
    
    reference_people = [
        ("Christian Esguerra", os.path.join(photos_dir, "christian_esguerra.jpg")),
        ("Moises Sy", os.path.join(photos_dir, "moises_sy.jpg")),
        ("Maria Sophea Balidio", os.path.join(photos_dir, "maria_sophea_balidio.jpg")),
        ("Suzanne Rosco", os.path.join(photos_dir, "suzanne_rosco.jpg"))
    ]
    
    print("📸 Loading reference images...")
    print(f"   Photos directory: {photos_dir}")
    print(f"   Directory exists: {os.path.exists(photos_dir)}")
    
    for name, path in reference_people:
        print(f"   - Loading {name} from {path}...")
        print(f"     Full path: {os.path.abspath(path)}")
        print(f"     File exists: {os.path.exists(path)}")
        
        try:
            if os.path.exists(path):
                image = face_recognition.load_image_file(path)
                face_encodings_list = face_recognition.face_encodings(image)
                
                if face_encodings_list:
                    encoding = face_encodings_list[0]
                    known_face_encodings.append(encoding)
                    known_face_names.append(name)
                    print(f"     ✓ Face encoding extracted for {name}.")
                else:
                    print(f"     ⚠️ Warning: No faces found in {path}. The image might not contain a clear face.")
            else:
                print(f"     ❌ Error: Reference image not found at '{path}'.")
                # List what files are actually in the photos directory
                if os.path.exists(photos_dir):
                    files = os.listdir(photos_dir)
                    print(f"     Available files in {photos_dir}: {files}")
        except Exception as e:
            print(f"     ❌ Error processing {path}: {e}")
    
    print(f"✅ Loaded {len(known_face_encodings)} face encodings: {', '.join(known_face_names)}")
    
    if len(known_face_encodings) == 0:
        print("⚠️ Warning: No face encodings loaded. Face recognition will only detect unknown faces.")
    
    return True  # Return True even if no encodings to allow detection of unknown faces

def calculate_distance(loc1, loc2):
    """Calculate Euclidean distance between two face locations."""
    center1 = ((loc1[1] + loc1[3]) // 2, (loc1[0] + loc1[2]) // 2)
    center2 = ((loc2[1] + loc2[3]) // 2, (loc2[0] + loc2[2]) // 2)
    return np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)

def match_faces_to_trackers(face_locations, face_encodings):
    """Match detected faces to existing trackers or create new ones."""
    global face_tracker, next_face_id, known_face_encodings, known_face_names
    
    scaled_locations = []
    for (top, right, bottom, left) in face_locations:
        scaled_locations.append((top * 4, right * 4, bottom * 4, left * 4))
    
    matched_trackers = set()
    new_detections = []
    
    for i, location in enumerate(scaled_locations):
        best_tracker = None
        min_distance = float('inf')
        
        for tracker_id, tracker in face_tracker.items():
            if tracker_id in matched_trackers:
                continue
            distance = calculate_distance(location, tracker.location)
            if distance < FACE_DISTANCE_THRESHOLD and distance < min_distance:
                min_distance = distance
                best_tracker = tracker_id
        
        if best_tracker is not None:
            name = "Unknown"
            confidence = None
            
            if i < len(face_encodings) and known_face_encodings:
                matches = face_recognition.compare_faces(known_face_encodings, face_encodings[i], tolerance=TRACKING_THRESHOLD)
                face_distances = face_recognition.face_distance(known_face_encodings, face_encodings[i])
                
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = known_face_names[best_match_index]
                        confidence = 1 - face_distances[best_match_index]
            
            face_tracker[best_tracker].update_location(location, confidence)
            face_tracker[best_tracker].name = name
            matched_trackers.add(best_tracker)
        else:
            new_detections.append((location, face_encodings[i] if i < len(face_encodings) else None))
    
    for location, encoding in new_detections:
        name = "Unknown"
        confidence = None
        
        if encoding is not None and known_face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, encoding, tolerance=TRACKING_THRESHOLD)
            face_distances = face_recognition.face_distance(known_face_encodings, encoding)
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_face_names[best_match_index]
                    confidence = 1 - face_distances[best_match_index]
        
        tracker = FaceTracker(next_face_id, name, location, encoding)
        if confidence is not None:
            tracker.update_location(location, confidence)
        face_tracker[next_face_id] = tracker
        next_face_id += 1
    
    for tracker_id in list(face_tracker.keys()):
        if tracker_id not in matched_trackers:
            face_tracker[tracker_id].increment_missed_frames()
            if face_tracker[tracker_id].is_expired():
                del face_tracker[tracker_id]

@app.route('/api/camera/list', methods=['GET'])
def list_cameras():
    """List all available cameras."""
    available_cameras = []
    
    # Test up to 10 camera indices
    for i in range(10):
        try:
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                # Try to read a frame to confirm the camera is working
                ret, frame = cap.read()
                if ret:
                    available_cameras.append({
                        "index": i,
                        "name": f"Camera {i}",
                        "description": f"Camera device at index {i}"
                    })
                cap.release()
        except Exception:
            continue
    
    return jsonify({
        "status": "success" if available_cameras else "no_cameras",
        "cameras": available_cameras,
        "message": f"Found {len(available_cameras)} camera(s)" if available_cameras else "No cameras detected"
    })

@app.route('/api/camera/status', methods=['GET'])
def camera_status():
    """Check if camera is available."""
    try:
        # Check if any camera is available
        list_result = list_cameras()
        data = list_result.get_json()
        
        if data["cameras"]:
            return jsonify({"status": "available", "message": f"Found {len(data['cameras'])} camera(s)"})
        else:
            return jsonify({"status": "unavailable", "message": "No cameras detected"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    """Start camera for facial recognition."""
    global video_capture, camera_on, face_tracker
    
    if camera_on:
        return jsonify({"status": "already_running", "message": "Camera is already active"})
    
    try:
        # Get camera index from request body, default to 0
        data = request.get_json() or {}
        camera_index = data.get('camera_index', 0)
        
        print(f"Attempting to start camera at index {camera_index}")
        
        video_capture = cv2.VideoCapture(camera_index)
        if video_capture.isOpened():
            # Test if we can actually read a frame
            ret, frame = video_capture.read()
            if ret:
                video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                video_capture.set(cv2.CAP_PROP_FPS, 30)
                camera_on = True
                face_tracker.clear()
                return jsonify({
                    "status": "started", 
                    "message": f"Camera {camera_index} started successfully",
                    "camera_index": camera_index
                })
            else:
                video_capture.release()
                return jsonify({"status": "error", "message": f"Camera {camera_index} detected but cannot read frames"})
        else:
            return jsonify({"status": "error", "message": f"Could not access camera at index {camera_index}"})
    except Exception as e:
        if video_capture:
            video_capture.release()
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    """Stop camera."""
    global video_capture, camera_on, face_tracker
    
    camera_on = False
    if video_capture:
        video_capture.release()
        video_capture = None
    face_tracker.clear()
    
    return jsonify({"status": "stopped", "message": "Camera stopped successfully"})

@app.route('/api/camera/frame', methods=['GET'])
def get_frame():
    """Get current frame with face recognition annotations."""
    global video_capture, camera_on, frame_count
    
    if not camera_on or video_capture is None or not video_capture.isOpened():
        return jsonify({"status": "error", "message": "Camera is not active"})
    
    ret, frame = video_capture.read()
    if not ret:
        return jsonify({"status": "error", "message": "Could not read frame from camera"})
    
    frame_count += 1
    
    # Process face detection every 3rd frame
    if frame_count % 3 == 0:
        try:
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            face_locations = face_recognition.face_locations(rgb_small_frame)
            current_face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            
            match_faces_to_trackers(face_locations, current_face_encodings)
        except Exception as e:
            print(f"Error during face recognition: {e}")
    else:
        for tracker in face_tracker.values():
            tracker.increment_missed_frames()
    
    # Draw face annotations
    for tracker_id, tracker in list(face_tracker.items()):
        if tracker.is_expired():
            continue
            
        top, right, bottom, left = tracker.location
        
        # Choose color based on recognition status
        if tracker.name != "Unknown" and tracker.is_confirmed:
            color = (0, 100, 0)  # Green for confirmed
            thickness = 3
        elif tracker.name != "Unknown":
            color = (0, 191, 255)  # Yellow for tentative
            thickness = 2
        else:
            color = (0, 0, 139)  # Red for unknown
            thickness = 2
        
        # Draw bounding box
        cv2.rectangle(frame, (left, top), (right, bottom), color, thickness)
        
        # Prepare label text
        label = tracker.name
        if tracker.confidence_history:
            avg_confidence = np.mean(tracker.confidence_history)
            label += f" ({avg_confidence:.2f})"
        
        # Draw label background
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        
        # Draw label text
        cv2.putText(frame, label, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
    
    # Add frame info
    info_text = f"Frames: {frame_count} | Active Trackers: {len(face_tracker)}"
    cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Convert frame to base64
    _, buffer = cv2.imencode('.jpg', frame)
    frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Get detected faces info
    detected_faces = []
    for tracker_id, tracker in face_tracker.items():
        if not tracker.is_expired():
            detected_faces.append({
                "id": tracker_id,
                "name": tracker.name,
                "confidence": np.mean(tracker.confidence_history) if tracker.confidence_history else 0,
                "is_confirmed": tracker.is_confirmed
            })
    
    return jsonify({
        "status": "success",
        "frame": frame_base64,
        "detected_faces": detected_faces,
        "total_faces": len(detected_faces)
    })

@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    """Process a single frame sent from the browser."""
    global known_face_encodings, known_face_names, face_tracker, next_face_id
    
    try:
        data = request.get_json()
        if not data or 'frame' not in data:
            return jsonify({"status": "error", "message": "No frame data provided"})
        
        print("🎥 Received frame for processing...")
        
        # Decode base64 image
        frame_data = base64.b64decode(data['frame'])
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"status": "error", "message": "Invalid image data"})
        
        print(f"   Frame size: {frame.shape}")
        
        # Process face detection (similar to existing logic but for single frame)
        try:
            # Resize frame for faster processing (increased from 0.25 to 0.5 for better detection)
            small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            print(f"   Processing frame size: {small_frame.shape}")
            
            # Find faces using CNN model for better detection (more accurate than HOG)
            face_locations = face_recognition.face_locations(rgb_small_frame, model="cnn")
            print(f"   Found {len(face_locations)} face location(s)")
            
            current_face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            print(f"   Generated {len(current_face_encodings)} face encoding(s)")
            
            detected_faces = []
            
            # Process each detected face
            for i, (face_location, face_encoding) in enumerate(zip(face_locations, current_face_encodings)):
                # Scale face location back to full size
                top, right, bottom, left = face_location
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                print(f"   Face {i+1}: location ({left}, {top}, {right}, {bottom})")
                
                name = "Unknown"
                confidence = 0.0
                
                # Try to recognize the face
                if known_face_encodings:
                    matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=TRACKING_THRESHOLD)
                    face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                    
                    print(f"   Face {i+1}: distances {face_distances}")
                    
                    if len(face_distances) > 0:
                        best_match_index = np.argmin(face_distances)
                        if matches[best_match_index]:
                            name = known_face_names[best_match_index]
                            confidence = 1 - face_distances[best_match_index]
                            print(f"   Face {i+1}: Recognized as {name} (confidence: {confidence:.3f})")
                else:
                    print(f"   Face {i+1}: No known encodings to compare against")
                
                detected_faces.append({
                    "id": i,
                    "name": name,
                    "confidence": float(confidence),
                    "is_confirmed": bool(confidence > 0.6),
                    "location": {"top": int(top), "right": int(right), "bottom": int(bottom), "left": int(left)}
                })
            
            print(f"✅ Returning {len(detected_faces)} detected faces")
            
            return jsonify({
                "status": "success",
                "detected_faces": detected_faces,
                "total_faces": len(detected_faces),
                "message": f"Processed frame with {len(detected_faces)} face(s)"
            })
            
        except Exception as e:
            print(f"❌ Face processing error: {e}")
            return jsonify({"status": "error", "message": f"Face processing error: {str(e)}"})
            
    except Exception as e:
        print(f"❌ Frame processing error: {e}")
        return jsonify({"status": "error", "message": f"Frame processing error: {str(e)}"})

if __name__ == '__main__':
    print("🔧 Initializing Facial Recognition Service...")
    
    if not load_reference_data():
        print("❌ Warning: Could not load reference data. Face recognition will not work properly.")
    
    print("🚀 Starting Flask service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
