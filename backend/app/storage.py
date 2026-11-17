"""Configurable storage paths for local runs and hosted deployments."""

import os


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STORAGE_DIR = os.getenv("PULMOVISION_STORAGE_DIR")
if STORAGE_DIR:
    STORAGE_DIR = os.path.abspath(STORAGE_DIR)
    DB_PATH = os.path.abspath(os.getenv("PULMOVISION_DB_PATH", os.path.join(STORAGE_DIR, "tb_detect.db")))
    UPLOAD_DIR = os.path.abspath(os.getenv("PULMOVISION_UPLOAD_DIR", os.path.join(STORAGE_DIR, "uploads")))
    REPORTS_DIR = os.path.abspath(os.getenv("PULMOVISION_REPORTS_DIR", os.path.join(STORAGE_DIR, "reports")))
else:
    DB_PATH = os.path.abspath(
        os.getenv("PULMOVISION_DB_PATH", os.path.join(BACKEND_DIR, "data", "tb_detect.db"))
    )
    UPLOAD_DIR = os.path.abspath(
        os.getenv("PULMOVISION_UPLOAD_DIR", os.path.join(BACKEND_DIR, "uploads"))
    )
    REPORTS_DIR = os.path.abspath(
        os.getenv("PULMOVISION_REPORTS_DIR", os.path.join(BACKEND_DIR, "reports"))
    )

for directory in (os.path.dirname(DB_PATH), UPLOAD_DIR, REPORTS_DIR):
    os.makedirs(directory, exist_ok=True)
