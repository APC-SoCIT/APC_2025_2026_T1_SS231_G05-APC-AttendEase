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
import glob
import pickle
from collections import Counter
from supabase import create_client, Client
from dotenv import load_dotenv
import threading

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.localConfigs')
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
    print("[WARN] Supabase credentials not found in .localConfigs")


def parse_face_vector(raw):
    """Parse a face vector from Supabase into a numpy array.
    
    Handles multiple formats returned by the supabase-py client depending
    on column type (pgvector ``vector``, ``jsonb``, ``text``):
      - Python list   -> direct conversion
      - numpy array   -> pass through
      - string "[0.1,0.2,...]" -> json.loads then convert
      - None / empty  -> returns None
    """
    import json
    if raw is None:
        return None
    if isinstance(raw, np.ndarray):
        return raw if raw.size > 0 else None
    if isinstance(raw, list):
        return np.array(raw, dtype=np.float64) if len(raw) > 0 else None
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                return np.array(parsed, dtype=np.float64)
        except (json.JSONDecodeError, ValueError):
            pass
        return None
    # Unknown type – try converting directly
    try:
        arr = np.array(raw, dtype=np.float64)
        return arr if arr.size > 0 else None
    except Exception:
        return None


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
            logged_first = False
            for record in response.data:
                student_id = record['student_id']
                raw_vector = record['face_profile']
                
                # Diagnostic: log the type and preview of the first vector
                if not logged_first:
                    preview = str(raw_vector)[:120] if raw_vector else 'None'
                    print(f"[VectorDebug] First record face_profile type={type(raw_vector).__name__}, preview={preview}")
                    logged_first = True
                
                # Get student name from joined data
                if record.get('user_profiles'):
                    first_name = record['user_profiles'].get('first_name', '')
                    last_name = record['user_profiles'].get('last_name', '')
                    student_number = record['user_profiles'].get('student_number', '')
                    name = f"{first_name} {last_name}".strip()
                else:
                    name = "Unknown"
                    student_number = None
                
                face_vector = parse_face_vector(raw_vector)
                if face_vector is not None:
                    new_cache[student_id] = {
                        'vector': face_vector,
                        'name': name,
                        'student_number': student_number
                    }
                else:
                    print(f"[VectorDebug] Skipped student {student_id} ({name}): vector could not be parsed")
            
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
    global identify_call_count
    try:
        identify_call_count += 1
        _flog(f"[IDENTIFY] call={identify_call_count} cache={len(face_vectors_cache)}")

        if face_image_bgr is None or face_image_bgr.size == 0:
            _flog(f"[IDENTIFY] call={identify_call_count} EARLY_EXIT=empty_crop")
            return "Unknown", 0.0

        if face_image_bgr.shape[0] < 20 or face_image_bgr.shape[1] < 20:
            _flog(f"[IDENTIFY] call={identify_call_count} EARLY_EXIT=tiny_crop shape={face_image_bgr.shape[:2]}")
            return "Unknown", 0.0

        # Vector-only recognition path (filesystem fallback intentionally disabled).
        if not face_vectors_cache:
            _flog(f"[IDENTIFY] call={identify_call_count} EARLY_EXIT=no_vectors")
            return "Unknown", 0.0

        # Prefer OpenCV backend for parity with enrollment (align=True),
        # then fall back to skip backend when detection on crop fails.
        face_vector = None
        used_backend = None
        last_error = None

        for backend in ("opencv", "skip"):
            try:
                embedding_objs = DeepFace.represent(
                    img_path=face_image_bgr,
                    model_name=DEEPFACE_MODEL,
                    detector_backend=backend,
                    enforce_detection=False,
                    align=True
                )
                if embedding_objs and len(embedding_objs) > 0:
                    face_vector = np.array(embedding_objs[0]['embedding'], dtype=np.float64)
                    used_backend = backend
                    break
            except Exception as e:
                last_error = str(e)

        if face_vector is None:
            if should_trace:
                sys.stderr.write(f"[IdentifyTrace] Embedding extraction failed for both backends (last_error={last_error})\n")
            return "Unknown", 0.0

        best_match_name = "Unknown"
        best_similarity = 0.0
        best_student_id = None
        skipped_shape_mismatch = 0

        for student_id, data in face_vectors_cache.items():
            cached_vector = data['vector']
            if face_vector.shape != cached_vector.shape:
                skipped_shape_mismatch += 1
                continue
            similarity = cosine_similarity(face_vector, cached_vector)

            if similarity > best_similarity:
                best_similarity = similarity
                best_match_name = data['name']
                best_student_id = student_id

        # File-based log (guaranteed to work regardless of stdout/stderr issues)
        _flog(
            f"[SIM] call={identify_call_count} best={best_match_name} "
            f"sim={best_similarity:.4f} thresh={VECTOR_SIMILARITY_THRESHOLD:.2f} "
            f"backend={used_backend} cache={len(face_vectors_cache)} "
            f"shape_skip={skipped_shape_mismatch} vec_dim={face_vector.shape}"
        )

        similarity_threshold = VECTOR_SIMILARITY_THRESHOLD
        
        if best_similarity < similarity_threshold:
            return "Unknown", 0.0

        # Map similarity (threshold-1.0) to confidence (0-1)
        confidence = min(1.0, (best_similarity - similarity_threshold) / (1.0 - similarity_threshold))

        if confidence < MIN_CONFIDENCE:
            return "Unknown", 0.0

        return best_match_name, confidence

    except Exception as e:
        sys.stderr.write(f"[IdentifyTrace] ERROR: {str(e)}\n")
        sys.stderr.flush()
        return "Unknown", 0.0


def refresh_vector_cache_background():
    """Background thread to refresh face vector cache every 2 minutes."""
    while True:
        time.sleep(120)  # 2 minutes
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
            num_hands=2,  # Limit to 2 hands for speed
            min_hand_detection_confidence=0.2,  # Lower threshold for 320x240
            min_hand_presence_confidence=0.1,  # Lower threshold to detect presence
            min_tracking_confidence=0.2  # Lower threshold for tracking
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
match_cycle_count = 0
identify_call_count = 0

# File-based debug log (bypasses all stdout/stderr/WSGI capture issues)
_DEBUG_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'debug_trace.log')
def _flog(msg):
    """Append one line to file-based debug log."""
    try:
        with open(_DEBUG_LOG_PATH, 'a', encoding='utf-8') as f:
            f.write(f"{time.time():.2f} {msg}\n")
    except Exception:
        pass

_flog("=== PYTHON SERVICE STARTED ===")

# Configuration - DeepFace
PHOTOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
DEEPFACE_MODEL = "ArcFace"  # Best accuracy
DISTANCE_THRESHOLD = 0.50   # Stricter threshold for ArcFace (default is 0.68, lower = stricter)
MIN_CONFIDENCE = 0.35       # Minimum confidence to accept a match (below this = Unknown)
VECTOR_SIMILARITY_THRESHOLD = float(os.getenv('VECTOR_SIMILARITY_THRESHOLD', '0.35'))  # Runtime threshold for DB vector matching
TRACE_LOG_INTERVAL = 30     # Log every N frames/calls (plus first few warmup calls)

# Tracking Configuration
TRACKING_FRAMES = 15
FACE_DISTANCE_THRESHOLD = 360  # Prevent duplicate trackers during fast motion
TRACKER_MERGE_THRESHOLD = 180  # Merge trackers within this distance with same name
LOCATION_SMOOTHING_FACTOR = 0.4
SMOOTHING_DISTANCE_THRESHOLD = 120
MAX_TRACKING_VELOCITY = 50
PREDICTION_DECAY = 0.65
RAPID_MOVEMENT_THRESHOLD = 60

# Engagement Configuration (Behavioral) - Adjusted for 10 FPS
ENGAGEMENT_ANALYSIS_INTERVAL = 3  # Analyze every 3rd frame to reduce MediaPipe cost
ENGAGEMENT_HISTORY_SIZE = 30
EAR_THRESHOLD = 0.20        # Eye Aspect Ratio threshold (closing eyes) - lowered for testing
MAR_THRESHOLD = 0.25        # Mouth Aspect Ratio threshold (opening mouth) - more sensitive
SLEEP_FRAMES_THRESHOLD = 20 # ~2 seconds at 10 FPS for testing (was 15 = 1.5 seconds)
SPEAK_FRAMES_THRESHOLD = 5  # ~0.5 seconds at 10 FPS (requires sustained mouth open)
HAND_RAISE_FRAMES_THRESHOLD = 2  # Need 2+ consecutive frames to confirm hand raised
HAND_DECAY_MISS_FRAMES = 2  # Require consecutive misses before lowering hand counter
MIN_FACE_SIZE = 40  # Minimum face width/height in pixels to filter false detections
HAND_HORIZONTAL_FACTOR = 1.1
HAND_HORIZONTAL_MIN = 0.12
HAND_HORIZONTAL_MAX = 0.45
HAND_POINTS_ABOVE_FACE_MIDLINE_RATIO = 0.35
HAND_VERTICAL_MARGIN = 0.04
HAND_DEBUG_LOG_INTERVAL = 20
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
        self.hand_raise_counter = 0
        self.hand_miss_streak = 0
        self.raw_hand_detected = False
        self.matched_hand_points = 0
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

    def update_behavior(self, ear, mar, hand_raised_detected, matched_hand_points=0):
        self.raw_hand_detected = bool(hand_raised_detected)
        self.matched_hand_points = int(matched_hand_points)

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

        # Hand Raise Logic (smoothed with counter like sleep/speak)
        if hand_raised_detected:
            self.hand_raise_counter = min(self.hand_raise_counter + 1, HAND_RAISE_FRAMES_THRESHOLD + 6)
            self.hand_miss_streak = 0
        else:
            self.hand_miss_streak += 1
            if self.hand_miss_streak >= HAND_DECAY_MISS_FRAMES:
                self.hand_raise_counter = max(0, self.hand_raise_counter - 1)
                self.hand_miss_streak = 0
        self.hand_raised = self.hand_raise_counter >= HAND_RAISE_FRAMES_THRESHOLD
        
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
            "hand_raised": self.hand_raised,
            "hand_raise_counter": int(self.hand_raise_counter),
            "raw_hand_detected": bool(self.raw_hand_detected),
            "matched_hand_points": int(self.matched_hand_points)
        }


# Debug counter for logging frequency
_behavior_debug_counter = 0
_hand_debug_counter = 0

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
                
                # Debug logging (reduced frequency to avoid I/O overhead)
                _behavior_debug_counter += 1
                if _behavior_debug_counter % 30 == 0:
                    eyes_status = "CLOSED" if ear < EAR_THRESHOLD else "open"
                    mouth_status = "OPEN" if mar > MAR_THRESHOLD else "closed"
                    print(f"[Engagement] EAR={ear:.3f} ({eyes_status}), MAR={mar:.3f} ({mouth_status})")
                
                return ear, mar
            
    except Exception as e:
        pass  # Silently handle errors to avoid log spam
    
    return None, None


def load_reference_data():
    """Verify photos directory exists and pre-build DeepFace representations."""
    global PHOTOS_DIR
    
    print(f"Initializing DeepFace with {DEEPFACE_MODEL} model...")
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
    
    # Remove corrupted DeepFace cache files before pre-build.
    cache_files = glob.glob(os.path.join(PHOTOS_DIR, "ds_model_*.pkl"))
    for cache_file in cache_files:
        try:
            with open(cache_file, "rb") as f:
                pickle.load(f)
        except Exception as e:
            print(f"   Removing corrupted cache {os.path.basename(cache_file)}: {e}")
            try:
                os.remove(cache_file)
            except Exception as remove_err:
                print(f"   Warning: could not remove {cache_file}: {remove_err}")

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


def suppress_overlapping_faces(face_locations, iou_threshold=0.45):
    """Remove overlapping bounding boxes via IoU-based Non-Maximum Suppression.
    
    Keeps the larger box when two detections overlap above `iou_threshold`.
    face_locations: list of (top, right, bottom, left) tuples.
    Returns a deduplicated list in the same format.
    """
    if len(face_locations) <= 1:
        return face_locations

    # Sort by box area descending so larger boxes are preferred
    sorted_locs = sorted(face_locations, key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]), reverse=True)
    keep = []

    for loc in sorted_locs:
        top, right, bottom, left = loc
        is_duplicate = False
        for kept in keep:
            k_top, k_right, k_bottom, k_left = kept
            # Intersection
            inter_top = max(top, k_top)
            inter_left = max(left, k_left)
            inter_bottom = min(bottom, k_bottom)
            inter_right = min(right, k_right)
            inter_w = max(0, inter_right - inter_left)
            inter_h = max(0, inter_bottom - inter_top)
            inter_area = inter_w * inter_h
            # Union
            area1 = (bottom - top) * (right - left)
            area2 = (k_bottom - k_top) * (k_right - k_left)
            union_area = area1 + area2 - inter_area
            if union_area > 0 and inter_area / union_area >= iou_threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            keep.append(loc)

    return keep


def merge_duplicate_trackers():
    """Merge duplicate trackers with the same name that are close to each other.
    
    Also merges Unknown-to-Unknown pairs when they are very close (tighter threshold)
    to clean up duplicate detections of the same unidentified face.
    """
    global face_tracker
    
    UNKNOWN_MERGE_THRESHOLD = TRACKER_MERGE_THRESHOLD * 0.6
    
    tracker_ids = list(face_tracker.keys())
    merged_ids = set()
    
    for i, tracker_id_1 in enumerate(tracker_ids):
        if tracker_id_1 in merged_ids:
            continue
            
        tracker_1 = face_tracker.get(tracker_id_1)
        if not tracker_1:
            continue
        
        for tracker_id_2 in tracker_ids[i+1:]:
            if tracker_id_2 in merged_ids:
                continue
                
            tracker_2 = face_tracker.get(tracker_id_2)
            if not tracker_2:
                continue
            
            # Decide whether these two trackers should be compared
            same_named = (tracker_1.name == tracker_2.name and tracker_1.name != "Unknown")
            both_unknown = (tracker_1.name == "Unknown" and tracker_2.name == "Unknown")
            
            if not same_named and not both_unknown:
                continue
            
            distance = calculate_distance(tracker_1.location, tracker_2.location)
            threshold = TRACKER_MERGE_THRESHOLD if same_named else UNKNOWN_MERGE_THRESHOLD
            
            if distance < threshold:
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
    global face_tracker, next_face_id, _hand_debug_counter, match_cycle_count
    match_cycle_count += 1
    should_trace_match = (match_cycle_count <= 5 or match_cycle_count % TRACE_LOG_INTERVAL == 0)
    if should_trace_match:
        print(
            f"[FrameTrace][Matcher] cycle={match_cycle_count} "
            f"face_locations={len(face_locations)} trackers={len(face_tracker)}",
            flush=True
        )
    
    # NOTE: face_locations are already in full scale (no downscaling in this version)
    
    # 1. Detect hands and build robust hand regions from multiple landmarks
    detected_hands = []
    try:
        if hand_detector:
            rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            hand_results = hand_detector.detect(mp_image)

            if hand_results.hand_landmarks:
                for hand_landmarks in hand_results.hand_landmarks:
                    xs = [max(0.0, min(1.0, p.x)) for p in hand_landmarks]
                    ys = [max(0.0, min(1.0, p.y)) for p in hand_landmarks]
                    if not xs or not ys:
                        continue

                    detected_hands.append({
                        "xs": xs,
                        "ys": ys,
                        "center_x": float(sum(xs) / len(xs)),
                        "center_y": float(sum(ys) / len(ys)),
                        "top_y": float(min(ys)),
                        "left_x": float(min(xs)),
                        "right_x": float(max(xs))
                    })
    except Exception as e:
        print(f"[ERROR] Hand detection error: {e}")

    _hand_debug_counter += 1
    should_log_hand_debug = (_hand_debug_counter % HAND_DEBUG_LOG_INTERVAL == 0)
    if should_log_hand_debug:
        print(f"[HandDebug] detected_hands={len(detected_hands)}")

    h, w = frame_bgr.shape[:2]

    def evaluate_hand_for_face(location, face_id):
        top, right, bottom, left = location

        face_center_x_norm = ((left + right) / 2) / w
        face_top_norm = top / h
        face_bottom_norm = bottom / h
        face_mid_y_norm = (face_top_norm + face_bottom_norm) / 2.0
        face_width_norm = max(0.05, (right - left) / w)
        horizontal_threshold = min(
            HAND_HORIZONTAL_MAX,
            max(HAND_HORIZONTAL_MIN, face_width_norm * HAND_HORIZONTAL_FACTOR)
        )

        best_distance = float("inf")
        best_points_above_midline = 0
        horizontal_rejects = 0
        vertical_rejects = 0

        for hand in detected_hands:
            x_distance = abs(hand["center_x"] - face_center_x_norm)
            if x_distance > horizontal_threshold:
                horizontal_rejects += 1
                continue

            points_above_midline = sum(1 for py in hand["ys"] if py < (face_mid_y_norm + HAND_VERTICAL_MARGIN))
            points_ratio = points_above_midline / len(hand["ys"])
            vertical_ok = (
                hand["top_y"] < (face_mid_y_norm + HAND_VERTICAL_MARGIN) or
                points_ratio >= HAND_POINTS_ABOVE_FACE_MIDLINE_RATIO
            )

            if not vertical_ok:
                vertical_rejects += 1
                continue

            if x_distance < best_distance:
                best_distance = x_distance
                best_points_above_midline = points_above_midline

        has_raised_hand = best_distance != float("inf")

        if should_log_hand_debug:
            print(
                f"[HandDebug][Face {face_id}] matched={has_raised_hand} "
                f"hands={len(detected_hands)} x_rejects={horizontal_rejects} "
                f"y_rejects={vertical_rejects} points_above_mid={best_points_above_midline}"
            )

        return has_raised_hand, best_points_above_midline

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
                has_raised_hand, matched_points = evaluate_hand_for_face(location, tracker.id)
                ear, mar = analyze_face_behavior(face_crop)
                tracker.update_behavior(ear, mar, has_raised_hand, matched_points)
            
            # Re-identify (reduced frequency for stability and speed)
            if tracker.name == "Unknown":
                should_identify = (tracker.identification_count % 15 == 0)  # ~1.5s at 10 FPS
            else:
                should_identify = (tracker.identification_count % 60 == 0)  # ~6s at 10 FPS

            if should_trace_match and tracker.name == "Unknown":
                print(
                    f"[FrameTrace][Matcher] tracker={best_tracker} unknown "
                    f"id_count={tracker.identification_count} should_identify={should_identify}"
                )
            
            if should_identify:
                crop_shape = face_crop.shape[:2] if face_crop is not None and face_crop.size > 0 else "empty"
                _flog(f"[REIDENTIFY] tracker={best_tracker} name={tracker.name} id_count={tracker.identification_count} crop={crop_shape}")
                name, confidence = identify_face_from_vector(face_crop)
                _flog(f"[REIDENTIFY] result name={name} confidence={confidence:.4f}")
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
    
    # Deduplicate new_detections: if two unmatched faces are very close,
    # keep only the larger one to avoid creating duplicate trackers.
    if len(new_detections) > 1:
        dedup_threshold = FACE_DISTANCE_THRESHOLD * 0.4
        keep_new = []
        for loc, idx in sorted(new_detections,
                                key=lambda item: (item[0][2] - item[0][0]) * (item[0][1] - item[0][3]),
                                reverse=True):
            is_dup = False
            for kept_loc, _ in keep_new:
                if calculate_distance(loc, kept_loc) < dedup_threshold:
                    is_dup = True
                    break
            if not is_dup:
                keep_new.append((loc, idx))
        new_detections = keep_new

    if should_trace_match:
        print(
            f"[FrameTrace][Matcher] matched={len(matched_trackers)} "
            f"new={len(new_detections)}"
        )

    # Create new trackers
    for location, idx in new_detections:
        top, right, bottom, left = location
        
        top_safe = max(0, min(top, h-1))
        bottom_safe = max(0, min(bottom, h))
        left_safe = max(0, min(left, w-1))
        right_safe = max(0, min(right, w))
        
        face_crop = frame_bgr[top_safe:bottom_safe, left_safe:right_safe]
        _flog(f"[NEW_TRACKER] idx={idx} crop={face_crop.shape[:2] if face_crop is not None and face_crop.size > 0 else 'empty'} next_id={next_face_id}")
        
        name, confidence = identify_face_from_vector(face_crop)
        _flog(f"[NEW_TRACKER] result name={name} confidence={confidence:.4f}")
        
        tracker = FaceTracker(next_face_id, name, location)
        if confidence > 0:
            tracker.update_location(location, confidence)
            
        # Initial behavior analysis
        has_raised_hand, matched_points = evaluate_hand_for_face(location, next_face_id)
        ear, mar = analyze_face_behavior(face_crop)
        tracker.update_behavior(ear, mar, has_raised_hand, matched_points)
        
        face_tracker[next_face_id] = tracker
        next_face_id += 1
    
    # Handle missed trackers
    for tracker_id in list(face_tracker.keys()):
        if tracker_id not in matched_trackers:
            face_tracker[tracker_id].increment_missed_frames()
            if face_tracker[tracker_id].is_expired():
                del face_tracker[tracker_id]
    
    merge_duplicate_trackers()

    return len(detected_hands)


@app.route('/api/camera/list', methods=['GET'])
def list_cameras():
    """List all available cameras with timeout protection."""
    available_cameras = []
    camera_timeout = 0.5  # 500ms timeout per camera
    
    for i in range(10):
        try:
            start_time = time.time()
            cap = cv2.VideoCapture(i)
            
            # Set a short timeout for camera operations
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, camera_timeout * 1000)
            
            if cap.isOpened():
                # Try to read a frame with timeout
                ret = False
                frame = None
                try:
                    # Use a quick read attempt
                    ret, frame = cap.read()
                    elapsed = time.time() - start_time
                    
                    # If read took too long, skip this camera
                    if elapsed > camera_timeout:
                        cap.release()
                        continue
                        
                except Exception as e:
                    cap.release()
                    continue
                
                if ret and frame is not None:
                    available_cameras.append({
                        "index": i,
                        "name": f"Camera {i}",
                        "description": f"Camera device at index {i}"
                    })
                cap.release()
            else:
                # If camera didn't open quickly, skip it
                elapsed = time.time() - start_time
                if elapsed > camera_timeout:
                    continue
                    
        except Exception as e:
            # Silently continue on any error
            continue
    
    return jsonify({
        "status": "success" if available_cameras else "no_cameras",
        "cameras": available_cameras,
        "message": f"Found {len(available_cameras)} camera(s)" if available_cameras else "No cameras detected"
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint that doesn't enumerate cameras."""
    return jsonify({
        "status": "available",
        "message": "Service is running",
        "engagement_enabled": ENGAGEMENT_ENABLED
    })

@app.route('/api/camera/status', methods=['GET'])
def camera_status():
    """Check camera status - uses health check for speed, optionally enumerates cameras."""
    try:
        # Return available immediately without enumerating cameras
        # Camera enumeration is slow and not needed for status check
        return jsonify({
            "status": "available",
            "message": "Service is running (camera enumeration skipped for speed)"
        })
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
    hand_count = 0
    
    if frame_count % 2 == 0:  # Process every 2nd frame for better responsiveness
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
                    # Filter out tiny false-positive detections
                    if w < MIN_FACE_SIZE or h < MIN_FACE_SIZE:
                        continue
                    # Use full coordinates directly
                    face_locations.append((y, x+w, y+h, x))
            
            face_locations = suppress_overlapping_faces(face_locations)
            hand_count = match_faces_to_trackers(face_locations, frame)
        except Exception as e:
            hand_count = 0
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
            "hand_raised": engagement_data['hand_raised'],
            "hand_raise_counter": int(engagement_data['hand_raise_counter']),
            "raw_hand_detected": bool(engagement_data['raw_hand_detected']),
            "matched_hand_points": int(engagement_data['matched_hand_points'])
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
        "hand_count": hand_count,
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


@app.route('/api/refresh-vectors', methods=['POST'])
def refresh_vectors():
    """Reload face vector cache from Supabase immediately.
    
    Called by the Express backend after a student enrolment so that the
    newly-uploaded face is recognised on the very next frame cycle.
    """
    if not supabase:
        return jsonify({"status": "error", "message": "Supabase not initialized"}), 503

    success = load_face_vectors_from_db()
    if success:
        return jsonify({
            "status": "success",
            "message": f"Face vector cache refreshed ({len(face_vectors_cache)} vectors loaded)",
            "cache_size": len(face_vectors_cache)
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to refresh face vector cache"
        }), 500


@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    global face_tracker, next_face_id, process_frame_count
    try:
        data = request.get_json()
        if not data or 'frame' not in data:
            return jsonify({"status": "error", "message": "No frame data provided"})
        
        process_frame_count += 1
        should_trace_frame = (process_frame_count <= 5 or process_frame_count % TRACE_LOG_INTERVAL == 0)
        frame_data = base64.b64decode(data['frame'])
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"status": "error", "message": "Invalid image data"})

        if should_trace_frame:
            _flog(
                f"[FRAME] #{process_frame_count} frame={frame.shape[1]}x{frame.shape[0]} "
                f"trackers={len(face_tracker)} vectors={len(face_vectors_cache)}"
            )
        
        # Safety net: downscale if frontend somehow sends a larger-than-expected frame
        # Accept up to 854x480 (16:9 widescreen) without resizing
        MAX_FRAME_W, MAX_FRAME_H = 854, 480
        if frame.shape[1] > MAX_FRAME_W or frame.shape[0] > MAX_FRAME_H:
            # Preserve aspect ratio while fitting within the max dimensions
            scale = min(MAX_FRAME_W / frame.shape[1], MAX_FRAME_H / frame.shape[0])
            new_w = int(frame.shape[1] * scale)
            new_h = int(frame.shape[0] * scale)
            print(f"[WARN] Received oversized frame ({frame.shape[1]}x{frame.shape[0]}), downscaling to {new_w}x{new_h}")
            frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Skip-frame optimisation: only run expensive face detection every 3rd frame.
        # On intermediate frames, reuse existing tracker positions and just
        # increment missed-frames / run engagement on cached crops.
        DETECTION_SKIP = 3
        run_detection = (process_frame_count % DETECTION_SKIP == 1) or len(face_tracker) == 0

        try:
            if run_detection:
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
                        # Filter out tiny false-positive detections
                        if w < MIN_FACE_SIZE or h < MIN_FACE_SIZE:
                            continue
                        face_locations.append((y, x+w, y+h, x))
                
                face_locations = suppress_overlapping_faces(face_locations)
                if should_trace_frame:
                    sys.stderr.write(
                        f"[FrameTrace][Python] raw_detected={len(detected_faces_df)} "
                        f"filtered_faces={len(face_locations)}\n"
                    )
                    sys.stderr.flush()
                hand_count = match_faces_to_trackers(face_locations, frame)
            else:
                # Intermediate frame: skip detection, just tick existing trackers
                hand_count = 0
                for tracker_id in list(face_tracker.keys()):
                    tracker = face_tracker[tracker_id]
                    tracker.increment_missed_frames()
                    if tracker.is_expired():
                        del face_tracker[tracker_id]
            if should_trace_frame:
                sys.stderr.write(
                    f"[FrameTrace][Python] post_match trackers={len(face_tracker)} "
                    f"hands={hand_count}\n"
                )
                sys.stderr.flush()
            
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
                    "hand_raised": engagement_data['hand_raised'],
                    "hand_raise_counter": int(engagement_data['hand_raise_counter']),
                    "raw_hand_detected": bool(engagement_data['raw_hand_detected']),
                    "matched_hand_points": int(engagement_data['matched_hand_points'])
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
                "hand_count": hand_count,
                "message": f"Frame #{process_frame_count} processed",
                "class_engagement": {
                    "average_score": round(float(avg_engagement), 1),
                    "engaged_count": int(engaged_count),
                    "present_count": int(present_count),
                    "disengaged_count": int(disengaged_count)
                },
                "_debug": {
                    "frame_num": process_frame_count,
                    "identify_calls": identify_call_count,
                    "vectors_cached": len(face_vectors_cache)
                }
            })
            
        except Exception as e:
            sys.stderr.write(f"[ERROR] Face processing error: {e}\n")
            sys.stderr.flush()
            return jsonify({"status": "error", "message": f"Face processing error: {str(e)}"})
            
    except Exception as e:
        sys.stderr.write(f"[ERROR] Frame processing error: {e}\n")
        sys.stderr.flush()
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
                "hand_raised": tracker.hand_raised,
                "raw_hand_detected": tracker.raw_hand_detected,
                "matched_hand_points": tracker.matched_hand_points,
                "hand_raise_counter": tracker.hand_raise_counter,
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
    
    # Legacy filesystem-based reference data (fallback) – disabled for testing
    # To re-enable, uncomment the two lines below:
    # if not load_reference_data():
    #     print("[WARN] Could not load filesystem reference data.")
    
    print(
        f"[FrameTrace][Startup] vectors_loaded={len(face_vectors_cache)} "
        f"similarity_threshold={VECTOR_SIMILARITY_THRESHOLD:.2f}"
    )

    print("Starting Flask service on port 5000...")
    # CRITICAL: threaded=False prevents concurrent request handling that causes
    # race conditions with shared state (face_tracker, next_face_id) when
    # DeepFace.represent() blocks for several seconds during identification.
    # Without this, every frame sees trackers=0 and spawns a new identification
    # call that never completes before the response is sent.
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False, threaded=False)
