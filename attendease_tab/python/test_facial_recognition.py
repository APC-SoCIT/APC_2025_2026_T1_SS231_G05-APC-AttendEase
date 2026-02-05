#!/usr/bin/env python
"""
Standalone test script for facial_recognition_service.py
This script tests the facial recognition service with your webcam.
"""

import cv2
import base64
import requests
import time
import json
import threading
from queue import Queue

# Configuration
SERVICE_URL = "http://localhost:5000"
CAMERA_INDEX = 0  # Change this if you have multiple cameras

# Global variables for async processing
latest_faces = []
latest_hand_count = 0
latest_class_engagement = {}
processing_lock = threading.Lock()
frame_queue = Queue(maxsize=2)

def test_camera_list():
    """Test listing available cameras."""
    print("\n=== Testing Camera List ===")
    try:
        response = requests.get(f"{SERVICE_URL}/api/camera/list")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data['cameras'])} camera(s)")
            for camera in data['cameras']:
                print(f"   - {camera['name']}: {camera['description']}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to facial recognition service.")
        print("   Make sure facial_recognition_service.py is running on port 5000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_debug_status():
    """Test debug status endpoint."""
    print("\n=== Testing Debug Status ===")
    try:
        response = requests.get(f"{SERVICE_URL}/api/debug/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service Status:")
            print(f"   - Engagement Enabled: {data['engagement_enabled']}")
            print(f"   - Face Mesh Detector: {data['face_mesh_detector']}")
            print(f"   - Hand Detector: {data['hand_detector']}")
            print(f"   - Camera On: {data['camera_on']}")
            print(f"   - Tracked Faces: {data['total_faces_tracked']}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def process_frame_worker():
    """Background worker thread that processes frames from the queue."""
    global latest_faces, latest_hand_count, latest_class_engagement
    
    while True:
        frame = None
        try:
            # Get frame from queue (blocking)
            frame = frame_queue.get(timeout=1.0)
            
            if frame is None:  # Poison pill to stop thread
                frame_queue.task_done()
                break
            
            # Encode frame to base64
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Send to service
            response = requests.post(
                f"{SERVICE_URL}/api/process-frame",
                json={"frame": frame_base64},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Update global state with lock
                with processing_lock:
                    latest_faces = data.get('detected_faces', [])
                    latest_hand_count = data.get('hand_count', 0)
                    latest_class_engagement = data.get('class_engagement', {})
            
            # Mark task as done only if we got a frame
            frame_queue.task_done()
                    
        except Exception as e:
            # Only call task_done if we actually got a frame
            if frame is not None:
                try:
                    frame_queue.task_done()
                except:
                    pass

def test_process_frame():
    """Test processing frames from webcam with async processing for smooth display."""
    global latest_faces, latest_class_engagement
    
    print("\n=== Testing Frame Processing (Async Mode) ===")
    print("Opening webcam... (Press 'q' to quit)")
    
    # Open webcam
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print(f"❌ Cannot open camera at index {CAMERA_INDEX}")
        return False
    
    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    print("✅ Webcam opened successfully")
    print("Processing frames asynchronously... Press 'q' to stop")
    print("📊 Video displays at full FPS while AI processes in background")
    
    # Start background processing thread
    worker_thread = threading.Thread(target=process_frame_worker, daemon=True)
    worker_thread.start()
    
    frame_count = 0
    display_frame_count = 0
    start_time = time.time()
    last_send_time = 0
    send_interval = 0.3  # Send frame every 0.3 seconds for better responsiveness
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Cannot read frame from camera")
                break
            
            frame_count += 1
            display_frame_count += 1
            current_time = time.time()
            
            # Send frame to processing queue at intervals
            if current_time - last_send_time >= send_interval:
                if not frame_queue.full():
                    # Sending FULL 640x480 frame for best Hand Detection accuracy
                    # SFace model is fast enough to handle this!
                    frame_queue.put(frame.copy())
                    last_send_time = current_time
            
            # Draw bounding boxes from latest results with lock
            with processing_lock:
                faces_to_draw = latest_faces.copy()
                hand_count_to_show = latest_hand_count
                engagement_to_show = latest_class_engagement.copy()
            
            for face in faces_to_draw:
                loc = face['location']
                
                # No scaling needed (640x480)
                left = loc['left']
                top = loc['top']
                right = loc['right']
                bottom = loc['bottom']

                name = face['name']
                confidence = face['confidence']
                
                # Color based on identification
                if name != "Unknown" and face['is_confirmed']:
                    color = (0, 255, 0)  # Green for confirmed
                elif name != "Unknown":
                    color = (0, 191, 255)  # Orange for pending
                else:
                    color = (0, 0, 255)  # Red for unknown
                
                # Draw rectangle
                cv2.rectangle(frame, 
                            (left, top), 
                            (right, bottom), 
                            color, 2)
                
                # Create label
                label = f"{name}"
                if confidence > 0:
                    label += f" ({confidence:.2f})"
                
                # Add engagement status
                status_icons = []
                if face['is_sleeping']:
                    status_icons.append("😴")
                if face['is_speaking']:
                    status_icons.append("🗣️")
                if face['hand_raised']:
                    status_icons.append("✋")
                
                # Draw label background
                cv2.rectangle(frame, 
                            (left, bottom - 35), 
                            (right, bottom), 
                            color, cv2.FILLED)
                
                # Draw label text
                cv2.putText(frame, label, 
                          (left + 6, bottom - 6),
                          cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
                
                # Draw engagement status icons
                if status_icons:
                    status_text = " ".join(status_icons)
                    cv2.putText(frame, status_text,
                              (left, top - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Display stats
            stats_text = f"Display FPS: Processing | Faces: {len(faces_to_draw)}"
            cv2.putText(frame, stats_text, (10, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Show Hand Indicator
            # Show Hand Indicator
            if hand_count_to_show > 0:
                 # Red, Large Text, Lower down to avoid overlap
                 cv2.putText(frame, "HAND DETECTED!", (10, 150),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
            
            # Display class engagement
            if engagement_to_show:
                engagement_text = f"Avg: {engagement_to_show.get('average_score', 0)}% | "
                engagement_text += f"Engaged: {engagement_to_show.get('engaged_count', 0)} | "
                engagement_text += f"Present: {engagement_to_show.get('present_count', 0)} | "
                engagement_text += f"Disengaged: {engagement_to_show.get('disengaged_count', 0)}"
                cv2.putText(frame, engagement_text, (10, 60),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # Calculate and display FPS
            elapsed = time.time() - start_time
            display_fps = display_frame_count / elapsed if elapsed > 0 else 0
            fps_text = f"Display FPS: {display_fps:.1f}"
            cv2.putText(frame, fps_text, (10, frame.shape[0] - 10),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Display the frame
            cv2.imshow('Facial Recognition Test - Async Mode', frame)
            
            # Check for 'q' or ESC key to quit
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:  # 'q' or ESC
                print("\nStopping...")
                break
                
    finally:
        # Stop worker thread
        frame_queue.put(None)  # Poison pill
        worker_thread.join(timeout=2.0)
        
        cap.release()
        cv2.destroyAllWindows()
        
        elapsed = time.time() - start_time
        print(f"\n✅ Displayed {display_frame_count} frames in {elapsed:.1f} seconds")
        print(f"   Average Display FPS: {display_fps:.1f}")
        print(f"   Sent {frame_count} frames for processing")
    
    return True

def main():
    """Main test function."""
    print("=" * 60)
    print("Facial Recognition Service - Standalone Test")
    print("=" * 60)
    
    # Test 1: Check if service is running
    if not test_camera_list():
        print("\n❌ Service is not running. Please start facial_recognition_service.py first:")
        print("   python facial_recognition_service.py")
        return
    
    # Test 2: Check debug status
    test_debug_status()
    
    # Test 3: Process frames
    input("\nPress Enter to start webcam test...")
    test_process_frame()
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
