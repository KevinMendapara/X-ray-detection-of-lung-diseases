import sys
import os
from fastapi import APIRouter, Depends, HTTPException
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
    from backend.app.api.auth import get_current_user
except (ImportError, ValueError):
    try:
        from app.database import DBManager
        from app.api.auth import get_current_user
    except (ImportError, ValueError):
        from database import DBManager
        from api.auth import get_current_user

router = APIRouter(prefix="/api/contact", tags=["Contact"] )

class ContactSubmission(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    inquiry_type: str = Field(min_length=2, max_length=80)
    subject: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=5, max_length=600)

@router.post("")
def submit_contact(payload: ContactSubmission):
    if "@" not in payload.email or payload.email.startswith("@") or payload.email.endswith("@"): 
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    row = DBManager.create_contact_message(payload.name.strip(), payload.email.strip(), payload.inquiry_type, payload.subject.strip(), payload.message.strip())
    DBManager.log_audit("CONTACT_MESSAGE_RECEIVED", f"Project inquiry #{row['id']} received")
    return {"id": row["id"], "status": "received", "created_at": row["created_at"]}

@router.get("/inbox")
def contact_inbox(limit: int = 100, current_user=Depends(get_current_user)):
    if current_user.get("role") not in {"admin", "radiologist", "researcher"}:
        raise HTTPException(status_code=403, detail="Staff access required")
    return DBManager.get_contact_messages(max(1, min(limit, 250)))
