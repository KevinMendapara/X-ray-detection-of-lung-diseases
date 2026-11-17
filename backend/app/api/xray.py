import sys
import os
import uuid
import json
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from PIL import Image

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

for path in [PROJECT_ROOT, BACKEND_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.app.database import DBManager
    from backend.app.services.ml_engine import get_ml_engine
    from backend.app.services.pdf_generator import generate_pdf_report
    from backend.app.storage import UPLOAD_DIR, REPORTS_DIR
except (ImportError, ValueError):
    try:
        from app.database import DBManager
        from app.services.ml_engine import get_ml_engine
        from app.services.pdf_generator import generate_pdf_report
        from app.storage import UPLOAD_DIR, REPORTS_DIR
    except (ImportError, ValueError):
        from database import DBManager
        from services.ml_engine import get_ml_engine
        from services.pdf_generator import generate_pdf_report
        from storage import UPLOAD_DIR, REPORTS_DIR

router = APIRouter(prefix="/api/xray", tags=["X-Ray Analysis"])


def assess_image_quality(path, ext=None):
    """Run advisory technical checks. These checks do not establish diagnostic image quality."""
    checks = []
    width = height = None
    blur_score = None
    is_dicom = (ext or os.path.splitext(path)[1].lower()) in {".dcm", ".dicom"}
    try:
        if is_dicom:
            import pydicom
            dataset = pydicom.dcmread(path, stop_before_pixels=True)
            height, width = int(dataset.Rows), int(dataset.Columns)
        else:
            with Image.open(path) as image:
                width, height = image.size
            try:
                import cv2
                gray = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
                if gray is not None:
                    blur_score = round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 1)
            except Exception:
                blur_score = None
    except Exception as exc:
        if is_dicom:
            raise ValueError(f"DICOM header could not be read: {exc}")
        raise ValueError(f"Image could not be read: {exc}")

    if width is not None and height is not None:
        small = min(width, height) < 512
        checks.append({"code": "resolution", "label": "Image dimensions", "status": "review" if small else "pass", "detail": f"{width} x {height}px" + (" - small image; confirm detail is adequate" if small else "")})
        landscape = width > height * 1.05
        checks.append({"code": "orientation", "label": "Orientation", "status": "review" if landscape else "pass", "detail": "Landscape image - confirm it is a frontal chest view" if landscape else "Portrait or square image"})
    if blur_score is not None:
        blurry = blur_score < 45
        checks.append({"code": "sharpness", "label": "Sharpness estimate", "status": "review" if blurry else "pass", "detail": f"Possible blur (edge variance {blur_score})" if blurry else f"No strong blur signal (edge variance {blur_score})"})
    if is_dicom:
        checks.append({"code": "dicom", "label": "DICOM metadata", "status": "pass", "detail": "DICOM image header read successfully"})
    flags = [item["label"].lower() for item in checks if item["status"] == "review"]
    status = "Review suggested: " + ", ".join(flags) if flags else "Technical checks passed - clinician review still required"
    return {"quality_status": status, "quality_checks": checks, "image_dimensions": {"width": width, "height": height}, "quality_advisory": "Automated technical checks are heuristic and do not determine whether an image is diagnostically adequate."}


SAMPLE_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "ml", "data", "sample_xrays"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.get("/samples")
def get_sample_xrays():
    """Returns sample ICMR test images for one-click testing"""
    samples = []
    if os.path.exists(SAMPLE_DIR):
        for f in os.listdir(SAMPLE_DIR):
            if f.endswith('.png') or f.endswith('.jpg'):
                is_tb = "tb" in f.lower()
                dest = os.path.join(UPLOAD_DIR, f)
                if not os.path.exists(dest):
                    shutil.copyfile(os.path.join(SAMPLE_DIR, f), dest)
                samples.append({
                    "id": f,
                    "filename": f,
                    "label": "Tuberculosis (ICMR Confirmed CXR)" if is_tb else "Normal Control (ICMR Confirmed CXR)",
                    "category": "TB Suspected" if is_tb else "Normal",
                    "preview_url": f"/uploads/{f}"
                })
    return samples

@router.post("/quality-check")
async def quality_check_xray(file: UploadFile = File(...)):
    allowed = {".png", ".jpg", ".jpeg", ".dicom", ".dcm"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Choose a PNG, JPG, JPEG, or DICOM image")
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds the 25 MB limit")
    temporary = os.path.join(UPLOAD_DIR, f"quality_{uuid.uuid4().hex[:12]}{ext}")
    try:
        with open(temporary, "wb") as output:
            output.write(content)
        return assess_image_quality(temporary, ext)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Image quality checks could not be completed: {exc}")
    finally:
        if os.path.exists(temporary):
            os.remove(temporary)


@router.post("/upload")
async def upload_xray(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None)
):
    allowed = ['.png', '.jpg', '.jpeg', '.dicom', '.dcm']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: PNG, JPG, JPEG, DICOM")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds the 25 MB limit")
    file_id = str(uuid.uuid4())[:12]
    saved_filename = f"upload_{file_id}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)
    with open(saved_path, "wb") as buffer:
        buffer.write(content)

    try:
        quality = assess_image_quality(saved_path, ext)
    except Exception as e:
        os.remove(saved_path)
        raise HTTPException(status_code=400, detail=f"Corrupt or unreadable image: {str(e)}")

    return {
        "filename": saved_filename,
        "image_url": f"/uploads/{saved_filename}",
        "file_size_bytes": len(content),
        **quality,
        "patient_id": patient_id
    }

@router.post("/predict")
def predict_xray(
    image_filename: str = Form(...),
    patient_id: str = Form(...)
):
    patient = DBManager.get_patient_by_id(patient_id)
    if not patient:
        patient = DBManager.create_patient(
            pid=patient_id,
            full_name="Screening Subject",
            age=35,
            gender="Unspecified",
            symptoms="Direct CXR Analysis"
        )

    input_path = os.path.join(UPLOAD_DIR, image_filename)
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Uploaded X-ray file not found on server")

    engine = get_ml_engine()
    prefix = f"{patient_id}_{str(uuid.uuid4())[:8]}"

    try:
        res = engine.analyze(input_path, UPLOAD_DIR, prefix)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")

    proc_rel = os.path.basename(res["processed_image_path"])
    heat_rel = os.path.basename(res["heatmap_image_path"])
    over_rel = os.path.basename(res["overlay_image_path"])

    analysis = DBManager.create_analysis(
        patient_id=patient["id"],
        original_img=image_filename,
        processed_img=proc_rel,
        heatmap_img=heat_rel,
        overlay_img=over_rel,
        prediction=res["prediction"],
        confidence=res["confidence_score"],
        decision_score=res["svm_decision_score"],
        zone_json=json.dumps(res["zone_analysis"]),
        quality=assess_image_quality(input_path)["quality_status"],
        model_version=res["model_version"]
    )

    # Pre-generate PDF report
    pdf_filename = f"report_AR_{analysis['id']:05d}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)
    try:
        analysis_pdf_dict = {
            **analysis,
            "full_processed_path": res["processed_image_path"],
            "full_heatmap_path": res["heatmap_image_path"],
            "full_overlay_path": res["overlay_image_path"]
        }
        generate_pdf_report(analysis_pdf_dict, patient, pdf_path)
    except Exception as pdf_err:
        print(f"Warning: PDF pre-generation error: {pdf_err}")

    DBManager.log_audit(
        "XRAY_ANALYSIS",
        f"Analysis #{analysis['id']} for {patient['id']}: {res['prediction']} ({res['confidence_score']}%)"
    )

    return {
        "analysis_id": analysis["id"],
        "patient_id": patient["id"],
        "patient_name": patient["full_name"],
        "prediction": res["prediction"],
        "confidence_score": res["confidence_score"],
        "tb_probability_pct": res["tb_probability_pct"],
        "normal_probability_pct": res["normal_probability_pct"],
        "svm_decision_score": res["svm_decision_score"],
        "zone_analysis": res["zone_analysis"],
        "original_image_url": f"/uploads/{image_filename}",
        "processed_image_url": f"/uploads/{proc_rel}",
        "heatmap_image_url": f"/uploads/{heat_rel}",
        "overlay_image_url": f"/uploads/{over_rel}",
        "model_architecture": res["model_architecture"],
        "model_version": res["model_version"],
        "created_at": analysis["created_at"],
        "quality_status": analysis.get("image_quality_status"),
        "review_status": analysis.get("review_status") or "Pending Review"
    }

@router.post("/gradcam")
def get_gradcam_details(analysis_id: int = Form(...)):
    analysis = DBManager.get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    zone_data = json.loads(analysis["zone_analysis_json"]) if analysis.get("zone_analysis_json") else {}

    return {
        "analysis_id": analysis["id"],
        "patient_id": analysis["patient_id"],
        "prediction": analysis["prediction"],
        "confidence_score": analysis["confidence_score"],
        "svm_decision_score": analysis["svm_decision_score"],
        "original_image_url": f"/uploads/{analysis['original_image_path']}",
        "processed_image_url": f"/uploads/{analysis['processed_image_path']}",
        "heatmap_image_url": f"/uploads/{analysis['heatmap_image_path']}",
        "overlay_image_url": f"/uploads/{analysis['overlay_image_path']}",
        "zone_analysis": zone_data,
        "model_version": analysis["model_version"]
    }
