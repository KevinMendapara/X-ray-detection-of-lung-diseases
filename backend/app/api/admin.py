import sys
import os
import json
from fastapi import APIRouter, HTTPException, Depends

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for path in [PROJECT_ROOT, BACKEND_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.database import DBManager, get_connection
    from backend.app.api.auth import get_current_user
except (ImportError, ValueError):
    try:
        from app.database import DBManager, get_connection
        from app.api.auth import get_current_user
    except (ImportError, ValueError):
        from database import DBManager, get_connection
        from api.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin & System"])

METRICS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "model_metrics.json"))

def fetch_dashboard_stats():
    conn = get_connection()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) as cnt FROM patients")
    total_patients = c.fetchone()["cnt"]

    c.execute("SELECT COUNT(*) as cnt FROM analyses")
    total_analyses = c.fetchone()["cnt"]

    c.execute("SELECT COUNT(*) as cnt FROM analyses WHERE prediction = 'TB Suspected'")
    suspected_cases = c.fetchone()["cnt"]

    c.execute("SELECT COUNT(*) as cnt FROM analyses WHERE prediction = 'TB Not Detected by Model'")
    normal_cases = c.fetchone()["cnt"]

    c.execute("SELECT COUNT(*) as cnt FROM analyses WHERE prediction = 'Inconclusive'")
    inconclusive_cases = c.fetchone()["cnt"]

    c.execute("SELECT COUNT(*) as cnt FROM analyses WHERE COALESCE(review_status, 'Pending Review') = 'Pending Review'")
    pending_reviews = c.fetchone()["cnt"]

    c.execute("SELECT gender, COUNT(*) as cnt FROM patients GROUP BY gender")
    gender_rows = c.fetchall()
    gender_counts = {"Male": 0, "Female": 0, "Other": 0}
    for r in gender_rows:
        g = r["gender"].capitalize() if r["gender"] else "Other"
        gender_counts[g] = r["cnt"]

    c.execute("""
        SELECT a.id, a.patient_id, a.prediction, a.confidence_score, a.created_at, p.full_name as patient_name
        FROM analyses a
        JOIN patients p ON a.patient_id = p.id
        ORDER BY a.created_at DESC LIMIT 5
    """)
    recent_list = c.fetchall()
    conn.close()

    # Load verified model metrics from file
    verified_metrics = {}
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            verified_metrics = json.load(f)

    return {
        "kpis": {
            "total_patients": total_patients,
            "total_analyses": total_analyses,
            "suspected_cases": suspected_cases,
            "normal_cases": normal_cases,
            "inconclusive_cases": inconclusive_cases,
            "pending_analyses": pending_reviews,
            "pending_reviews": pending_reviews,
            "model_accuracy_pct": verified_metrics.get("evaluation", {}).get("accuracy", 1.0) * 100,
            "model_sensitivity_pct": verified_metrics.get("evaluation", {}).get("sensitivity", 1.0) * 100,
            "model_specificity_pct": verified_metrics.get("evaluation", {}).get("specificity", 1.0) * 100,
            "roc_auc": verified_metrics.get("evaluation", {}).get("roc_auc", 1.0)
        },
        "model_performance": verified_metrics,
        "demographics": {
            "gender_distribution": gender_counts
        },
        "recent_activity": recent_list
    }

@router.get("/stats")
def get_dashboard_stats():
    return fetch_dashboard_stats()

@router.get("/metrics")
def get_model_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            return json.load(f)
    return {"status": "Model metrics file not found"}

@router.get("/logs")
def get_audit_logs(limit: int = 50):
    return DBManager.get_audit_logs(limit=limit)

@router.get("/users")
def get_users():
    return DBManager.get_all_users()


@router.get("/messages")
def get_contact_messages(current_user=Depends(get_current_user)):
    if current_user.get("role") not in {"admin", "radiologist", "researcher"}:
        raise HTTPException(status_code=403, detail="Staff access required")
    return DBManager.get_contact_messages(limit=250)
