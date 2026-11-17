import sys
import os

# Ensure project root and backend directories are always in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

for path in [PROJECT_ROOT, BACKEND_ROOT, CURRENT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Robust modular imports
try:
    from backend.app.database import init_db, DBManager
    from backend.app.api.auth import router as auth_router, hash_password
    from backend.app.api.patients import router as patients_router
    from backend.app.api.xray import router as xray_router
    from backend.app.api.reports import router as reports_router
    from backend.app.api.admin import router as admin_router, fetch_dashboard_stats
    from backend.app.api.contact import router as contact_router
    from backend.app.storage import UPLOAD_DIR, REPORTS_DIR
except (ImportError, ValueError):
    try:
        from app.database import init_db, DBManager
        from app.api.auth import router as auth_router, hash_password
        from app.api.patients import router as patients_router
        from app.api.xray import router as xray_router
        from app.api.reports import router as reports_router
        from app.api.admin import router as admin_router, fetch_dashboard_stats
        from app.api.contact import router as contact_router
        from app.storage import UPLOAD_DIR, REPORTS_DIR
    except (ImportError, ValueError):
        from database import init_db, DBManager
        from api.auth import router as auth_router, hash_password
        from api.patients import router as patients_router
        from api.xray import router as xray_router
        from api.reports import router as reports_router
        from api.admin import router as admin_router, fetch_dashboard_stats
        from api.contact import router as contact_router
        from storage import UPLOAD_DIR, REPORTS_DIR

# Initialize database tables
init_db()

app = FastAPI(
    title="TB Detect AI – Explainable CXR Decision Support API",
    description="Research & Educational AI Backend for Pulmonary Tuberculosis Detection using DenseNet121 + SVM + Grad-CAM++",
    version="1.0.0"
)

# CORS configuration
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX") or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads and reports static mounts
FRONTEND_DIST = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "frontend", "dist"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

# Register Routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(xray_router)
app.include_router(reports_router)
app.include_router(admin_router)
app.include_router(contact_router)

# Direct alias for endpoint specification: GET /api/dashboard/stats
@app.get("/api/dashboard/stats")
def dashboard_stats_endpoint():
    return fetch_dashboard_stats()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TB Detect AI Backend",
        "model_architecture": "DenseNet121 + SVM + Grad-CAM++",
        "version": "1.0.0",
        "dataset": "ICMR-NIRT National Tuberculosis CXR Registry"
    }

# Mount compiled frontend at the end (catch-all for SPA routes)
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

# Startup database seeding
def startup_seed():
    admin = DBManager.get_user_by_username("admin")
    if not admin:
        DBManager.create_user(
            username="admin",
            email="admin@tbdetect.ai",
            hashed_password=hash_password("admin123"),
            role="admin",
            full_name="Chief Medical Officer & Administrator"
        )
        print("Default admin user created: admin / admin123")

    patients = DBManager.get_patients()
    if len(patients) == 0:
        DBManager.create_patient(
            pid="PT-2026-0001",
            full_name="Rajesh Kumar",
            age=46,
            gender="Male",
            contact="+91 98765 43210",
            email="rajesh.k@example.com",
            symptoms="Persistent productive cough, low-grade evening fever, night sweats",
            duration="3-4 weeks",
            previous_tb="No",
            medical_history="Type 2 Diabetes (controlled), Non-smoker"
        )
        DBManager.create_patient(
            pid="PT-2026-0002",
            full_name="Priya Sharma",
            age=29,
            gender="Female",
            contact="+91 91234 56789",
            email="priya.s@example.com",
            symptoms="Routine pre-employment screening CXR",
            duration="Asymptomatic",
            previous_tb="No",
            medical_history="No chronic conditions"
        )
        DBManager.create_patient(
            pid="PT-2026-0003",
            full_name="Amitabh Sen",
            age=58,
            gender="Male",
            contact="+91 98111 22334",
            email="amitabh.sen@example.com",
            symptoms="Chronic hemoptysis (streaks of blood in sputum), unintended weight loss (6kg)",
            duration="> 1 month",
            previous_tb="Yes (Treated 8 years ago)",
            medical_history="Former smoker (20 pack-years)"
        )
        print("Seeded initial clinical screening patients.")

startup_seed()

if __name__ == "__main__":
    import uvicorn
    print("Starting TB Detect AI server via python direct execution on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
