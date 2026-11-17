import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="radiologist") # admin, radiologist, researcher
    full_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(50), primary_key=True, index=True) # e.g. PT-2026-0001
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    contact_number = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    medical_history = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True) # JSON or comma-separated
    previous_tb_history = Column(String(20), default="No") # Yes, No, Unknown
    symptom_duration = Column(String(50), nullable=True) # e.g. "2-3 weeks", "> 1 month"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    analyses = relationship("Analysis", back_populates="patient", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    original_image_path = Column(String(255), nullable=False)
    processed_image_path = Column(String(255), nullable=False)
    heatmap_image_path = Column(String(255), nullable=False)
    overlay_image_path = Column(String(255), nullable=False)
    
    prediction = Column(String(50), nullable=False) # TB Suspected, TB Not Detected, Inconclusive
    confidence_score = Column(Float, nullable=False) # 0.0 - 100.0 %
    svm_decision_score = Column(Float, nullable=False) # distance to margin
    
    # Anatomical zone activation data (JSON serialized)
    zone_analysis_json = Column(Text, nullable=False)
    image_quality_status = Column(String(50), default="Optimal Diagnostic Quality")
    model_version = Column(String(50), default="DenseNet121-SVM-v1.0 (ICMR Cohort)")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="analyses")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user = Column(String(50), default="System")
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
