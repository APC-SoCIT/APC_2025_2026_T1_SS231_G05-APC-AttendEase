from deepface import DeepFace
import cv2
import numpy as np
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import mediapipe as mp
from collections import Counter
from supabase import create_client, Client
from dotenv import load_dotenv
import threading

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SECRET_KEY')
supabase: Client = None
face_vectors_cache = {}  # {student_id: face_vector}
cache_last_updated = None

if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("[OK] Supabase client initialized successfully")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Supabase client: {e}")
else:
    print("[WARN] Supabase credentials not found in .env file")


def load_face_vectors_from_db():
    """Load all face vectors from database into memory cache."""
    global face_vectors_cache, cache_last_updated
    
    if not supabase:
        print("[WARN] Supabase not initialized, cannot load face vectors")
        return False
    
    try:
        # Fetch all biometric data with student info
        response = supabase.table('student_biometric_data')\
            .select('student_id, face_profile, user_profiles(first_name, last_name, student_number)')\
            .execute()
        
        if response.data:
            new_cache = {}
            for record in response.data:
                student_id = record['student_id']
                face_vector = record['face_profile']
                
                # Get student name from joined data
                if record.get('user_profiles'):
                    first_name = record['user_profiles'].get('first_name', '')
                    last_name = record['user_profiles'].get('last_name', '')
                    student_number = record['user_profiles'].get('student_number', '')
                    name = f"{first_name} {last_name}".strip()
                else:
                    name = "Unknown"
                    student_number = None
                
                if face_vector and isinstance(face_vector, list) and len(face_vector) > 0:
                    new_cache[student_id] = {
                        'vector': np.array(face_vector, dtype=np.float64),
                        'name': name,
                        'student_number': student_number
                    }
            
            face_vectors_cache = new_cache
            cache_last_updated = time.time()
            print(f"[OK] Loaded {len(face_vectors_cache)} face vectors from database")
            return True
        else:
            print("[WARN] No face vectors found in database")
            return False
            
    except Exception as e:
        print(f"[ERROR] Failed to load face vectors from database: {e}")
        return False


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors."""
    vec1 = np.array(vec1, dtype=np.float64)
    vec2 = np.array(vec2, dtype=np.float64)
    
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)


def identify_face_from_vector(face_image_bgr):
    """Identify a face by comparing its vector against cached database vectors."""
    try:
        if face_image_bgr is None or face_image_bgr.size == 0:
            return "Unknown", 0.0
        
        if face_image_bgr.shape[0] < 20 or face_image_bgr.shape[1] < 20:
            return "Unknown", 0.0
        
        # Extract face vector from the image
        try:
            embedding_objs = DeepFace.represent(
                img_path=face_image_bgr,
                model_name=DEEPFACE_MODEL,
                detector_backend='opencv',
                enforce_detection=False,
                align=True
            )
            
            if not embedding_objs or len(embedding_objs) == 0:
                return "Unknown", 0.0
            
            face_vector = np.array(embedding_objs[0]['embedding'], dtype=np.float64)
            
        except Exception as e:
            print(f"[ERROR] Face vector extraction failed: {e}")
            return "Unknown", 0.0
        
        # Compare against cached vectors
        if not face_vectors_cache:
            return "Unknown", 0.0
        
        best_match_name = "Unknown"
        best_similarity = 0.0
        best_student_id = None
        
        for student_id, data in face_vectors_cache.items():
            cached_vector = data['vector']
            similarity = cosine_similarity(face_vector, cached_vector)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_name = data['name']
                best_student_id = student_id
        
        # Convert similarity to confidence
        # Cosine similarity ranges from -1 to 1, but for face recognition typically 0.4+ is a match
        # ArcFace threshold is typically around 0.4-0.6 similarity for matches
        similarity_threshold = 0.40  # Adjust based on testing
        
        if best_similarity < similarity_threshold:
            return "Unknown", 0.0
        
        # Map similarity (0.4-1.0) to confidence (0-1)
        confidence = min(1.0, (best_similarity - similarity_threshold) / (1.0 - similarity_threshold))
        
        if confidence < MIN_CONFIDENCE:
            return "Unknown", 0.0
        
        return best_match_name, confidence
        
    except Exception as e:
        msg = f"      Face identification error: {str(e)}\n"
        sys.stdout.buffer.write(msg.encode('utf-8'))
        return "Unknown", 0.0


def refresh_vector_cache_background():
    """Background thread to refresh face vector cache every 5 minutes."""
    while True:
        time.sleep(300)  # 5 minutes
        print("[INFO] Refreshing face vector cache from database...")
        load_face_vectors_from_db()


# MediaPipe Initialization (Tasks API)
mp_tasks = mp.tasks
vision = mp_tasks.vision

BaseOptions = mp_tasks.BaseOptions
FaceLandmarker = vision.FaceLandmarker
FaceLandmarkerOptions = vision.FaceLandmarkerOptions
HandLandmarker = vision.HandLandmarker
HandLandmarkerOptions = vision.HandLandmarkerOptions
VisionRunningMode = vision.RunningMode

MODEL_PATH = os.path.dirname(os.path.abspath(__file__))
face_model_path = os.path.join(MODEL_PATH, 'models', 'face_landmarker.task')
hand_model_path = os.path.join(MODEL_PATH, 'models', 'hand_landmarker.task')

face_mesh_detector = None
hand_detector = None

ENGAGEMENT_ENABLED = True  # Will be set to False if models fail to load

if os.path.exists(face_model_path) and os.path.exists(hand_model_path):
    try:
        # Initialize Face Landmarker
        face_options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=face_model_path),
            running_mode=VisionRunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.3,
            min_face_presence_confidence=0.3,
            min_tracking_confidence=0.3
        )
        face_mesh_detector = FaceLandmarker.create_from_options(face_options)
        print("[OK] MediaPipe Face Landmarker initialized successfully")
    except Exception as e:
        print(f"[ERROR] Error initializing Face Landmarker: {e}")
        face_mesh_detector = None
        ENGAGEMENT_ENABLED = False

    try:
        # Initialize Hand Landmarker
        hand_options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=hand_model_path),
            running_mode=VisionRunningMode.IMAGE,
            num_hands=20,
            min_hand_detection_confidence=0.3,
            min_hand_presence_confidence=0.3,
            min_tracking_confidence=0.3
        )
        hand_detector = HandLandmarker.create_from_options(hand_options)
        print("[OK] MediaPipe Hand Landmarker initialized successfully")
    except Exception as e:
        print(f"[ERROR] Error initializing Hand Landmarker: {e}")
        hand_detector = None
        # Don't disable engagement if only hand detection failed - face detection is more important
    
    if face_mesh_detector:
        print("[OK] Engagement detection (eyes/mouth) ENABLED")
    else:
        ENGAGEMENT_ENABLED = False
else:
    print("[WARN] Warning: MediaPipe models not found. Behavioral engagement disabled.")
    print(f"   Looking for: {face_model_path}")
    print(f"   Looking for: {hand_model_path}")
    ENGAGEMENT_ENABLED = False

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

# Engagement Configuration (Behavioral) - Adjusted for 10 FPS
ENGAGEMENT_ANALYSIS_INTERVAL = 1  # Analyze every frame for smooth behavior detection
ENGAGEMENT_HISTORY_SIZE = 30
EAR_THRESHOLD = 0.20        # Eye Aspect Ratio threshold (closing eyes) - lowered for testing
MAR_THRESHOLD = 0.25        # Mouth Aspect Ratio threshold (opening mouth) - more sensitive
SLEEP_FRAMES_THRESHOLD = 20 # ~2 seconds at 10 FPS for testing (was 15 = 1.5 seconds)
SPEAK_FRAMES_THRESHOLD = 5  # ~0.5 seconds at 10 FPS (requires sustained mouth open)
# Note: ENGAGEMENT_ENABLED is set at the top during MediaPipe initialization


def calculate_landmark_distance(p1, p2):
    """Euclidean distance between two MediaPipe landmarks."""
    return np.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

def calculate_ear(landmarks, indices):
    """Calculate Eye Aspect Ratio."""
    # indices: [p1, p2, p3, p4, p5, p6]
    # Vertical distances
    A = calculate_landmark_distance(landmarks[indices[1]], landmarks[indices[5]])
    B = calculate_landmark_distance(landmarks[indices[2]], landmarks[indices[4]])
    # Horizontal distance
    C = calculate_landmark_distance(landmarks[indices[0]], landmarks[indices[3]])
    if C == 0: return 0
    return (A + B) / (2.0 * C)

def calculate_mar(landmarks):
    """Calculate Mouth Aspect Ratio using inner lips."""
    # 78: Left Corner, 308: Right Corner, 13: Top Lip, 14: Bottom Lip
    A = calculate_landmark_distance(landmarks[13], landmarks[14]) # Vertical
    B = calculate_landmark_distance(landmarks[78], landmarks[308]) # Horizontal
    if B == 0: return 0
    return A / B


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
        self.identification_count = 0
        
        # Behavioral attributes
        self.is_sleeping = False
        self.is_speaking = False
        self.hand_raised = False
        self.sleep_counter = 0
        self.speak_counter = 0
        self.ear_history = []
        self.mar_history = []
        
        # Legacy/Composite Engagement
        self.current_engagement_score = 75.0 # Start at attentive
        self.engagement_level = 'engaged'
        self.engagement_analysis_count = 0
        
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

    def update_behavior(self, ear, mar, hand_raised_detected):
        # Update EAR history
        if ear is not None:
            self.ear_history.append(ear)
            if len(self.ear_history) > ENGAGEMENT_HISTORY_SIZE: self.ear_history.pop(0)
            
            # Sleeping Logic
            if ear < EAR_THRESHOLD:
                self.sleep_counter += 1
            else:
                self.sleep_counter = max(0, self.sleep_counter - 1)
            
            was_sleeping = self.is_sleeping
            self.is_sleeping = self.sleep_counter > SLEEP_FRAMES_THRESHOLD
            
            # Log state changes
            if self.is_sleeping and not was_sleeping:
                print(f"[{self.name}] SLEEPING detected (eyes closed for {self.sleep_counter} frames)")
            elif not self.is_sleeping and was_sleeping:
                print(f"[{self.name}] AWAKE (eyes opened)")
            
        # Update MAR history
        if mar is not None:
            self.mar_history.append(mar)
            if len(self.mar_history) > ENGAGEMENT_HISTORY_SIZE: self.mar_history.pop(0)
            
            # Speaking Logic
            if mar > MAR_THRESHOLD:
                self.speak_counter += 1
            else:
                self.speak_counter = max(0, self.speak_counter - 2)
                
            self.is_speaking = self.speak_counter > SPEAK_FRAMES_THRESHOLD

        # Hand Raise Logic
        self.hand_raised = hand_raised_detected
        
        # Calculate Composite Score and Engagement Level
        # engaged = speaking/hand raised, present = attentive, disengaged = sleeping
        if self.is_sleeping:
            self.current_engagement_score = 0
            self.engagement_level = 'disengaged'
        elif self.is_speaking or self.hand_raised:
            self.current_engagement_score = 100
            self.engagement_level = 'engaged'
        else:
            self.current_engagement_score = 75
            self.engagement_level = 'present'  # Attentive/neutral state

    def get_engagement_data(self):
        return {
            "engagement_score": float(self.current_engagement_score),
            "engagement_level": self.engagement_level,
            "is_sleeping": self.is_sleeping,
            "is_speaking": self.is_speaking,
            "hand_raised": self.hand_raised
        }


# Debug counter for logging frequency
_behavior_debug_counter = 0

def analyze_face_behavior(face_img):
    """Analyze engagement metrics (EAR, MAR) for a face crop using MediaPipe Face Mesh."""
    global _behavior_debug_counter
    if not ENGAGEMENT_ENABLED:
        return None, None
        
    try:
        h, w = face_img.shape[:2]
        if w < 10 or h < 10: return None, None
        
        # Convert to RGB
        rgb_face = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_face)
        
        if face_mesh_detector:
            results = face_mesh_detector.detect(mp_image)
            
            if results.face_landmarks:
                landmarks = results.face_landmarks[0]
                
                # Left Eye: 33, 160, 158, 133, 153, 144
                ear_left = calculate_ear(landmarks, [33, 160, 158, 133, 153, 144])
                # Right Eye: 362, 385, 387, 263, 373, 380
                ear_right = calculate_ear(landmarks, [362, 385, 387, 263, 373, 380])
                ear = (ear_left + ear_right) / 2.0
                
                mar = calculate_mar(landmarks)
                
                # Debug logging every frame during testing
                _behavior_debug_counter += 1
                eyes_status = "CLOSED" if ear < EAR_THRESHOLD else "open"
                mouth_status = "OPEN" if mar > MAR_THRESHOLD else "closed"
                if _behavior_debug_counter % 1 == 0:  # Log every frame for debugging
                    print(f"[Engagement] EAR={ear:.3f} ({eyes_status}), MAR={mar:.3f} ({mouth_status})")
                
                return ear, mar
            
    except Exception as e:
        pass  # Silently handle errors to avoid log spam
    
    return None, None


def load_reference_data():
    """Verify photos directory exists and pre-build DeepFace representations."""
    global PHOTOS_DIR
    
    print("Initializing DeepFace with ArcFace model...")
    print(f"   Photos directory: {PHOTOS_DIR}")
    
    if not os.path.exists(PHOTOS_DIR):
        print(f"   Warning: Photos directory not found at {PHOTOS_DIR}")
        return False
    
    # List available reference photos
    photo_files = [f for f in os.listdir(PHOTOS_DIR) 
                   if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"   Found {len(photo_files)} reference photo(s): {photo_files}")
    
    if len(photo_files) == 0:
        print("   Warning: No reference photos found!")
        return False
    
    # Pre-build representations (creates .pkl cache in photos folder)
    try:
        print("   Pre-building face representations...")
        test_img = os.path.join(PHOTOS_DIR, photo_files[0])
        DeepFace.find(
            img_path=test_img,
            db_path=PHOTOS_DIR,
            model_name=DEEPFACE_MODEL,
            enforce_detection=False,
            silent=True
        )
        print("   DeepFace representations built successfully!")
    except Exception as e:
        print(f"   Warning: Could not pre-build representations: {e}")
    
    return True


def identify_face_deepface(face_image_bgr):
    """Identify a face using DeepFace.find()."""
    try:
        if face_image_bgr is None or face_image_bgr.size == 0:
            return "Unknown", 0.0
        
        if face_image_bgr.shape[0] < 20 or face_image_bgr.shape[1] < 20:
            return "Unknown", 0.0
        
        results = DeepFace.find(
            img_path=face_image_bgr,
            db_path=PHOTOS_DIR,
            model_name=DEEPFACE_MODEL,
            enforce_detection=False,
            silent=True,
            threshold=DISTANCE_THRESHOLD
        )
        
        if results and len(results) > 0 and not results[0].empty:
            best_match = results[0].iloc[0]
            identity_path = best_match['identity']
            distance = best_match['distance']
            
            filename = os.path.basename(identity_path)
            name_without_ext = os.path.splitext(filename)[0]
            readable_name = name_without_ext.replace('_', ' ').title()
            
            confidence = max(0, 1 - (distance / DISTANCE_THRESHOLD))
            
            if confidence < MIN_CONFIDENCE:
                return "Unknown", 0.0
            
            return readable_name, confidence
        
        return "Unknown", 0.0
        
    except Exception as e:
        # Use sys.stdout.buffer to avoid UnicodeEncodeError on Windows
        msg = f"      DeepFace error: {str(e)}\n"
        sys.stdout.buffer.write(msg.encode('utf-8'))
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
            
            if tracker_1.name == tracker_2.name:
                distance = calculate_distance(tracker_1.location, tracker_2.location)
                
                if distance < TRACKER_MERGE_THRESHOLD:
                    conf_1 = np.mean(tracker_1.confidence_history) if tracker_1.confidence_history else 0
                    conf_2 = np.mean(tracker_2.confidence_history) if tracker_2.confidence_history else 0
                    
                    if conf_1 >= conf_2:
                        del face_tracker[tracker_id_2]
                        merged_ids.add(tracker_id_2)
                    else:
                        del face_tracker[tracker_id_1]
                        merged_ids.add(tracker_id_1)
                        break


def match_faces_to_trackers(face_locations, frame_bgr):
    """Match detected faces to existing trackers or create new ones."""
    global face_tracker, next_face_id
    
    # NOTE: face_locations are already in full scale (no downscaling in this version)
    
    # 1. Detect Hands for "Raising Hand" behavior
    raised_hands_locs = []
    try:
        if hand_detector:
            rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            hand_results = hand_detector.detect(mp_image)
            if hand_results.hand_landmarks:
                for hand_landmarks in hand_results.hand_landmarks:
                    # Wrist is landmark 0. Tip of middle finger is 12.
                    wrist = hand_landmarks[0]
                    # Store normalized x, y
                    raised_hands_locs.append((wrist.x, wrist.y))
    except Exception as e:
        pass  # Silently handle errors

    matched_trackers = set()
    new_detections = []
    
    for i, location in enumerate(face_locations):
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
            # Update existing tracker
            top, right, bottom, left = location
            
            h, w = frame_bgr.shape[:2]
            top_safe = max(0, min(top, h-1))
            bottom_safe = max(0, min(bottom, h))
            left_safe = max(0, min(left, w-1))
            right_safe = max(0, min(right, w))
            
            face_crop = frame_bgr[top_safe:bottom_safe, left_safe:right_safe]
            
            tracker = face_tracker[best_tracker]
            tracker.identification_count += 1
            
            # Engagement Analysis
            tracker.engagement_analysis_count += 1
            if tracker.engagement_analysis_count % ENGAGEMENT_ANALYSIS_INTERVAL == 0:
                # Check for raised hand
                has_raised_hand = False
                face_center_x_norm = ((left + right) / 2) / w
                face_top_y_norm = top / h
                
                for hx, hy in raised_hands_locs:
                    # Hand is at or above face level and within horizontal range (relaxed)
                    if hy < (face_top_y_norm + 0.15) and abs(hx - face_center_x_norm) < 0.60:
                        has_raised_hand = True
                        break
                
                ear, mar = analyze_face_behavior(face_crop)
                tracker.update_behavior(ear, mar, has_raised_hand)
            
            # Re-identify (reduced frequency for stability)
            if tracker.name == "Unknown":
                should_identify = (tracker.identification_count % 25 == 0)  # ~2.5 seconds at 10 FPS
            else:
                should_identify = (tracker.identification_count % 50 == 0)  # ~5 seconds at 10 FPS
            
            if should_identify:
                name, confidence = identify_face_from_vector(face_crop)
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
    
    # Create new trackers
    for location, idx in new_detections:
        top, right, bottom, left = location
        
        h, w = frame_bgr.shape[:2]
        top_safe = max(0, min(top, h-1))
        bottom_safe = max(0, min(bottom, h))
        left_safe = max(0, min(left, w-1))
        right_safe = max(0, min(right, w))
        
        face_crop = frame_bgr[top_safe:bottom_safe, left_safe:right_safe]
        
        name, confidence = identify_face_from_vector(face_crop)
        
        tracker = FaceTracker(next_face_id, name, location)
        if confidence > 0:
            tracker.update_location(location, confidence)
            
        # Initial behavior analysis
        has_raised_hand = False
        face_center_x_norm = ((left + right) / 2) / w
        face_top_y_norm = top / h
        for hx, hy in raised_hands_locs:
            if hy < (face_top_y_norm + 0.15) and abs(hx - face_center_x_norm) < 0.60:
                has_raised_hand = True
                break
        
        ear, mar = analyze_face_behavior(face_crop)
        tracker.update_behavior(ear, mar, has_raised_hand)
        
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
    for i in range(10):
        try:
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
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
    try:
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
    global video_capture, camera_on, face_tracker
    if camera_on:
        return jsonify({"status": "already_running", "message": "Camera is already active"})
    try:
        data = request.get_json() or {}
        camera_index = data.get('camera_index', 0)
        video_capture = cv2.VideoCapture(camera_index)
        if video_capture.isOpened():
            ret, frame = video_capture.read()
            if ret:
                video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                video_capture.set(cv2.CAP_PROP_FPS, 30)
                camera_on = True
                face_tracker.clear()
                return jsonify({"status": "started", "message": f"Camera {camera_index} started successfully", "camera_index": camera_index})
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
    global video_capture, camera_on, face_tracker
    camera_on = False
    if video_capture:
        video_capture.release()
        video_capture = None
    face_tracker.clear()
    return jsonify({"status": "stopped", "message": "Camera stopped successfully"})


@app.route('/api/camera/frame', methods=['GET'])
def get_frame():
    global video_capture, camera_on, frame_count
    
    if not camera_on or video_capture is None or not video_capture.isOpened():
        return jsonify({"status": "error", "message": "Camera is not active"})
    
    ret, frame = video_capture.read()
    if not ret:
        return jsonify({"status": "error", "message": "Could not read frame from camera"})
    
    frame_count += 1
    
    if frame_count % 3 == 0:
        try:
            detected_faces_df = DeepFace.extract_faces(
                img_path=frame,
                detector_backend='opencv',
                enforce_detection=False,
                align=False
            )
            
            face_locations = []
            for face_obj in detected_faces_df:
                if face_obj['confidence'] > 0.5:
                    region = face_obj['facial_area']
                    x, y, w, h = region['x'], region['y'], region['w'], region['h']
                    # Use full coordinates directly
                    face_locations.append((y, x+w, y+h, x))
            
            match_faces_to_trackers(face_locations, frame)
        except Exception as e:
            print(f"Error during face recognition: {e}")
    else:
        for tracker in face_tracker.values():
            tracker.increment_missed_frames()
    
    detected_faces = []
    for tracker_id, tracker in list(face_tracker.items()):
        if tracker.is_expired():
            continue
            
        top, right, bottom, left = tracker.location
        
        # Determine color
        if tracker.name != "Unknown" and tracker.is_confirmed:
            color = (0, 100, 0)
            thickness = 3
        elif tracker.name != "Unknown":
            color = (0, 191, 255)
            thickness = 2
        else:
            color = (0, 0, 139)
            thickness = 2
            
        cv2.rectangle(frame, (left, top), (right, bottom), color, thickness)
        
        label = tracker.name
        if tracker.confidence_history:
            avg_confidence = np.mean(tracker.confidence_history)
            label += f" ({avg_confidence:.2f})"
        
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
        cv2.putText(frame, label, (left + 6, bottom - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
        
        engagement_data = tracker.get_engagement_data()
        detected_faces.append({
            "id": tracker_id,
            "name": tracker.name,
            "confidence": float(np.mean(tracker.confidence_history)) if tracker.confidence_history else 0.0,
            "is_confirmed": tracker.is_confirmed,
            "engagement_score": float(engagement_data['engagement_score']),
            "engagement_level": str(engagement_data['engagement_level']),
            "is_sleeping": engagement_data['is_sleeping'],
            "is_speaking": engagement_data['is_speaking'],
            "hand_raised": engagement_data['hand_raised']
        })
        
    info_text = f"Frames: {frame_count} | Active Trackers: {len(face_tracker)}"
    cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    _, buffer = cv2.imencode('.jpg', frame)
    frame_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Class engagement
    if detected_faces:
        avg_engagement = float(np.mean([f['engagement_score'] for f in detected_faces]))
        engaged_count = sum(1 for f in detected_faces if f['engagement_level'] == 'engaged')
        present_count = sum(1 for f in detected_faces if f['engagement_level'] == 'present')
        disengaged_count = sum(1 for f in detected_faces if f['engagement_level'] == 'disengaged')
    else:
        avg_engagement = 0.0
        engaged_count = present_count = disengaged_count = 0
    
    return jsonify({
        "status": "success",
        "frame": frame_base64,
        "detected_faces": detected_faces,
        "total_faces": len(detected_faces),
        "class_engagement": {
            "average_score": round(float(avg_engagement), 1),
            "engaged_count": int(engaged_count),
            "present_count": int(present_count),
            "disengaged_count": int(disengaged_count)
        }
    })


@app.route('/api/clear-trackers', methods=['POST'])
def clear_trackers():
    global face_tracker, next_face_id, process_frame_count
    face_tracker.clear()
    next_face_id = 0
    process_frame_count = 0
    return jsonify({"status": "success", "message": "Face trackers cleared"})


@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    global face_tracker, next_face_id, process_frame_count
    try:
        data = request.get_json()
        if not data or 'frame' not in data:
            return jsonify({"status": "error", "message": "No frame data provided"})
        
        process_frame_count += 1
        frame_data = base64.b64decode(data['frame'])
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"status": "error", "message": "Invalid image data"})
        
        try:
            detected_faces_df = DeepFace.extract_faces(
                img_path=frame,
                detector_backend='opencv',
                enforce_detection=False,
                align=False
            )
            
            face_locations = []
            for face_obj in detected_faces_df:
                if face_obj['confidence'] > 0.5:
                    region = face_obj['facial_area']
                    x, y, w, h = region['x'], region['y'], region['w'], region['h']
                    # Full resolution (no 1/4 scaling)
                    face_locations.append((y, x+w, y+h, x))
            
            match_faces_to_trackers(face_locations, frame)
            
            detected_faces = []
            for tracker_id, tracker in list(face_tracker.items()):
                if tracker.is_expired():
                    del face_tracker[tracker_id]
                    continue
                
                top, right, bottom, left = tracker.location
                avg_confidence = np.mean(tracker.confidence_history) if tracker.confidence_history else 0.0
                engagement_data = tracker.get_engagement_data()
                
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
                    },
                    "engagement_score": float(engagement_data['engagement_score']),
                    "engagement_level": str(engagement_data['engagement_level']),
                    "is_sleeping": engagement_data['is_sleeping'],
                    "is_speaking": engagement_data['is_speaking'],
                    "hand_raised": engagement_data['hand_raised']
                })
            
            # Class engagement
            if detected_faces:
                avg_engagement = float(np.mean([f['engagement_score'] for f in detected_faces]))
                engaged_count = sum(1 for f in detected_faces if f['engagement_level'] == 'engaged')
                present_count = sum(1 for f in detected_faces if f['engagement_level'] == 'present')
                disengaged_count = sum(1 for f in detected_faces if f['engagement_level'] == 'disengaged')
            else:
                avg_engagement = 0.0
                engaged_count = present_count = disengaged_count = 0
            
            return jsonify({
                "status": "success",
                "detected_faces": detected_faces,
                "total_faces": len(detected_faces),
                "message": f"Frame #{process_frame_count} processed",
                "class_engagement": {
                    "average_score": round(float(avg_engagement), 1),
                    "engaged_count": int(engaged_count),
                    "present_count": int(present_count),
                    "disengaged_count": int(disengaged_count)
                }
            })
            
        except Exception as e:
            print(f"Face processing error: {e}")
            return jsonify({"status": "error", "message": f"Face processing error: {str(e)}"})
            
    except Exception as e:
        print(f"Frame processing error: {e}")
        return jsonify({"status": "error", "message": f"Frame processing error: {str(e)}"})


@app.route('/api/enroll-face', methods=['POST'])
def enroll_face():
    """
    Enrollment endpoint for student photo upload.
    Accepts base64 image, validates exactly one face, and returns face vector.
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "status": "error",
                "message": "No image data provided"
            }), 400
        
        # Decode base64 image
        try:
            img_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
            img_bytes = base64.b64decode(img_data)
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if img is None:
                return jsonify({
                    "status": "error",
                    "message": "Invalid image format"
                }), 400
                
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Failed to decode image: {str(e)}"
            }), 400
        
        # Detect faces in the image using DeepFace
        try:
            # Use DeepFace to detect faces
            face_objs = DeepFace.extract_faces(
                img_path=img,
                detector_backend='opencv',
                enforce_detection=True,
                align=True
            )
            
            num_faces = len(face_objs)
            
            # Validate exactly one face
            if num_faces == 0:
                return jsonify({
                    "status": "error",
                    "message": "No face detected",
                    "detail": "Please ensure your face is clearly visible in the photo with good lighting."
                }), 400
            elif num_faces > 1:
                return jsonify({
                    "status": "error",
                    "message": "Multiple faces detected",
                    "detail": f"Found {num_faces} faces. Please upload a photo with only your face."
                }), 400
            
            # Extract face vector using DeepFace with ArcFace model
            try:
                embedding_objs = DeepFace.represent(
                    img_path=img,
                    model_name=DEEPFACE_MODEL,
                    detector_backend='opencv',
                    enforce_detection=True,
                    align=True
                )
                
                if not embedding_objs or len(embedding_objs) == 0:
                    return jsonify({
                        "status": "error",
                        "message": "Face unclear",
                        "detail": "Could not extract facial features. Please upload a clearer photo."
                    }), 400
                
                # Get the face vector (embedding)
                face_vector = embedding_objs[0]['embedding']
                
                return jsonify({
                    "status": "success",
                    "message": "Face enrolled successfully",
                    "vector": face_vector,
                    "vector_length": len(face_vector)
                })
                
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": "Face unclear",
                    "detail": f"Could not extract facial features: {str(e)}"
                }), 400
                
        except ValueError as e:
            # DeepFace raises ValueError when no face is detected
            return jsonify({
                "status": "error",
                "message": "No face detected",
                "detail": "Please ensure your face is clearly visible in the photo with good lighting."
            }), 400
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Face detection failed",
                "detail": str(e)
            }), 500
            
    except Exception as e:
        print(f"[ERROR] Enrollment error: {e}")
        return jsonify({
            "status": "error",
            "message": f"Enrollment failed: {str(e)}"
        }), 500


@app.route('/api/debug/status', methods=['GET'])
def debug_status():
    """Return debug information about the service."""
    return jsonify({
        "status": "success",
        "engagement_enabled": ENGAGEMENT_ENABLED,
        "face_mesh_detector": "loaded" if face_mesh_detector else "not loaded",
        "hand_detector": "loaded" if hand_detector else "not loaded",
        "camera_on": camera_on,
        "total_faces_tracked": len(face_tracker),
        "process_frame_count": process_frame_count,
        "ear_threshold": EAR_THRESHOLD,
        "sleep_frames_threshold": SLEEP_FRAMES_THRESHOLD,
        "tracked_faces": {
            str(tracker_id): {
                "name": tracker.name,
                "is_sleeping": tracker.is_sleeping,
                "is_speaking": tracker.is_speaking,
                "sleep_counter": tracker.sleep_counter,
                "speak_counter": tracker.speak_counter,
                "ear_history": tracker.ear_history[-5:] if tracker.ear_history else [],
                "mar_history": tracker.mar_history[-5:] if tracker.mar_history else []
            }
            for tracker_id, tracker in face_tracker.items()
        }
    })


if __name__ == '__main__':
    print("Initializing Facial Recognition Service with DeepFace...")
    
    # Load face vectors from database (new vector-based recognition)
    if supabase:
        print("[INFO] Loading face vectors from database...")
        if load_face_vectors_from_db():
            # Start background refresh thread
            refresh_thread = threading.Thread(target=refresh_vector_cache_background, daemon=True)
            refresh_thread.start()
            print("[OK] Face vector cache loaded and background refresh started")
        else:
            print("[WARN] Failed to load face vectors. Recognition will not work until vectors are loaded.")
    else:
        print("[WARN] Supabase not initialized. Vector-based recognition disabled.")
    
    # Legacy filesystem-based reference data (fallback)
    if not load_reference_data():
        print("[WARN] Could not load filesystem reference data.")
    
    print("Starting Flask service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
