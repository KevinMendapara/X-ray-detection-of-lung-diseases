"""
TB Detect AI - Root Runner
This script sets up sys.path automatically to prevent ModuleNotFoundError
and starts the TB Detect AI backend server (which also serves the frontend build).
"""

import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
APP_DIR = os.path.join(BACKEND_DIR, "app")

for p in [PROJECT_ROOT, BACKEND_DIR, APP_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    import uvicorn
    import socket

    def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                return s.connect_ex((host, port)) == 0
        except Exception:
            return False

    print("=" * 70)
    print("  TB Detect AI - Tuberculosis Detection & Explainable CXR Analysis")
    print("=" * 70)
    print(f"  Working Directory: {PROJECT_ROOT}")
    print(f"  Backend API Docs:  http://127.0.0.1:8000/docs")
    print(f"  Application UI:    http://127.0.0.1:8000")
    print(f"  Frontend Dev Port: http://localhost:3000 (if running Vite)")
    print("=" * 70)

    if is_port_in_use(8000):
        print("\n[NOTE] Port 8000 is ALREADY ACTIVE and serving the TB Detect AI system!")
        print("-> The server is already running in the background.")
        print("-> You can open http://127.0.0.1:8000 or http://localhost:3000 in your browser directly.")
        print("-> If you want to restart it, terminate the existing process on port 8000 first.\n")
        sys.exit(0)
    
    # Import app cleanly
    try:
        from backend.app.main import app
    except ImportError:
        try:
            from app.main import app
        except ImportError:
            from main import app
            
    try:
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except OSError as e:
        if "10048" in str(e):
            print("\n[NOTE] Port 8000 is already in use by another running instance of TB Detect AI.")
            print("-> Access the live application at: http://127.0.0.1:8000")
        else:
            raise e
