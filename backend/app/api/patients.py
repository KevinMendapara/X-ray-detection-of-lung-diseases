import sys
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for path in [PROJECT_ROOT, BACKEND_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.database import DBManager
except (ImportError, ValueError):
    try:
        from app.database import DBManager
    except (ImportError, ValueError):
        from database import DBManager

router = APIRouter(prefix="/api/patients", tags=["Patients"])

class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    contact_number: Optional[str] = None
    email: Optional[str] = None
    medical_history: Optional[str] = None
    symptoms: Optional[str] = None
    previous_tb_history: Optional[str] = "No"
    symptom_duration: Optional[str] = None

@router.post("")
def create_patient(data: PatientCreate):
    pid = DBManager.get_next_patient_id()
    patient = DBManager.create_patient(
        pid=pid,
        full_name=data.full_name,
        age=data.age,
        gender=data.gender,
        contact=data.contact_number,
        email=data.email,
        medical_history=data.medical_history,
        symptoms=data.symptoms,
        previous_tb=data.previous_tb_history or "No",
        duration=data.symptom_duration
    )
    DBManager.log_audit("PATIENT_CREATE", f"Registered patient {pid}: {data.full_name}")
    return patient

@router.get("")
def list_patients(search: Optional[str] = None):
    patients = DBManager.get_patients(search)
    result = []
    for p in patients:
        analyses = DBManager.get_analyses_for_patient(p["id"])
        latest = analyses[0]["prediction"] if analyses else "None"
        result.append({
            **p,
            "analyses_count": len(analyses),
            "latest_prediction": latest
        })
    return result

class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[str] = Field(default=None, max_length=20)
    contact_number: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=100)
    medical_history: Optional[str] = Field(default=None, max_length=4000)
    symptoms: Optional[str] = Field(default=None, max_length=1000)
    previous_tb_history: Optional[str] = Field(default=None, max_length=50)
    symptom_duration: Optional[str] = Field(default=None, max_length=50)

@router.patch("/{patient_id}")
def update_patient(patient_id: str, data: PatientUpdate):
    if not DBManager.get_patient_by_id(patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = DBManager.update_patient(patient_id, data.dict(exclude_unset=True))
    DBManager.log_audit("PATIENT_UPDATE", f"Updated patient record {patient_id}")
    return patient


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    p = DBManager.get_patient_by_id(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    analyses = DBManager.get_analyses_for_patient(patient_id)
    for analysis in analyses:
        analysis["original_image_url"] = f"/uploads/{analysis['original_image_path']}"
        analysis["overlay_image_url"] = f"/uploads/{analysis['overlay_image_path']}"
        analysis["pdf_url"] = f"/api/reports/{analysis['id']}/pdf"
        analysis["review_status"] = analysis.get("review_status") or "Pending Review"
    return {**p, "analyses": analyses}
