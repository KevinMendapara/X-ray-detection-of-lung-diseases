import os
import sqlite3
import json
import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "tb_detect.db"))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = dict_factory
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()

    # Users table
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT DEFAULT 'radiologist',
        full_name TEXT,
        created_at TEXT,
        is_active INTEGER DEFAULT 1
    )
    """)

    # Patients table
    c.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        contact_number TEXT,
        email TEXT,
        medical_history TEXT,
        symptoms TEXT,
        previous_tb_history TEXT DEFAULT 'No',
        symptom_duration TEXT,
        created_at TEXT
    )
    """)

    # Analyses table
    c.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        original_image_path TEXT NOT NULL,
        processed_image_path TEXT NOT NULL,
        heatmap_image_path TEXT NOT NULL,
        overlay_image_path TEXT NOT NULL,
        prediction TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        svm_decision_score REAL NOT NULL,
        zone_analysis_json TEXT NOT NULL,
        image_quality_status TEXT DEFAULT 'Optimal Diagnostic Quality',
        model_version TEXT DEFAULT 'DenseNet121-SVM-v1.0 (ICMR Cohort)',
        created_at TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
    """)

    # Review workflow and local project inbox
    c.execute("""
    CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        inquiry_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'New',
        created_at TEXT NOT NULL
    )
    """)
    analysis_columns = {row['name'] for row in c.execute("PRAGMA table_info(analyses)").fetchall()}
    if 'review_status' not in analysis_columns:
        c.execute("ALTER TABLE analyses ADD COLUMN review_status TEXT DEFAULT 'Pending Review'")
    if 'clinician_notes' not in analysis_columns:
        c.execute("ALTER TABLE analyses ADD COLUMN clinician_notes TEXT")
    if 'reviewed_at' not in analysis_columns:
        c.execute("ALTER TABLE analyses ADD COLUMN reviewed_at TEXT")

    # Audit Logs table
    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT DEFAULT 'System',
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT DEFAULT '127.0.0.1',
        timestamp TEXT
    )
    """)

    conn.commit()
    conn.close()

# Helper queries
class DBManager:
    @staticmethod
    def create_user(username, email, hashed_password, role="radiologist", full_name=None):
        conn = get_connection()
        c = conn.cursor()
        now = datetime.datetime.utcnow().isoformat()
        c.execute("""
            INSERT INTO users (username, email, hashed_password, role, full_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, email, hashed_password, role, full_name or username, now))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return DBManager.get_user_by_id(user_id)

    @staticmethod
    def get_user_by_username(username):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = c.fetchone()
        conn.close()
        return row

    @staticmethod
    def get_user_by_id(user_id):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = c.fetchone()
        conn.close()
        return row

    @staticmethod
    def get_all_users():
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT id, username, email, role, full_name, created_at, is_active FROM users")
        rows = c.fetchall()
        conn.close()
        return rows

    @staticmethod
    def create_patient(pid, full_name, age, gender, contact=None, email=None, medical_history=None, symptoms=None, previous_tb="No", duration=None):
        conn = get_connection()
        c = conn.cursor()
        now = datetime.datetime.utcnow().isoformat()
        c.execute("""
            INSERT INTO patients (id, full_name, age, gender, contact_number, email, medical_history, symptoms, previous_tb_history, symptom_duration, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (pid, full_name, age, gender, contact, email, medical_history, symptoms, previous_tb, duration, now))
        conn.commit()
        conn.close()
        return DBManager.get_patient_by_id(pid)

    @staticmethod
    def get_patient_by_id(pid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM patients WHERE id = ?", (pid,))
        row = c.fetchone()
        conn.close()
        return row

    @staticmethod
    def get_patients(search=None):
        conn = get_connection()
        c = conn.cursor()
        if search:
            s = f"%{search}%"
            c.execute("SELECT * FROM patients WHERE id LIKE ? OR full_name LIKE ? ORDER BY created_at DESC", (s, s))
        else:
            c.execute("SELECT * FROM patients ORDER BY created_at DESC")
        rows = c.fetchall()
        conn.close()
        return rows

    @staticmethod
    def update_patient(pid, updates):
        allowed = {"full_name", "age", "gender", "contact_number", "email", "medical_history", "symptoms", "previous_tb_history", "symptom_duration"}
        values = {key: value for key, value in updates.items() if key in allowed}
        if not values:
            return DBManager.get_patient_by_id(pid)
        conn = get_connection()
        c = conn.cursor()
        assignments = ", ".join(f"{key} = ?" for key in values)
        c.execute(f"UPDATE patients SET {assignments} WHERE id = ?", [*values.values(), pid])
        conn.commit()
        updated = c.rowcount > 0
        conn.close()
        return DBManager.get_patient_by_id(pid) if updated else None

    @staticmethod
    def get_next_patient_id():
        conn = get_connection()
        c = conn.cursor()
        year = datetime.datetime.now().year
        c.execute("SELECT COUNT(*) as cnt FROM patients")
        cnt = c.fetchone()['cnt'] + 1
        conn.close()
        while True:
            pid = f"PT-{year}-{cnt:04d}"
            if not DBManager.get_patient_by_id(pid):
                return pid
            cnt += 1

    @staticmethod
    def create_analysis(patient_id, original_img, processed_img, heatmap_img, overlay_img, prediction, confidence, decision_score, zone_json, quality="Optimal Diagnostic Quality", model_version="DenseNet121-SVM-v1.0 (ICMR Cohort)"):
        conn = get_connection()
        c = conn.cursor()
        now = datetime.datetime.utcnow().isoformat()
        c.execute("""
            INSERT INTO analyses (patient_id, original_image_path, processed_image_path, heatmap_image_path, overlay_image_path, prediction, confidence_score, svm_decision_score, zone_analysis_json, image_quality_status, model_version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (patient_id, original_img, processed_img, heatmap_img, overlay_img, prediction, confidence, decision_score, zone_json, quality, model_version, now))
        conn.commit()
        analysis_id = c.lastrowid
        conn.close()
        return DBManager.get_analysis_by_id(analysis_id)

    @staticmethod
    def get_analysis_by_id(aid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM analyses WHERE id = ?", (aid,))
        row = c.fetchone()
        conn.close()
        return row

    @staticmethod
    def get_analyses(search=None, prediction_filter=None, limit=500, start_date=None, end_date=None, review_status=None):
        conn = get_connection()
        c = conn.cursor()
        query = """
            SELECT a.*, p.full_name as patient_name, p.age as patient_age, p.gender as patient_gender
            FROM analyses a
            JOIN patients p ON a.patient_id = p.id
        """
        params = []
        conditions = []
        if search:
            conditions.append("(p.id LIKE ? OR p.full_name LIKE ?)")
            s = f"%{search}%"
            params.extend([s, s])
        if prediction_filter and prediction_filter != "All":
            conditions.append("a.prediction = ?")
            params.append(prediction_filter)

        if start_date:
            conditions.append("date(a.created_at) >= date(?)")
            params.append(start_date)
        if end_date:
            conditions.append("date(a.created_at) <= date(?)")
            params.append(end_date)
        if review_status and review_status != "All":
            conditions.append("COALESCE(a.review_status, 'Pending Review') = ?")
            params.append(review_status)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY a.created_at DESC LIMIT ?"
        params.append(limit)

        c.execute(query, params)
        rows = c.fetchall()
        conn.close()
        return rows

    @staticmethod
    def get_analyses_for_patient(pid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM analyses WHERE patient_id = ? ORDER BY created_at DESC", (pid,))
        rows = c.fetchall()
        conn.close()
        return rows


    @staticmethod
    def update_analysis_review(aid, status, notes):
        conn = get_connection()
        c = conn.cursor()
        reviewed_at = datetime.datetime.utcnow().isoformat() if status != "Pending Review" else None
        c.execute("UPDATE analyses SET review_status = ?, clinician_notes = ?, reviewed_at = ? WHERE id = ?", (status, notes, reviewed_at, aid))
        conn.commit()
        updated = c.rowcount > 0
        conn.close()
        return DBManager.get_analysis_by_id(aid) if updated else None

    @staticmethod
    def create_contact_message(name, email, inquiry_type, subject, message):
        conn = get_connection()
        c = conn.cursor()
        now = datetime.datetime.utcnow().isoformat()
        c.execute("INSERT INTO contact_messages (name, email, inquiry_type, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)", (name, email, inquiry_type, subject, message, now))
        conn.commit()
        row_id = c.lastrowid
        c.execute("SELECT * FROM contact_messages WHERE id = ?", (row_id,))
        row = c.fetchone()
        conn.close()
        return row

    @staticmethod
    def get_contact_messages(limit=100):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return rows

    @staticmethod
    def log_audit(action, details=None, user="System", ip="127.0.0.1"):
        conn = get_connection()
        c = conn.cursor()
        now = datetime.datetime.utcnow().isoformat()
        c.execute("""
            INSERT INTO audit_logs (user, action, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (user, action, details, ip, now))
        conn.commit()
        conn.close()

    @staticmethod
    def get_audit_logs(limit=50):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return rows
