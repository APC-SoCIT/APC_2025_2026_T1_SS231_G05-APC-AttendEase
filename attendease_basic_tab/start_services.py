#!/usr/bin/env python3
"""
Startup script for AttendEase Facial Recognition System
This script starts both the Express.js server and the Python facial recognition service
"""

import subprocess
import time
import sys
import os
import signal
import threading

# Process storage
processes = []

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print('\n\n🛑 Shutting down services...')
    for process in processes:
        if process.poll() is None:  # If process is still running
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    print('✅ All services stopped.')
    sys.exit(0)

def start_facial_recognition_service():
    """Start the Python facial recognition service"""
    print('🐍 Starting Python Facial Recognition Service...')
    try:
        process = subprocess.Popen([
            sys.executable, 'facial_recognition_service.py'
        ], cwd=os.path.dirname(os.path.abspath(__file__)))
        processes.append(process)
        print('✅ Python service started on port 5000')
        return process
    except Exception as e:
        print(f'❌ Failed to start Python service: {e}')
        return None

def start_express_server():
    """Start the Express.js server"""
    print('🟢 Starting Express.js Server...')
    try:
        # First, install dependencies
        print('📦 Installing Node.js dependencies...')
        install_process = subprocess.run(['npm', 'install'], 
                                       cwd=os.path.dirname(os.path.abspath(__file__)),
                                       check=True)
        
        # Then start the server
        process = subprocess.Popen(['npm', 'start'], 
                                 cwd=os.path.dirname(os.path.abspath(__file__)))
        processes.append(process)
        print('✅ Express server started on port 3333')
        return process
    except Exception as e:
        print(f'❌ Failed to start Express server: {e}')
        return None

def main():
    """Main execution function"""
    print('🚀 AttendEase Facial Recognition System Startup')
    print('=' * 50)
    
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Check if Python dependencies are installed
    print('🔍 Checking Python dependencies...')
    try:
        import flask
        import cv2
        import face_recognition
        print('✅ Python dependencies are available')
    except ImportError as e:
        print(f'❌ Missing Python dependencies: {e}')
        print('📋 Please install dependencies with: pip install -r requirements.txt')
        return
    
    # Start services
    python_service = start_facial_recognition_service()
    if python_service is None:
        print('❌ Failed to start Python service. Exiting.')
        return
    
    # Wait a moment for Python service to start
    time.sleep(3)
    
    express_server = start_express_server()
    if express_server is None:
        print('❌ Failed to start Express server. Stopping Python service.')
        python_service.terminate()
        return
    
    print('\n🎉 Both services are running!')
    print('📱 Access the professor dashboard at: http://localhost:3333/professor')
    print('🐍 Python service API at: http://localhost:5000')
    print('\n⏹️  Press Ctrl+C to stop all services')
    
    # Wait for processes to finish or be interrupted
    try:
        while True:
            time.sleep(1)
            # Check if any process has died
            for process in processes:
                if process.poll() is not None:
                    print(f'⚠️  A service has stopped unexpectedly')
                    signal_handler(None, None)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == '__main__':
    main()
