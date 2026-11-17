import sys
import os
import json
import csv
import io
from datetime import date
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for path in [PROJECT_ROOT, BACKEND_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.database import DBManager
    from backend.app.services.pdf_generator import generate_pdf_report
    from backend.app.api.auth import get_current_user
except (ImportError, ValueError):
    try:
        from app.database import DBManager
        from app.services.pdf_generator import generate_pdf_report
        from app.api.auth import get_current_user
    except (ImportError, ValueError):
        from database import DBManager
        from services.pdf_generator import generate_pdf_report
        from api.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

REPORTS_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "reports"))
UPLOAD_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "uploads"))

@router.get("")
def list_reports(
    search: Optional[str] = None,
    prediction_filter: Optional[str] = None,
    review_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 500
):
    analyses = DBManager.get_analyses(search=search, prediction_filter=prediction_filter, review_status=review_status, start_date=start_date, end_date=end_date, limit=max(1, min(limit, 5000)))
    results = []
    for a in analyses:
        results.append({
            "id": a["id"],
            "patient_id": a["patient_id"],
            "patient_name": a.get("patient_name", "Unknown"),
            "patient_age": a.get("patient_age", "N/A"),
            "patient_gender": a.get("patient_gender", "N/A"),
            "prediction": a["prediction"],
            "confidence_score": a["confidence_score"],
            "svm_decision_score": a["svm_decision_score"],
            "model_version": a["model_version"],
            "created_at": a["created_at"],
            "review_status": a.get("review_status") or "Pending Review",
            "clinician_notes": a.get("clinician_notes") or "",
            "overlay_image_url": f"/uploads/{a['overlay_image_path']}",
            "pdf_url": f"/api/reports/{a['id']}/pdf"
        })
    return results

class ReviewUpdate(BaseModel):
    review_status: str
    clinician_notes: str = Field(default="", max_length=4000)


@router.get("/export.csv")
def export_reports_csv(
    search: Optional[str] = None,
    prediction_filter: Optional[str] = None,
    review_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    if current_user.get("role") not in {"admin", "radiologist", "researcher"}:
        raise HTTPException(status_code=403, detail="Staff access required")
    for value in (start_date, end_date):
        if value:
            try:
                date.fromisoformat(value)
            except ValueError:
                raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD format")
    rows = DBManager.get_analyses(search, prediction_filter, 5000, start_date, end_date, review_status)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Analysis ID", "Patient ID", "Patient name", "Prediction", "Confidence (%)", "Review status", "Clinician notes", "Created at", "Image quality", "Model version"])
    for row in rows:
        writer.writerow([row["id"], row["patient_id"], row.get("patient_name", ""), row["prediction"], row["confidence_score"], row.get("review_status") or "Pending Review", row.get("clinician_notes") or "", row["created_at"], row.get("image_quality_status", ""), row.get("model_version", "")])
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=tb-detect-analysis-summary.csv"})


@router.patch("/{analysis_id}/review")
def update_review(analysis_id: int, payload: ReviewUpdate, current_user=Depends(get_current_user)):
    if current_user.get("role") not in {"admin", "radiologist", "researcher"}:
        raise HTTPException(status_code=403, detail="Staff access required")
    allowed = {"Pending Review", "Reviewed", "Follow-up Required"}
    if payload.review_status not in allowed:
        raise HTTPException(status_code=422, detail=f"review_status must be one of: {', '.join(sorted(allowed))}")
    updated = DBManager.update_analysis_review(analysis_id, payload.review_status, payload.clinician_notes.strip())
    if not updated:
        raise HTTPException(status_code=404, detail="Analysis not found")
    DBManager.log_audit("ANALYSIS_REVIEW_UPDATED", f"Analysis #{analysis_id} marked {payload.review_status}", user=current_user.get("username", "Staff"))
    pdf_path = os.path.join(REPORTS_DIR, f"report_AR_{analysis_id:05d}.pdf")
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    return {"analysis_id": analysis_id, "review_status": updated.get("review_status"), "clinician_notes": updated.get("clinician_notes") or "", "reviewed_at": updated.get("reviewed_at")}


@router.get("/{analysis_id}")
def get_report(analysis_id: int):
    analysis = DBManager.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Report not found")

    patient = DBManager.get_patient_by_id(analysis["patient_id"]) or {}
    zone_data = json.loads(analysis["zone_analysis_json"]) if analysis.get("zone_analysis_json") else {}

    return {
        "analysis_id": analysis["id"],
        "patient": patient,
        "xray": {
            "original_image_url": f"/uploads/{analysis['original_image_path']}",
            "processed_image_url": f"/uploads/{analysis['processed_image_path']}",
            "heatmap_image_url": f"/uploads/{analysis['heatmap_image_path']}",
            "overlay_image_url": f"/uploads/{analysis['overlay_image_path']}",
            "quality_status": analysis.get("image_quality_status", "Optimal Diagnostic Quality"),
            "preprocessing": "Standard DICOM windowing / 224x224 RGB normalization"
        },
        "ai_results": {
            "prediction": analysis["prediction"],
            "confidence_score": analysis["confidence_score"],
            "svm_decision_score": analysis["svm_decision_score"],
            "model_architecture": "DenseNet121 Deep Feature Extractor + Support Vector Machine Classifier (RBF Kernel)",
            "model_version": analysis["model_version"],
            "explanation_target": zone_data.get("explanation_target"),
            "explanation_method": zone_data.get("explanation_method"),
            "interpretation": (
                "Feature vector activates SVM hyper-plane associated with pulmonary tuberculosis patterns."
                if "Suspected" in analysis["prediction"] else
                "Feature vector aligns with non-tuberculous normal control chest radiograph patterns."
            )
        },
        "zone_analysis": zone_data,
        "created_at": analysis["created_at"],
        "review": {"status": analysis.get("review_status") or "Pending Review", "clinician_notes": analysis.get("clinician_notes") or "", "reviewed_at": analysis.get("reviewed_at")},
        "pdf_download_url": f"/api/reports/{analysis['id']}/pdf"
    }

@router.get("/{analysis_id}/pdf")
def download_pdf_report(analysis_id: int):
    analysis = DBManager.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis report not found")

    pdf_filename = f"report_AR_{analysis['id']:05d}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)

    if not os.path.exists(pdf_path):
        patient = DBManager.get_patient_by_id(analysis["patient_id"]) or {}
        analysis_pdf = {
            **analysis,
            "full_processed_path": os.path.join(UPLOAD_DIR, analysis["processed_image_path"]),
            "full_heatmap_path": os.path.join(UPLOAD_DIR, analysis["heatmap_image_path"]),
            "full_overlay_path": os.path.join(UPLOAD_DIR, analysis["overlay_image_path"])
        }
        generate_pdf_report(analysis_pdf, patient, pdf_path)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"TB_Detect_Report_AR_{analysis['id']:05d}.pdf"
    )


