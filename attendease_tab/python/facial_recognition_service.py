from deepface import DeepFace
import cv2
import numpy as np
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Global variables
video_capture = None
camera_on = False
face_tracker = {}
next_face_id = 0
frame_count = 0
process_frame_count = 0

# Configuration - DeepFace
PHOTOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
DEEPFACE_MODEL = "ArcFace"  # Best accuracy
DISTANCE_THRESHOLD = 0.50   # Stricter threshold for ArcFace (default is 0.68, lower = stricter)
MIN_CONFIDENCE = 0.35       # Minimum confidence to accept a match (below this = Unknown)

# Tracking Configuration
TRACKING_FRAMES = 12
FACE_DISTANCE_THRESHOLD = 360  # Prevent duplicate trackers during fast motion
TRACKER_MERGE_THRESHOLD = 180  # Merge trackers within this distance with same name
LOCATION_SMOOTHING_FACTOR = 0.45
SMOOTHING_DISTANCE_THRESHOLD = 90
MAX_TRACKING_VELOCITY = 50
PREDICTION_DECAY = 0.65
RAPID_MOVEMENT_THRESHOLD = 60


class FaceTracker:
    def __init__(self, face_id, name, location, encoding=None):
        location = tuple(int(v) for v in location)
        self.id = face_id
        self.name = name
        self.location = location
        self.raw_location = location
        self.encoding = encoding
        self.last_seen = time.time()
        self.confidence_history = []
        self.missed_frames = 0
        self.is_confirmed = False
        self.velocity = (0.0, 0.0)
        self.identification_count = 0  # Track how many times we've identified this face

    @staticmethod
    def _center(location):
        return ((location[1] + location[3]) / 2.0, (location[0] + location[2]) / 2.0)

    def _smooth_location(self, new_location):
        if self.location is None:
            return tuple(int(v) for v in new_location)
        return tuple(int(self.location[i] * (1 - LOCATION_SMOOTHING_FACTOR) + new_location[i] * LOCATION_SMOOTHING_FACTOR) for i in range(4))

    def _apply_velocity_prediction(self):
        if self.location is None:
            return
        dx, dy = self.velocity
        speed = np.sqrt(dx**2 + dy**2)
        if speed > MAX_TRACKING_VELOCITY:
            scale = MAX_TRACKING_VELOCITY / speed
            self.velocity = (dx * scale, dy * scale)
            dx, dy = self.velocity
        if speed > RAPID_MOVEMENT_THRESHOLD:
            self.velocity = (dx * 0.75, dy * 0.75)
            dx, dy = self.velocity
        if abs(dx) < 0.1 and abs(dy) < 0.1:
            return
        shift_x = dx * PREDICTION_DECAY
        shift_y = dy * PREDICTION_DECAY
        top, right, bottom, left = self.location
        predicted = (
            int(top + shift_y),
            int(right + shift_x),
            int(bottom + shift_y),
            int(left + shift_x)
        )
        self.location = predicted
        self.raw_location = predicted
        self.velocity = (dx * PREDICTION_DECAY, dy * PREDICTION_DECAY)

    def update_location(self, new_location, confidence=None, encoding=None):
        new_location = tuple(int(v) for v in new_location)
        prev_center = self._center(self.location) if self.location is not None else None
        smoothed_location = self._smooth_location(new_location)
        self.raw_location = new_location
        self.location = smoothed_location
        if prev_center is not None:
            new_center = self._center(smoothed_location)
            self.velocity = (new_center[0] - prev_center[0], new_center[1] - prev_center[1])
        else:
            self.velocity = (0.0, 0.0)
        self.last_seen = time.time()
        self.missed_frames = 0
        if encoding is not None:
            self.encoding = encoding
        if confidence is not None:
            self.confidence_history.append(confidence)
            if len(self.confidence_history) > 5:
                self.confidence_history.pop(0)
            if len(self.confidence_history) >= 3 and all(c > 0.45 for c in self.confidence_history):
                self.is_confirmed = True

    def increment_missed_frames(self):
        self.missed_frames += 1
        self._apply_velocity_prediction()

    def is_expired(self):
        return self.missed_frames > TRACKING_FRAMES


def load_reference_data():
    """Verify photos directory exists and pre-build DeepFace representations."""
    global PHOTOS_DIR
    
    print("[CAMERA] Initializing DeepFace with ArcFace model...")
    print(f"   Photos directory: {PHOTOS_DIR}")
    
    if not os.path.exists(PHOTOS_DIR):
        print(f"   [WARNING] Photos directory not found at {PHOTOS_DIR}")
        return False
    
    # List available reference photos
    photo_files = [f for f in os.listdir(PHOTOS_DIR) 
                   if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"   Found {len(photo_files)} reference photo(s): {photo_files}")
    
    if len(photo_files) == 0:
        print("   [WARNING] No reference photos found!")
        return False
    
    # Pre-build representations (creates .pkl cache in photos folder)
    # This runs on first call and caches for subsequent calls
    try:
        print("   Pre-building face representations (first run may take 30-60 seconds)...")
        # Create a dummy search to trigger indexing
        test_img = os.path.join(PHOTOS_DIR, photo_files[0])
        DeepFace.find(
            img_path=test_img,
            db_path=PHOTOS_DIR,
            model_name=DEEPFACE_MODEL,
            enforce_detection=False,
            silent=True
        )
        print("   [OK] DeepFace representations built successfully!")
    except Exception as e:
        # Encode error message safely for Windows console
        error_msg = str(e).encode('ascii', 'replace').decode('ascii')
        print(f"   [WARNING] Could not pre-build representations: {error_msg}")
    
    return True


def identify_face_deepface(face_image_bgr):
    """
    Identify a face using DeepFace.find().
    
    Args:
        face_image_bgr: OpenCV BGR image (numpy array) containing a face
        
    Returns:
        tuple: (name, confidence) or ("Unknown", 0.0)
    """
    try:
        # Check if image is valid
        if face_image_bgr is None or face_image_bgr.size == 0:
            return "Unknown", 0.0
        
        # Minimum face size check
        if face_image_bgr.shape[0] < 20 or face_image_bgr.shape[1] < 20:
            return "Unknown", 0.0
        
        # Using numpy array directly
        results = DeepFace.find(
            img_path=face_image_bgr,
            db_path=PHOTOS_DIR,
            model_name=DEEPFACE_MODEL,
            enforce_detection=False,  # Don't fail if no face detected
            silent=True,
            threshold=DISTANCE_THRESHOLD
        )
        
        # DeepFace.find returns a list of DataFrames (one per face in image)
        if results and len(results) > 0 and not results[0].empty:
            best_match = results[0].iloc[0]
            identity_path = best_match['identity']
            distance = best_match['distance']
            
            # Extract name from filename (e.g., "photos/john_doe.jpg" -> "John Doe")
            filename = os.path.basename(identity_path)
            name_without_ext = os.path.splitext(filename)[0]
            readable_name = name_without_ext.replace('_', ' ').title()
            
            # Convert distance to confidence (lower distance = higher confidence)
            # For ArcFace with threshold 0.50: distance 0 = 100% confidence, distance 0.50 = 0% confidence
            confidence = max(0, 1 - (distance / DISTANCE_THRESHOLD))
            
            # CRITICAL: Reject low-confidence matches as Unknown
            # This prevents misidentification of unknown people
            if confidence < MIN_CONFIDENCE:
                print(f"      DeepFace REJECTED: {readable_name} (distance: {distance:.3f}, confidence: {confidence:.3f} < {MIN_CONFIDENCE})")
                return "Unknown", 0.0
            
            print(f"      DeepFace MATCH: {readable_name} (distance: {distance:.3f}, confidence: {confidence:.3f})")
            return readable_name, confidence
        
        print(f"      DeepFace: No match found in database")
        return "Unknown", 0.0
        
    except Exception as e:
        print(f"      DeepFace error: {e}")
        return "Unknown", 0.0


def calculate_distance(loc1, loc2):
    """Calculate Euclidean distance between two face locations."""
    center1 = ((loc1[1] + loc1[3]) // 2, (loc1[0] + loc1[2]) // 2)
    center2 = ((loc2[1] + loc2[3]) // 2, (loc2[0] + loc2[2]) // 2)
    return np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)


def merge_duplicate_trackers():
    """Merge duplicate trackers with the same name that are close to each other."""
    global face_tracker
    
    tracker_ids = list(face_tracker.keys())
    merged_ids = set()
    
    for i, tracker_id_1 in enumerate(tracker_ids):
        if tracker_id_1 in merged_ids:
            continue
            
        tracker_1 = face_tracker.get(tracker_id_1)
        if not tracker_1 or tracker_1.name == "Unknown":
            continue
        
        for tracker_id_2 in tracker_ids[i+1:]:
            if tracker_id_2 in merged_ids:
                continue
                
            tracker_2 = face_tracker.get(tracker_id_2)
            if not tracker_2:
                continue
            
            # Check if same name and close distance
            if tracker_1.name == tracker_2.name:
                distance = calculate_distance(tracker_1.location, tracker_2.location)
                
                if distance < TRACKER_MERGE_THRESHOLD:
                    # Keep the tracker with higher confidence, remove the other
                    conf_1 = np.mean(tracker_1.confidence_history) if tracker_1.confidence_history else 0
                    conf_2 = np.mean(tracker_2.confidence_history) if tracker_2.confidence_history else 0
                    
                    if conf_1 >= conf_2:
                        print(f"   Merging duplicate tracker {tracker_id_2} into {tracker_id_1} (distance: {distance:.0f}px)")
                        del face_tracker[tracker_id_2]
                        merged_ids.add(tracker_id_2)
                    else:
                        print(f"   Merging duplicate tracker {tracker_id_1} into {tracker_id_2} (distance: {distance:.0f}px)")
                        del face_tracker[tracker_id_1]
                        merged_ids.add(tracker_id_1)
                        break


def match_faces_to_trackers(face_locations, frame_bgr):
    """Match detected faces to existing trackers or create new ones."""
    global face_tracker, next_face_id
    
    # Scale locations back to full resolution (from 1/4 scale)
    scaled_locations = []
    for (top, right, bottom, left) in face_locations:
        scaled_locations.append((top * 4, right * 4, bottom * 4, left * 4))
    
    matched_trackers = set()
    new_detections = []
    
    for i, location in enumerate(scaled_locations):
        best_tracker = None
        min_distance = float('inf')
        
        # Try to match with existing tracker by location
        for tracker_id, tracker in face_tracker.items():
            if tracker_id in matched_trackers:
                continue
            distance = calculate_distance(location, tracker.location)
            if distance < FACE_DISTANCE_THRESHOLD and distance < min_distance:
                min_distance = distance
                best_tracker = tracker_id
        
        if best_tracker is not None:
            # Update existing tracker
            top, right, bottom, left = location
            
            # Extract face region for identification
            # Make sure we don't go out of bounds
            h, w = frame_bgr.shape[:2]
            top_safe = max(0, min(top, h-1))
            bottom_safe = max(0, min(bottom, h))
            left_safe = max(0, min(left, w-1))
            right_safe = max(0, min(right, w))
            
            face_crop = frame_bgr[top_safe:bottom_safe, left_safe:right_safe]
            
            # Only re-identify periodically to save processing
            tracker = face_tracker[best_tracker]
            tracker.identification_count += 1
            
            # Re-identify known faces every 10 frames, Unknown faces every 5 frames
            # This balances accuracy with performance
            if tracker.name == "Unknown":
                should_identify = (tracker.identification_count % 5 == 0)
            else:
                should_identify = (tracker.identification_count % 10 == 0)
            
            if should_identify:
                name, confidence = identify_face_deepface(face_crop)
                if name != "Unknown":
                    tracker.name = name
                    tracker.update_location(location, confidence)
                else:
                    tracker.update_location(location)
            else:
                tracker.update_location(location)
            
            matched_trackers.add(best_tracker)
        else:
            new_detections.append((location, i))
    
    # Create new trackers for unmatched faces
    for location, idx in new_detections:
        top, right, bottom, left = location
        
        # Make sure we don't go out of bounds
        h, w = frame_bgr.shape[:2]
        top_safe = max(0, min(top, h-1))
        bottom_safe = max(0, min(bottom, h))
        left_safe = max(0, min(left, w-1))
        right_safe = max(0, min(right, w))
        
        face_crop = frame_bgr[top_safe:bottom_safe, left_safe:right_safe]
        
        name, confidence = identify_face_deepface(face_crop)
        
        tracker = FaceTracker(next_face_id, name, location)
        if confidence > 0:
            tracker.update_location(location, confidence)
        face_tracker[next_face_id] = tracker
        next_face_id += 1
    
    # Handle missed trackers
    for tracker_id in list(face_tracker.keys()):
        if tracker_id not in matched_trackers:
            face_tracker[tracker_id].increment_missed_frames()
            if face_tracker[tracker_id].is_expired():
                del face_tracker[tracker_id]
    
    merge_duplicate_trackers()


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
            # Use DeepFace to detect faces
            detected_faces_df = DeepFace.extract_faces(
                img_path=frame,
                detector_backend='opencv',
                enforce_detection=False,
                align=False
            )
            
            # Convert DeepFace detections to our format
            face_locations = []
            for face_obj in detected_faces_df:
                if face_obj['confidence'] > 0.5:
                    region = face_obj['facial_area']
                    x, y, w, h = region['x'], region['y'], region['w'], region['h']
                    # Convert to top, right, bottom, left (1/4 scale for tracking)
                    top = y // 4
                    right = (x + w) // 4
                    bottom = (y + h) // 4
                    left = x // 4
                    face_locations.append((top, right, bottom, left))
            
            match_faces_to_trackers(face_locations, frame)
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


@app.route('/api/clear-trackers', methods=['POST'])
def clear_trackers():
    """Clear all face trackers (called when camera stops)."""
    global face_tracker, next_face_id, process_frame_count
    
    face_tracker.clear()
    next_face_id = 0
    process_frame_count = 0
    print("Cleared all face trackers and reset frame count")
    
    return jsonify({"status": "success", "message": "Face trackers cleared"})


@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    """Process a single frame sent from the browser with face tracking."""
    global face_tracker, next_face_id, process_frame_count
    
    try:
        data = request.get_json()
        if not data or 'frame' not in data:
            return jsonify({"status": "error", "message": "No frame data provided"})
        
        process_frame_count += 1
        print(f"Received frame #{process_frame_count} for processing...")
        
        # Decode base64 image
        frame_data = base64.b64decode(data['frame'])
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"status": "error", "message": "Invalid image data"})
        
        print(f"   Frame size: {frame.shape}")
        
        try:
            # Use DeepFace to detect faces
            detected_faces_df = DeepFace.extract_faces(
                img_path=frame,
                detector_backend='opencv',  # Fast detector
                enforce_detection=False,
                align=False
            )
            
            # Convert DeepFace detections to our format
            face_locations = []
            for face_obj in detected_faces_df:
                if face_obj['confidence'] > 0.5:  # Filter low-confidence detections
                    region = face_obj['facial_area']
                    # DeepFace returns x, y, w, h
                    x, y, w, h = region['x'], region['y'], region['w'], region['h']
                    # Convert to top, right, bottom, left (1/4 scale for tracking)
                    top = y // 4
                    right = (x + w) // 4
                    bottom = (y + h) // 4
                    left = x // 4
                    face_locations.append((top, right, bottom, left))
            
            print(f"   Detected {len(face_locations)} face(s)")
            
            # Match faces to trackers (pass full frame for identification)
            match_faces_to_trackers(face_locations, frame)
            
            # Build response from tracked faces
            detected_faces = []
            for tracker_id, tracker in list(face_tracker.items()):
                if tracker.is_expired():
                    del face_tracker[tracker_id]
                    continue
                
                top, right, bottom, left = tracker.location
                avg_confidence = np.mean(tracker.confidence_history) if tracker.confidence_history else 0.0
                
                detected_faces.append({
                    "id": tracker_id,
                    "name": tracker.name,
                    "confidence": float(avg_confidence),
                    "is_confirmed": tracker.is_confirmed,
                    "location": {
                        "top": int(top), 
                        "right": int(right), 
                        "bottom": int(bottom), 
                        "left": int(left)
                    }
                })
                
                print(f"   [v] Tracker {tracker_id}: {tracker.name} (confirmed: {tracker.is_confirmed}, confidence: {avg_confidence:.3f}, missed: {tracker.missed_frames})")
            
            print(f"[OK] Returning {len(detected_faces)} tracked faces (total active trackers: {len(face_tracker)})")
            
            return jsonify({
                "status": "success",
                "detected_faces": detected_faces,
                "total_faces": len(detected_faces),
                "message": f"Frame #{process_frame_count} processed"
            })
            
        except Exception as e:
            print(f"[ERROR] Face processing error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"status": "error", "message": f"Face processing error: {str(e)}"})
            
    except Exception as e:
        print(f"[ERROR] Frame processing error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Frame processing error: {str(e)}"})


if __name__ == '__main__':
    print("Initializing Facial Recognition Service with DeepFace...")
    
    if not load_reference_data():
        print("[WARNING] Could not load reference data. Face recognition will only detect unknown faces.")
    
    print("Starting Flask service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
