import subprocess
import time
import sys
import os
import requests

def main():
    print("="*60)
    print("🚀 Starting AttendEase Facial Recognition System")
    print("="*60)

    # Data folders
    cwd = os.getcwd()
    print(f"Working Directory: {cwd}")

    # 1. Start Service
    print("\n[1/3] Launching Facial Recognition Service...")
    # We use Popen to run it in parallel (background)
    # Since we are inside the 'python' folder, we call the file directly
    service_process = subprocess.Popen(
        [sys.executable, "facial_recognition_service.py"],
        cwd=cwd
    )
    
    # 2. Wait for Service
    print("[2/3] Waiting for service to initialize...")
    service_url = "http://localhost:5000/api/debug/status"
    connected = False
    
    # Wait loop (up to 60 seconds)
    for i in range(60): 
        try:
            requests.get(service_url, timeout=1)
            connected = True
            print("      ✅ Service is ready!")
            break
        except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout):
            time.sleep(1)
            if i % 2 == 0:
                print(f"      ... waiting ({i+1}s)")
    
    if not connected:
        print("❌ Service failed to start within 60 seconds.")
        print("Check if port 5000 is blocked or if dependecies are missing.")
        service_process.terminate()
        return

    # 3. Start Client
    print("\n[3/3] Launching Camera Client...")
    try:
        # Run client as a blocking call
        subprocess.run([sys.executable, "test_facial_recognition.py"], check=True)
    except KeyboardInterrupt:
        print("\nStopping...")
    except Exception as e:
        print(f"\nError running client: {e}")
    finally:
        # 4. Cleanup when client exits
        print("\nShutting down service...")
        service_process.terminate()
        try:
            service_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            service_process.kill()
        print("✅ System Shutdown Complete.")

if __name__ == "__main__":
    main()
