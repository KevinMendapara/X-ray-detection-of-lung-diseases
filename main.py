"""
TB Detect AI - Main Entry Point
"""
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from run import *

if __name__ == "__main__":
    import uvicorn
    from backend.app.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
