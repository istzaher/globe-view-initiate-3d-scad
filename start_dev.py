#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Development startup script for Globe View 3D project
Starts both backend and frontend in development mode
"""

import subprocess
import sys
import os
import time
import signal
import threading
from pathlib import Path

class DevServer:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.running = True
    
    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully."""
        print("\n[STOP] Shutting down development servers...")
        self.running = False
        
        if self.backend_process:
            self.backend_process.terminate()
        if self.frontend_process:
            self.frontend_process.terminate()
        
        print("[OK] Development servers stopped")
        sys.exit(0)
    
    def start_backend(self):
        """Start the FastAPI backend server."""
        print("[START] Starting FastAPI backend on http://localhost:8000...")
        try:
            # Set environment variables for development
            env = os.environ.copy()
            env['HOST'] = '127.0.0.1'
            env['PORT'] = '8000'
            env['CORS_ORIGINS'] = 'http://localhost:5173,http://localhost:8080'
            
            self.backend_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
                env=env
            )
            print("[OK] Backend server started")
        except Exception as e:
            print(f"[ERROR] Failed to start backend: {e}")
            return False
        return True
    
    def start_frontend(self):
        """Start the Vite frontend development server."""
        print("[START] Starting Vite frontend on http://localhost:5173...")
        try:
            # Check if package.json exists
            if not Path("package.json").exists():
                print("[ERROR] package.json not found. Make sure you're in the project root.")
                return False
            
            # Set environment variable for API URL
            env = os.environ.copy()
            env['VITE_API_BASE_URL'] = 'http://localhost:8000'
            
            self.frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                env=env
            )
            print("[OK] Frontend server started")
        except Exception as e:
            print(f"[ERROR] Failed to start frontend: {e}")
            return False
        return True
    
    def check_dependencies(self):
        """Check if all dependencies are installed."""
        print("[CHECK] Checking dependencies...")
        
        # Check Python dependencies
        try:
            import fastapi
            import uvicorn
            import spacy
            print("[OK] Python dependencies found")
        except ImportError as e:
            print(f"[ERROR] Missing Python dependency: {e}")
            print("   Run: python setup.py")
            return False
        
        # Check spaCy model
        try:
            nlp = spacy.load("en_core_web_sm")
            print("[OK] spaCy English model found")
        except OSError:
            print("[ERROR] spaCy English model not found")
            print("   Run: python -m spacy download en_core_web_sm")
            return False
        
        # Check Node.js dependencies
        if Path("node_modules").exists():
            print("[OK] Node.js dependencies found")
        else:
            print("[ERROR] Node.js dependencies not found")
            print("   Run: npm install")
            return False
        
        return True
    
    def run(self):
        """Run the development servers."""
        # Register signal handler for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        
        print("Globe View 3D - Development Server")
        print("=" * 40)
        
        # Check dependencies
        if not self.check_dependencies():
            print("\n[ERROR] Dependencies missing. Please run setup first:")
            print("   python setup.py")
            sys.exit(1)
        
        # Start backend
        if not self.start_backend():
            sys.exit(1)
        
        # Wait a moment for backend to start
        time.sleep(2)
        
        # Start frontend
        if not self.start_frontend():
            if self.backend_process:
                self.backend_process.terminate()
            sys.exit(1)
        
        print("\n[SUCCESS] Development servers running!")
        print("Available services:")
        print("   Backend API: http://localhost:8000")
        print("   Frontend:    http://localhost:5173")
        print("   API Health:  http://localhost:8000/api/health")
        print("\nPress Ctrl+C to stop all servers")
        
        # Keep the main thread alive
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    server = DevServer()
    server.run() 